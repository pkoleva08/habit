import db from '../database.js'

/**
 * Get all members of a group
 */
export async function getGroupMembers(groupId) {
	const { rows } = await db.query(
		`SELECT gm.id, gm.group_id, gm.user_id, gm.role, gm.joined_at,
		        u.name, u.email
		 FROM group_members gm
		 JOIN users u ON gm.user_id = u.id
		 WHERE gm.group_id = $1
		 ORDER BY gm.joined_at DESC`,
		[groupId],
	)
	return rows
}

/**
 * Get user's membership in a group
 */
export async function getUserGroupMembership(groupId, userId) {
	const { rows } = await db.query(
		`SELECT id, group_id, user_id, role, joined_at
		 FROM group_members
		 WHERE group_id = $1 AND user_id = $2
		 LIMIT 1`,
		[groupId, userId],
	)
	return rows[0] || null
}

/**
 * Get all groups a user is a member of
 */
export async function getUserGroups(userId) {
	const { rows } = await db.query(
		`SELECT g.id, g.name, g.description, g.owner_id, g.created_at,
		        gm.role, gm.joined_at,
		        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
		 FROM groups g
		 JOIN group_members gm ON g.id = gm.group_id
		 WHERE gm.user_id = $1
		 ORDER BY gm.joined_at DESC`,
		[userId],
	)
	return rows
}

/**
 * Add a member to a group
 */
export async function addGroupMember(groupId, userId, role = 'member') {
	const { rows } = await db.query(
		`INSERT INTO group_members (group_id, user_id, role, joined_at)
		 VALUES ($1, $2, $3, NOW())
		 ON CONFLICT (group_id, user_id) DO NOTHING
		 RETURNING id, group_id, user_id, role, joined_at`,
		[groupId, userId, role],
	)
	return rows[0] || null
}

/**
 * Update member role in group
 */
export async function updateMemberRole(groupId, userId, role) {
	const { rows } = await db.query(
		`UPDATE group_members
		 SET role = $1
		 WHERE group_id = $2 AND user_id = $3
		 RETURNING id, group_id, user_id, role, joined_at`,
		[role, groupId, userId],
	)
	return rows[0] || null
}

/**
 * Remove a member from a group
 */
export async function removeGroupMember(groupId, userId) {
	await db.query(
		`DELETE FROM group_members
		 WHERE group_id = $1 AND user_id = $2`,
		[groupId, userId],
	)
}

/**
 * Check if user is member of group
 */
export async function isMemberOfGroup(groupId, userId) {
	const { rows } = await db.query(
		`SELECT id FROM group_members
		 WHERE group_id = $1 AND user_id = $2
		 LIMIT 1`,
		[groupId, userId],
	)
	return rows.length > 0
}

/**
 * Get group leaderboard
 */
export async function getGroupLeaderboard(groupId) {
	const { rows } = await db.query(
		`SELECT 
			gm.user_id,
			u.name,
			u.email,
			COUNT(DISTINCT h.id) as habit_count,
			COUNT(DISTINCT hc.id) as completion_count,
			COALESCE(AVG(h.streak), 0) as avg_streak,
			RANK() OVER (ORDER BY COUNT(DISTINCT hc.id) DESC) as rank
		 FROM group_members gm
		 JOIN users u ON gm.user_id = u.id
		 LEFT JOIN habits h ON h.user_id = u.id
		 LEFT JOIN habit_completions hc ON h.id = hc.habit_id
		 WHERE gm.group_id = $1
		 GROUP BY gm.user_id, u.name, u.email
		 ORDER BY rank`,
		[groupId],
	)
	return rows
}
