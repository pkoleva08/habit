import db from '../database.js'
import {
	createHabit,
	deleteAllHabitsByUser,
	deleteHabitById,
	getHabitsByUser,
	updateHabitById,
} from '../models/Habit.js'
import { calculateStreakFromDates, calculateStreakMetrics } from '../services/streakService.js'
import {
	clearUserNotifications,
	createNotification,
	getDueReminders,
	getNotificationPreference,
	getUserNotifications,
	processBadgeNotifications,
	setNotificationPreference,
} from '../services/notificationService.js'

function toLocalDateValue(dateLike) {
	if (!dateLike) return null
	const value = String(dateLike).trim()
	if (!value) return null

	const parsed = new Date(value.includes('T') || value.includes('Z') ? value : value.replace(' ', 'T'))
	return Number.isNaN(parsed.getTime()) ? new Date(value) : parsed
}

function getDateKey(date) {
	const value = toLocalDateValue(date)
	if (!value || Number.isNaN(value.getTime())) {
		return null
	}

	const year = value.getFullYear()
	const month = String(value.getMonth() + 1).padStart(2, '0')
	const day = String(value.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function isSameLocalDay(dateA, dateB) {
	const aKey = getDateKey(dateA)
	const bKey = getDateKey(dateB)
	return aKey && bKey && aKey === bKey
}

function isSameWeek(dateA, dateB) {
	const a = toLocalDateValue(dateA)
	const b = toLocalDateValue(dateB)
	if (!a || !b || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
		return false
	}

	const getWeekStart = (value) => {
		const result = new Date(value)
		const day = result.getDay()
		result.setHours(0, 0, 0, 0)
		result.setDate(result.getDate() - day)
		return result
	}

	return getWeekStart(a).getTime() === getWeekStart(b).getTime()
}

async function updateHabitStreak(habitId) {
	const { rows } = await db.query(
		`SELECT completed_at
		 FROM habit_completions
		 WHERE habit_id = $1
		 ORDER BY completed_at DESC`,
		[habitId],
	)

	const { rows: habits } = await db.query(
		`SELECT frequency, streak, best_streak FROM habits WHERE id = $1`,
		[habitId],
	)
	const habit = habits[0] || {}
	const frequency = habit.frequency || 'daily'
	const metrics = calculateStreakMetrics(rows.map((row) => row.completed_at), frequency, new Date())
	const previousBest = Number(habit.best_streak || 0)
	const nextBest = Math.max(previousBest, metrics.best)

	await db.query('UPDATE habits SET streak = $1, best_streak = $2 WHERE id = $3', [metrics.current, nextBest, habitId])
	return { streak: metrics.current, bestStreak: nextBest }
}

export async function listHabits(req, res) {
	try {
		const habits = await getHabitsByUser(req.user.id)
		const todayStart = new Date()
		todayStart.setHours(0, 0, 0, 0)
		const tomorrow = new Date(todayStart)
		tomorrow.setDate(tomorrow.getDate() + 1)

		const habitsWithCompletion = await Promise.all(
			habits.map(async (habit) => {
				const { rows: completionRows } = await db.query(
					`SELECT completed_at
					 FROM habit_completions
					 WHERE habit_id = $1
					 ORDER BY completed_at DESC`,
					[habit.id],
				)
				const metrics = calculateStreakMetrics(
					completionRows.map((row) => row.completed_at),
					habit.frequency || 'daily',
					new Date(),
				)
				const nextBest = Math.max(Number(habit.best_streak || 0), metrics.best)

				if (habit.streak !== metrics.current || Number(habit.best_streak || 0) !== nextBest) {
					await db.query('UPDATE habits SET streak = $1, best_streak = $2 WHERE id = $3', [
						metrics.current,
						nextBest,
						habit.id,
					])
				}

				const completedToday = completionRows.some((row) => isSameLocalDay(row.completed_at, new Date()))

				return {
					...habit,
					streak: metrics.current,
					best_streak: nextBest,
					completed_today: completedToday,
				}
			}),
		)

		return res.json({ habits: habitsWithCompletion })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to list habits', error: error.message })
	}
}

export async function createHabitItem(req, res) {
	try {
		const { name, frequency = 'daily', reminderTime } = req.body

		if (!name) {
			return res.status(400).json({ message: 'name is required' })
		}

		if (!['daily', 'weekly'].includes(frequency)) {
			return res.status(400).json({ message: 'frequency must be daily or weekly' })
		}

		const habit = await createHabit({
			userId: req.user.id,
			name,
			frequency,
			reminderTime,
		})

		const notificationMessage = reminderTime
			? `Reminder configured for "${habit.name}" at ${habit.reminder_time}`
			: `Habit "${habit.name}" was created successfully`

		const notification = reminderTime
			? await createNotification(db, {
					userId: req.user.id,
					type: 'reminder',
					message: notificationMessage,
				})
			: null

		return res.status(201).json({ habit, notification })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to create habit', error: error.message })
	}
}

export async function updateHabit(req, res) {
	try {
		const habitId = Number(req.params.id)
		const { name, frequency = 'daily', reminderTime } = req.body || {}

		if (!habitId) {
			return res.status(400).json({ message: 'Invalid habit id' })
		}

		if (!name || !name.trim()) {
			return res.status(400).json({ message: 'name is required' })
		}

		if (!['daily', 'weekly'].includes(frequency)) {
			return res.status(400).json({ message: 'frequency must be daily or weekly' })
		}

		const updatedHabit = await updateHabitById({
			habitId,
			userId: req.user.id,
			name: name.trim(),
			frequency,
			reminderTime,
		})

		if (!updatedHabit) {
			return res.status(404).json({ message: 'Habit not found' })
		}

		return res.json({ habit: updatedHabit, message: 'Habit updated successfully' })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to update habit', error: error.message })
	}
}

export async function deleteHabit(req, res) {
	try {
		const habitId = Number(req.params.id)
		if (!habitId) {
			return res.status(400).json({ message: 'Invalid habit id' })
		}

		const deleted = await deleteHabitById(habitId, req.user.id)
		if (!deleted) {
			return res.status(404).json({ message: 'Habit not found' })
		}

		return res.json({ message: 'Habit deleted successfully' })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to delete habit', error: error.message })
	}
}

export async function deleteAllHabits(req, res) {
	try {
		const deletedCount = await deleteAllHabitsByUser(req.user.id)
		return res.json({ deletedCount, message: 'All habits deleted successfully' })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to delete habits', error: error.message })
	}
}

export async function listNotifications(req, res) {
	try {
		const notifications = await getUserNotifications(db, req.user.id, req.query.limit)
		return res.json({ notifications })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to list notifications', error: error.message })
	}
}

export async function clearNotifications(req, res) {
	try {
		const deletedCount = await clearUserNotifications(db, req.user.id)
		return res.json({ deletedCount, message: 'Notifications cleared successfully' })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to clear notifications', error: error.message })
	}
}

export async function updateNotificationPreference(req, res) {
	try {
		const { notificationsEnabled, permissionState } = req.body || {}
		const preference = await setNotificationPreference(db, {
			userId: req.user.id,
			notificationsEnabled,
			permissionState,
		})

		return res.json({ preference })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to save notification preference', error: error.message })
	}
}

export async function getNotificationPreferenceState(req, res) {
	try {
		const preference = await getNotificationPreference(db, req.user.id)
		return res.json({ preference })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to get notification preference', error: error.message })
	}
}

export async function completeHabit(req, res) {
	try {
		const habitId = Number(req.params.id)
		const { completedAt } = req.body
		const completionMoment = completedAt ? new Date(completedAt) : new Date()

		if (!habitId) {
			return res.status(400).json({ message: 'Invalid habit id' })
		}

		const habitResult = await db.query('SELECT * FROM habits WHERE id = $1 AND user_id = $2', [
			habitId,
			req.user.id,
		])
		const habit = habitResult.rows[0]

		if (!habit) {
			return res.status(404).json({ message: 'Habit not found' })
		}

		const { rows: completionRows } = await db.query(
			`SELECT id, completed_at
			 FROM habit_completions
			 WHERE habit_id = $1
			 ORDER BY completed_at DESC`,
			[habitId],
		)

		const duplicateExists = completionRows.some((entry) => {
			const existingDate = new Date(entry.completed_at)
			return habit.frequency === 'weekly'
				? isSameWeek(existingDate, completionMoment)
				: isSameLocalDay(existingDate, completionMoment)
		})

		if (duplicateExists) {
			return res.status(200).json({
				message: 'Completion already recorded for the current period',
				streak: Number(habit.streak || 0),
				bestStreak: Number(habit.best_streak || 0),
				completed_today: true,
				notifications: [],
			})
		}

		await db.query(
			`INSERT INTO habit_completions (habit_id, completed_at)
			 VALUES ($1, COALESCE($2, CURRENT_TIMESTAMP))`,
			[habitId, completedAt || null],
		)

		const { streak, bestStreak } = await updateHabitStreak(habitId)
		const badgeNotifications = await processBadgeNotifications(db, req.user.id)

		return res.status(201).json({
			message: 'Habit marked as completed',
			streak,
			bestStreak,
			completed_today: true,
			notifications: badgeNotifications,
		})
	} catch (error) {
		return res.status(500).json({ message: 'Failed to complete habit', error: error.message })
	}
}

export async function getHabitCalendar(req, res) {
	try {
		const habitId = Number(req.params.id)
		const year = Number(req.query.year) || new Date().getFullYear()
		const month = Number(req.query.month) || new Date().getMonth() + 1

		const ownerCheck = await db.query('SELECT id FROM habits WHERE id = $1 AND user_id = $2', [
			habitId,
			req.user.id,
		])

		if (ownerCheck.rowCount === 0) {
			return res.status(404).json({ message: 'Habit not found' })
		}

		const { rows } = await db.query(
			`SELECT completed_at
			 FROM habit_completions
			 WHERE habit_id = $1
			 ORDER BY completed_at`,
			[habitId],
		)

		const monthDates = rows
			.filter((row) => {
				const value = toLocalDateValue(row.completed_at)
				return value && value.getFullYear() === year && value.getMonth() + 1 === month
			})
			.map((row) => {
				const value = toLocalDateValue(row.completed_at)
				if (!value || Number.isNaN(value.getTime())) {
					return null
				}
				const y = value.getFullYear()
				const m = String(value.getMonth() + 1).padStart(2, '0')
				const d = String(value.getDate()).padStart(2, '0')
				return `${y}-${m}-${d}`
			})
			.filter(Boolean)

		return res.json({ dates: monthDates })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to get calendar', error: error.message })
	}
}

export async function getReminders(req, res) {
	try {
		const reminders = await getDueReminders(db, req.user.id)
		return res.json({ reminders })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to get reminders', error: error.message })
	}
}
