import db from '../database.js'
import { findUserById } from '../models/User.js'

/**
 * Get all users (admin only)
 */
export async function getAllUsers(req, res) {
	try {
		const limit = Math.min(Number(req.query.limit) || 50, 100)
		const offset = Number(req.query.offset) || 0

		const { rows } = await db.query(
			`SELECT id, name, email, role, created_at, updated_at
			 FROM users
			 ORDER BY created_at DESC
			 LIMIT $1 OFFSET $2`,
			[limit, offset],
		)

		const { rows: countResult } = await db.query('SELECT COUNT(*) as total FROM users')
		const total = parseInt(countResult[0].total)

		return res.json({
			users: rows,
			pagination: {
				limit,
				offset,
				total,
				pages: Math.ceil(total / limit),
			},
		})
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch users', error: error.message })
	}
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(req, res) {
	try {
		const userId = Number(req.params.id)
		const { role } = req.body

		if (!userId) {
			return res.status(400).json({ message: 'User ID is required' })
		}

		if (!['user', 'admin'].includes(role)) {
			return res.status(400).json({ message: 'Invalid role. Must be user or admin' })
		}

		// Prevent demoting the last admin
		if (role === 'user') {
			const { rows: adminCount } = await db.query(
				`SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND id != $1`,
				[userId],
			)
			if (parseInt(adminCount[0].count) === 0) {
				return res.status(400).json({ message: 'Cannot demote the last admin' })
			}
		}

		const { rows } = await db.query(
			`UPDATE users
			 SET role = $1, updated_at = NOW()
			 WHERE id = $2
			 RETURNING id, name, email, role, created_at, updated_at`,
			[role, userId],
		)

		if (rows.length === 0) {
			return res.status(404).json({ message: 'User not found' })
		}

		return res.json({
			message: `User role updated to ${role}`,
			user: rows[0],
		})
	} catch (error) {
		return res.status(500).json({ message: 'Failed to update user role', error: error.message })
	}
}

/**
 * Get system statistics (admin only)
 */
export async function getSystemStats(req, res) {
	try {
		const { rows: userStats } = await db.query(`
			SELECT 
				COUNT(*) as total_users,
				SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
				SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as new_users_week
			FROM users
		`)

		const { rows: habitStats } = await db.query(`
			SELECT 
				COUNT(*) as total_habits,
				COUNT(DISTINCT user_id) as active_users,
				AVG(streak) as avg_streak
			FROM habits
		`)

		const { rows: groupStats } = await db.query(`
			SELECT 
				COUNT(*) as total_groups,
				COUNT(DISTINCT user_id) as group_participants
			FROM group_members
		`)

		const { rows: completionStats } = await db.query(`
			SELECT 
				COUNT(*) as total_completions,
				COUNT(DISTINCT habit_id) as habits_with_completions,
				MAX(completed_at) as latest_completion
			FROM habit_completions
		`)

		return res.json({
			users: userStats[0],
			habits: habitStats[0],
			groups: groupStats[0],
			completions: completionStats[0],
		})
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch system stats', error: error.message })
	}
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(req, res) {
	try {
		const userId = Number(req.params.id)

		if (!userId) {
			return res.status(400).json({ message: 'User ID is required' })
		}

		// Prevent deleting the last admin
		const user = await findUserById(userId)
		if (user?.role === 'admin') {
			const { rows: adminCount } = await db.query(
				`SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND id != $1`,
				[userId],
			)
			if (parseInt(adminCount[0].count) === 0) {
				return res.status(400).json({ message: 'Cannot delete the last admin' })
			}
		}

		// Delete user and cascade related data
		await db.query('DELETE FROM users WHERE id = $1', [userId])

		return res.json({
			message: 'User deleted successfully',
			deletedUserId: userId,
		})
	} catch (error) {
		return res.status(500).json({ message: 'Failed to delete user', error: error.message })
	}
}

/**
 * Get user activity report (admin only)
 */
export async function getUserActivityReport(req, res) {
	try {
		const { rows } = await db.query(`
			SELECT 
				u.id,
				u.name,
				u.email,
				COUNT(DISTINCT h.id) as habit_count,
				COUNT(DISTINCT hc.id) as completion_count,
				MAX(hc.completed_at) as last_activity,
				COUNT(DISTINCT g.id) as group_count
			FROM users u
			LEFT JOIN habits h ON u.id = h.user_id
			LEFT JOIN habit_completions hc ON h.id = hc.habit_id
			LEFT JOIN group_members gm ON u.id = gm.user_id
			LEFT JOIN groups g ON gm.group_id = g.id
			GROUP BY u.id
			ORDER BY last_activity DESC NULLS LAST
		`)

		return res.json({
			report: rows,
		})
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch activity report', error: error.message })
	}
}
