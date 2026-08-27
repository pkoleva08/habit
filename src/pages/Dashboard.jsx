import { useEffect, useMemo, useState } from 'react'
import Notification from '../components/Notification'
import {
	clearRecommendations,
	clearUserNotifications,
	getAnalyticsOverview,
	getHabits,
	getNotifications,
	getReminders,
} from '../services/habitService'

export default function Dashboard() {
	const [habits, setHabits] = useState([])
	const [overview, setOverview] = useState({ weekly: [], monthly: [], recommendations: [] })
	const [reminders, setReminders] = useState([])
	const [notifications, setNotifications] = useState([])
	const [error, setError] = useState('')

	useEffect(() => {
		async function load() {
			try {
				const [habitData, analyticsData, remindersData, notificationsData] = await Promise.all([
					getHabits(),
					getAnalyticsOverview(),
					getReminders(),
					getNotifications(),
				])
				setHabits(habitData.habits || [])
				setOverview(analyticsData)
				setReminders((remindersData.reminders || []).map((r) => `${r.name} at ${r.reminder_time}`))
				setNotifications((notificationsData.notifications || []).map((item) => item.message))
			} catch (e) {
				setError(e.message)
			}
		}

		load()
	}, [])

	const handleClearRecommendations = async () => {
		try {
			await clearRecommendations()
			setOverview((prev) => ({ ...prev, recommendations: [] }))
		} catch (e) {
			setError(e.message)
		}
	}

	const clearNotifications = async () => {
		try {
			await clearUserNotifications()
			setNotifications([])
		} catch (e) {
			setError(e.message)
		}
	}

	const bestStreak = useMemo(
		() => habits.reduce((acc, habit) => Math.max(acc, Number(habit.best_streak || habit.streak || 0)), 0),
		[habits],
	)

	const avgWeeklyRate = useMemo(() => {
		if (!overview.weekly?.length) {
			return 0
		}
		const total = overview.weekly.reduce((sum, item) => sum + Number(item.successRate || 0), 0)
		return Math.round(total / overview.weekly.length)
	}, [overview.weekly])

	return (
		<section className="grid two-col">
			<article className="card">
				<h3>Quick stats</h3>
				<div className="stats">
					<div>
						<strong>{habits.length}</strong>
						<span>Active habits</span>
					</div>
					<div>
						<strong>{bestStreak}</strong>
						<span>Best streak</span>
					</div>
					<div>
						<strong>{avgWeeklyRate}%</strong>
						<span>Avg weekly success</span>
					</div>
				</div>
			</article>

			<Notification
				title="Recommendations"
				items={overview.recommendations || []}
				onClear={handleClearRecommendations}
			/>
			<Notification title="Reminder queue" items={reminders} />
			<Notification
				title="Your notifications"
				items={notifications}
				onClear={clearNotifications}
			/>

			{error ? <p className="error">{error}</p> : null}
		</section>
	)
}
