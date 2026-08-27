function toNumber(value) {
	return Number(value || 0)
}

function startOfDay(date) {
	const value = new Date(date)
	value.setHours(0, 0, 0, 0)
	return value
}

function startOfWeek(date) {
	const value = startOfDay(date)
	const day = value.getDay() || 7
	if (day !== 1) value.setDate(value.getDate() - (day - 1))
	return value
}

function startOfMonth(date) {
	const value = startOfDay(date)
	value.setDate(1)
	return value
}

function dateKey(date) {
	return startOfDay(date).toISOString().slice(0, 10)
}

async function getUserCompletionDates(db, userId) {
	const { rows } = await db.query(
		`SELECT hc.completed_at
		 FROM habit_completions hc
		 JOIN habits h ON h.id = hc.habit_id
		 WHERE h.user_id = $1`,
		[userId],
	)
	return rows.map((row) => new Date(row.completed_at))
}

async function getHabitCounts(db, userId) {
	const { rows } = await db.query(
		`SELECT frequency, COUNT(*) as count
		 FROM habits
		 WHERE user_id = $1
		 GROUP BY frequency`,
		[userId],
	)
	let daily_count = 0
	let weekly_count = 0
	for (const row of rows) {
		if (row.frequency === 'daily') daily_count = toNumber(row.count)
		if (row.frequency === 'weekly') weekly_count = toNumber(row.count)
	}
	return { daily_count, weekly_count }
}

export async function getWeeklyTrends(db, userId) {
	const [completionDates, habitCounts] = await Promise.all([
		getUserCompletionDates(db, userId),
		getHabitCounts(db, userId),
	])

	const { daily_count, weekly_count } = habitCounts
	const expectedPerWeek = daily_count * 7 + weekly_count
	const cutoff = startOfDay(new Date(Date.now() - 84 * 24 * 60 * 60 * 1000))
	const bucket = new Map()

	for (const completedAt of completionDates) {
		if (completedAt < cutoff) continue
		const key = dateKey(startOfWeek(completedAt))
		bucket.set(key, (bucket.get(key) || 0) + 1)
	}

	return [...bucket.entries()]
		.sort((a, b) => (a[0] < b[0] ? -1 : 1))
		.map(([period, completed]) => ({
			period,
			completed,
			expected: expectedPerWeek,
			successRate: expectedPerWeek > 0 ? Math.min(100, Math.round((completed / expectedPerWeek) * 100)) : 0,
		}))
}

export async function getMonthlyTrends(db, userId) {
	const [completionDates, habitCounts] = await Promise.all([
		getUserCompletionDates(db, userId),
		getHabitCounts(db, userId),
	])

	const { daily_count, weekly_count } = habitCounts
	const cutoff = startOfDay(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
	const bucket = new Map()

	for (const completedAt of completionDates) {
		if (completedAt < cutoff) continue
		const key = dateKey(startOfMonth(completedAt))
		bucket.set(key, (bucket.get(key) || 0) + 1)
	}

	return [...bucket.entries()]
		.sort((a, b) => (a[0] < b[0] ? -1 : 1))
		.map(([period, completed]) => {
			const date = new Date(period)
			const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
			const expected = daily_count * daysInMonth + weekly_count * 4
			return {
				period,
				completed,
				expected,
				successRate: expected > 0 ? Math.min(100, Math.round((completed / expected) * 100)) : 0,
			}
		})
}

export async function hasRecommendationDismissal(db, userId) {
	const { rows } = await db.query(
		`SELECT id
		 FROM user_recommendation_dismissals
		 WHERE user_id = $1
		 LIMIT 1`,
		[userId],
	)

	return rows.length > 0
}

export async function clearUserRecommendations(db, userId) {
	const { rowCount } = await db.query(
		`INSERT INTO user_recommendation_dismissals (user_id, cleared_at)
		 VALUES ($1, CURRENT_TIMESTAMP)
		 ON CONFLICT (user_id)
		 DO UPDATE SET cleared_at = CURRENT_TIMESTAMP`,
		[userId],
	)

	return rowCount
}

export async function getRecommendations(db, userId) {
	const dismissed = await hasRecommendationDismissal(db, userId)
	if (dismissed) {
		return []
	}

	const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
	const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()

	const [recentResult, previousResult, lowStreakResult] = await Promise.all([
		db.query(
			`SELECT COUNT(*) AS total
			 FROM habit_completions hc
			 JOIN habits h ON h.id = hc.habit_id
			 WHERE h.user_id = $1 AND hc.completed_at >= $2`,
			[userId, twoWeeksAgo],
		),
		db.query(
			`SELECT COUNT(*) AS total
			 FROM habit_completions hc
			 JOIN habits h ON h.id = hc.habit_id
			 WHERE h.user_id = $1 AND hc.completed_at >= $2 AND hc.completed_at < $3`,
			[userId, fourWeeksAgo, twoWeeksAgo],
		),
		db.query(
			`SELECT id, name, streak FROM habits WHERE user_id = $1 ORDER BY streak ASC LIMIT 3`,
			[userId],
		),
	])

	const recent = toNumber(recentResult.rows[0]?.total)
	const previous = toNumber(previousResult.rows[0]?.total)
	const recommendations = []

	if (previous > 0 && recent < previous * 0.7) {
		recommendations.push('Активността ти е спаднала с над 30% спрямо предишните 2 седмици. Намали целите временно и върни ритъма.')
	}

	lowStreakResult.rows.forEach((habit) => {
		if (toNumber(habit.streak) < 3) {
			recommendations.push(`Фокусирай се върху "${habit.name}" и добави по-ранно напомняне за следващите 7 дни.`)
		}
	})

	if (recommendations.length === 0) {
		recommendations.push('Поддържаш стабилна активност. Увеличи една седмична цел с +1 изпълнение.')
	}

	return recommendations
}
