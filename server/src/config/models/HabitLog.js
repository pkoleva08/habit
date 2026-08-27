import db from '../database.js'

export async function getHabitCompletions(habitId, startDate, endDate) {
	const { rows } = await db.query(
		`SELECT id, habit_id, completed_at
		 FROM habit_completions
		 WHERE habit_id = $1
		 ORDER BY completed_at DESC`,
		[habitId],
	)

	return rows.filter((row) => {
		const value = new Date(row.completed_at)
		const start = new Date(startDate)
		const end = new Date(endDate)
		return value >= start && value <= end
	})
}

export async function addHabitCompletion(habitId, completedAt = null) {
	const { rows } = await db.query(
		`INSERT INTO habit_completions (habit_id, completed_at)
		 VALUES ($1, COALESCE($2, CURRENT_TIMESTAMP))
		 RETURNING id, habit_id, completed_at`,
		[habitId, completedAt],
	)
	return rows[0]
}

export async function getUserHabitLogs(userId, habitId) {
	const { rows } = await db.query(
		`SELECT hc.id, hc.habit_id, hc.completed_at, h.name, h.frequency
		 FROM habit_completions hc
		 JOIN habits h ON hc.habit_id = h.id
		 WHERE h.user_id = $1 AND hc.habit_id = $2
		 ORDER BY hc.completed_at DESC
		 LIMIT 100`,
		[userId, habitId],
	)
	return rows
}

export async function deleteHabitCompletion(completionId) {
	await db.query(
		`DELETE FROM habit_completions WHERE id = $1`,
		[completionId],
	)
}
