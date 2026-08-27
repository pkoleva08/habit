import db from '../database.js'

export async function getHabitsByUser(userId) {
	const { rows } = await db.query(
		`SELECT id, user_id, name, frequency, reminder_time, streak, best_streak, created_at
		 FROM habits
		 WHERE user_id = $1
		 ORDER BY created_at DESC`,
		[userId],
	)
	return rows
}

export async function createHabit({ userId, name, frequency, reminderTime }) {
	const { rows } = await db.query(
		`INSERT INTO habits (user_id, name, frequency, reminder_time)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, name, frequency, reminder_time, streak, best_streak, created_at`,
		[userId, name, frequency, reminderTime || null],
	)

	return rows[0]
}

export async function updateHabitById({ habitId, userId, name, frequency, reminderTime }) {
	const { rows } = await db.query(
		`UPDATE habits
		 SET name = $1,
		     frequency = $2,
		     reminder_time = $3
		 WHERE id = $4 AND user_id = $5
		 RETURNING id, user_id, name, frequency, reminder_time, streak, best_streak, created_at`,
		[name, frequency, reminderTime || null, habitId, userId],
	)

	return rows[0]
}

export async function deleteHabitById(habitId, userId) {
	await db.query('DELETE FROM habit_completions WHERE habit_id = $1', [habitId])
	const { rowCount } = await db.query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId])
	return rowCount > 0
}

export async function deleteAllHabitsByUser(userId) {
	await db.query(
		`DELETE FROM habit_completions
		 WHERE habit_id IN (SELECT id FROM habits WHERE user_id = $1)`,
		[userId],
	)
	const { rowCount } = await db.query('DELETE FROM habits WHERE user_id = $1', [userId])
	return rowCount
}
