const ONE_DAY_MS = 24 * 60 * 60 * 1000

function parseLocalDate(value) {
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
		const [year, month, day] = value.split('-').map(Number)
		return new Date(year, month - 1, day)
	}

	return new Date(value)
}

function toLocalDateKey(value) {
	const date = parseLocalDate(value)
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function normalizeDate(value) {
	const date = parseLocalDate(value)
	date.setHours(0, 0, 0, 0)
	return date
}

function getIsoWeekStart(date) {
	const value = new Date(date)
	const day = value.getDay() || 7
	if (day !== 1) {
		value.setHours(-24 * (day - 1))
	}
	value.setHours(0, 0, 0, 0)
	return value
}

function getDailyUniqueDates(dates) {
	return [...new Set((dates || []).map((d) => toLocalDateKey(normalizeDate(d))))]
}

function getWeeklyUniqueDates(dates) {
	return [...new Set((dates || []).map((d) => toLocalDateKey(getIsoWeekStart(d))))]
}

export function calculateStreakMetrics(dates, frequency = 'daily', referenceDate = new Date()) {
	if (!dates || dates.length === 0) {
		return { current: 0, best: 0 }
	}

	const today = normalizeDate(referenceDate)

	if (frequency === 'weekly') {
		const uniqueWeeks = new Set(getWeeklyUniqueDates(dates))
		let current = 0
		let cursor = getIsoWeekStart(today)

		while (uniqueWeeks.has(toLocalDateKey(cursor))) {
			current += 1
			cursor = new Date(cursor.getTime() - 7 * ONE_DAY_MS)
		}

		const sortedWeeks = getWeeklyUniqueDates(dates).sort()
		let best = 0
		let run = 0
		for (let index = 0; index < sortedWeeks.length; index += 1) {
			const currentWeek = sortedWeeks[index]
			const previousWeek = sortedWeeks[index - 1]
			if (previousWeek && new Date(currentWeek).getTime() - new Date(previousWeek).getTime() === 7 * ONE_DAY_MS) {
				run += 1
			} else {
				run = 1
			}
			best = Math.max(best, run)
		}

		return { current, best }
	}

	const uniqueDays = getDailyUniqueDates(dates)
	let current = 0
	let cursor = today
	while (uniqueDays.includes(toLocalDateKey(cursor))) {
		current += 1
		cursor = new Date(cursor.getTime() - ONE_DAY_MS)
	}

	const sortedDays = getDailyUniqueDates(dates).sort()
	let best = 0
	let run = 0
	for (let index = 0; index < sortedDays.length; index += 1) {
		const currentKey = sortedDays[index]
		const previousKey = sortedDays[index - 1]
		if (previousKey) {
			const currentDate = parseLocalDate(currentKey)
			const previousDate = parseLocalDate(previousKey)
			const diffDays = (currentDate.getTime() - previousDate.getTime()) / ONE_DAY_MS
			if (diffDays === 1) {
				run += 1
			} else {
				run = 1
			}
		} else {
			run = 1
		}
		best = Math.max(best, run)
	}

	return { current, best }
}

export function calculateStreakFromDates(dates, frequency = 'daily', referenceDate = new Date()) {
	const { current } = calculateStreakMetrics(dates, frequency, referenceDate)
	return current
}

export async function getHabitStreak(db, habitId) {
	const { rows } = await db.query(
		`SELECT completed_at
		 FROM habit_completions
		 WHERE habit_id = $1
		 ORDER BY completed_at DESC`,
		[habitId],
	)

	return calculateStreakFromDates(rows.map((row) => row.completed_at))
}
