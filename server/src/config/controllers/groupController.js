import db from '../database.js'
import { createGroup, findGroupByInviteCode, joinGroup } from '../models/Group.js'
import { createNotification } from '../services/notificationService.js'

export async function listGroups(req, res) {
	try {
		const { rows } = await db.query(
			`SELECT g.id, g.name, g.description, g.owner_id, g.created_at,
						gm.role AS member_role,
						CASE WHEN gm.role = 'admin' THEN g.invite_code ELSE NULL END AS admin_invite_code,
						COUNT(gm2.user_id) AS member_count
			 FROM groups g
			 JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
			 JOIN group_members gm2 ON gm2.group_id = g.id
			 WHERE g.id IN (
				 SELECT group_id
				 FROM group_members
				 WHERE user_id = $1
			 )
			 GROUP BY g.id, gm.role
			 ORDER BY g.created_at DESC`,
			[req.user.id, req.user.id],
		)

		return res.json({ groups: rows })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to list groups', error: error.message })
	}
}

export async function createGroupItem(req, res) {
	try {
		const { name, description } = req.body
		if (!name) {
			return res.status(400).json({ message: 'name is required' })
		}

		const group = await createGroup({
			name,
			description,
			ownerId: req.user.id,
		})

		return res.status(201).json({ group })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to create group', error: error.message })
	}
}

export async function joinGroupItem(req, res) {
	try {
		const inviteCode = String(req.body.code || req.params.code || req.params.id || '').trim()
		if (!inviteCode) {
			return res.status(400).json({ message: 'Invite code is required' })
		}

		if (!/^\d{6}$/.test(inviteCode)) {
			return res.status(400).json({ message: 'Invite code must be exactly 6 digits' })
		}

		const group = await findGroupByInviteCode(inviteCode)
		if (!group) {
			return res.status(404).json({ message: 'Group not found' })
		}

		await joinGroup(group.id, req.user.id)
		return res.json({ message: 'Joined group successfully' })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to join group', error: error.message })
	}
}

export async function leaveGroupItem(req, res) {
	try {
		const groupId = Number(req.params.id)
		const userId = req.user.id
		const action = String(req.body.action || 'transfer').trim().toLowerCase()

		if (!groupId) {
			return res.status(400).json({ message: 'Invalid group id' })
		}

		if (!['transfer', 'delete'].includes(action)) {
			return res.status(400).json({ message: 'Invalid action' })
		}

		const { rows: membershipRows } = await db.query(
			`SELECT id, group_id, user_id, role, joined_at
			 FROM group_members
			 WHERE group_id = $1 AND user_id = $2
			 LIMIT 1`,
			[groupId, userId],
		)

		if (membershipRows.length === 0) {
			return res.status(404).json({ message: 'You are not a member of this group' })
		}

		const membership = membershipRows[0]
		const { rows: groupRows } = await db.query(
			`SELECT id, name, owner_id
			 FROM groups
			 WHERE id = $1
			 LIMIT 1`,
			[groupId],
		)

		if (groupRows.length === 0) {
			return res.status(404).json({ message: 'Group not found' })
		}

		const group = groupRows[0]

		if (membership.role !== 'admin') {
			await db.query(
				`DELETE FROM group_members
				 WHERE group_id = $1 AND user_id = $2`,
				[groupId, userId],
			)
			return res.json({ message: 'You left the group successfully' })
		}

		const { rows: otherMembers } = await db.query(
			`SELECT user_id
			 FROM group_members
			 WHERE group_id = $1 AND user_id != $2
			 ORDER BY joined_at ASC, user_id ASC`,
			[groupId, userId],
		)

		if (action === 'delete') {
			for (const member of otherMembers) {
				await createNotification(db, {
					userId: member.user_id,
					type: 'reminder',
					message: `Group update: "${group.name}" was deleted by the admin.`,
				})
			}

			await db.query(`DELETE FROM group_members WHERE group_id = $1`, [groupId])
			await db.query(`DELETE FROM groups WHERE id = $1`, [groupId])
			return res.json({ message: 'Group deleted successfully and members were notified.' })
		}

		if (otherMembers.length === 0) {
			await db.query(`DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`, [groupId, userId])
			await db.query(`DELETE FROM groups WHERE id = $1`, [groupId])
			return res.json({ message: 'You left the group and the group was deleted because no members remained.' })
		}

		const nextAdminId = otherMembers[0].user_id
		await db.query(
			`UPDATE group_members
			 SET role = 'admin'
			 WHERE group_id = $1 AND user_id = $2`,
			[groupId, nextAdminId],
		)
		await db.query(
			`UPDATE groups
			 SET owner_id = $1
			 WHERE id = $2`,
			[nextAdminId, groupId],
		)
		await db.query(
			`DELETE FROM group_members
			 WHERE group_id = $1 AND user_id = $2`,
			[groupId, userId],
		)

		await createNotification(db, {
			userId: nextAdminId,
			type: 'reminder',
			message: `Group update: you are now the admin of "${group.name}".`,
		})

		return res.json({
			message: 'You left the group successfully. The next member became the new admin.',
			newAdminId: nextAdminId,
		})
	} catch (error) {
		return res.status(500).json({ message: 'Failed to leave group', error: error.message })
	}
}

export async function groupLeaderboard(req, res) {
	try {
		const groupId = Number(req.params.id)
		if (!groupId) {
			return res.status(400).json({ message: 'Invalid group id' })
		}

		const { rows } = await db.query(
			`SELECT u.id, u.name,
						COUNT(hc.id) AS completions,
						COALESCE(MAX(h.best_streak), 0) AS best_streak
			 FROM group_members gm
			 JOIN users u ON u.id = gm.user_id
			 LEFT JOIN habits h ON h.user_id = u.id
			 LEFT JOIN habit_completions hc ON hc.habit_id = h.id
						AND hc.completed_at >= datetime('now', '-30 days')
			 WHERE gm.group_id = $1
			 GROUP BY u.id, u.name
			 ORDER BY completions DESC, best_streak DESC, u.name ASC`,
			[groupId],
		)

		return res.json({ leaderboard: rows })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to get leaderboard', error: error.message })
	}
}
