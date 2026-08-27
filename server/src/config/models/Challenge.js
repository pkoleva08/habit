import db from '../database.js'

export async function createChallenge({ groupId, name, description, targetHabitId, startDate, endDate }) {
	const { rows } = await db.query(
		`INSERT INTO challenges (group_id, name, description, target_habit_id, start_date, end_date, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, NOW())
		 RETURNING id, group_id, name, description, target_habit_id, start_date, end_date, created_at`,
		[groupId, name, description, targetHabitId, startDate, endDate],
	)
	return rows[0]
}

export async function getChallengesByGroup(groupId) {
	const { rows } = await db.query(
		`SELECT id, group_id, name, description, target_habit_id, start_date, end_date, created_at
		 FROM challenges
		 WHERE group_id = $1
		 ORDER BY start_date DESC`,
		[groupId],
	)
	return rows
}

export async function getChallengeById(challengeId) {
	const { rows } = await db.query(
		`SELECT id, group_id, name, description, target_habit_id, start_date, end_date, created_at
		 FROM challenges
		 WHERE id = $1
		 LIMIT 1`,
		[challengeId],
	)
	return rows[0] || null
}

export async function getChallengeLeaderboard(challengeId) {
	const { rows } = await db.query(
		`SELECT 
			gm.user_id, 
			u.name, 
			u.email,
			COUNT(hc.id) as completion_count,
			RANK() OVER (ORDER BY COUNT(hc.id) DESC) as rank
		 FROM group_members gm
		 JOIN users u ON gm.user_id = u.id
		 LEFT JOIN challenges c ON c.group_id = gm.group_id
		 LEFT JOIN habits h ON h.id = c.target_habit_id AND h.user_id = gm.user_id
		 LEFT JOIN habit_completions hc ON hc.habit_id = h.id 
			 AND hc.completed_at >= c.start_date 
			 AND hc.completed_at <= c.end_date
		 WHERE c.id = $1
		 GROUP BY gm.user_id, u.name, u.email
		 ORDER BY completion_count DESC`,
		[challengeId],
	)
	return rows
}

export async function updateChallenge(challengeId, { name, description, endDate }) {
	const { rows } = await db.query(
		`UPDATE challenges
		 SET name = COALESCE($1, name),
		     description = COALESCE($2, description),
		     end_date = COALESCE($3, end_date)
		 WHERE id = $4
		 RETURNING id, group_id, name, description, target_habit_id, start_date, end_date`,
		[name, description, endDate, challengeId],
	)
	return rows[0] || null
}

export async function deleteChallenge(challengeId) {
	await db.query(
		`DELETE FROM challenges WHERE id = $1`,
		[challengeId],
	)
}
