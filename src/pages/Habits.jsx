import { useEffect, useState } from 'react'
import Calendar from '../components/Calendar'
import HabitCard from '../components/HabitCard'
import { completeHabit, createHabit, getHabitCalendar, getHabits } from '../services/habitService'

export default function Habits() {
	const [habits, setHabits] = useState([])
	const [form, setForm] = useState({ name: '', frequency: 'daily', reminderTime: '' })
	const [selectedHabitId, setSelectedHabitId] = useState(null)
	const [calendarDates, setCalendarDates] = useState([])
	const [notice, setNotice] = useState('')
	const [error, setError] = useState('')

	const now = new Date()
	const year = now.getFullYear()
	const month = now.getMonth() + 1

	const loadHabits = async () => {
		const data = await getHabits()
		setHabits(data.habits || [])
	}

	useEffect(() => {
		loadHabits().catch((e) => setError(e.message))
	}, [])

	const submitHabit = async (event) => {
		event.preventDefault()
		setError('')
		try {
			const data = await createHabit(form)
			setForm({ name: '', frequency: 'daily', reminderTime: '' })
			await loadHabits()
			setNotice(data.notification?.message || 'Habit created')
		} catch (e) {
			setError(e.message)
		}
	}

	const onComplete = async (habitId) => {
		setError('')
		try {
			const data = await completeHabit(habitId)
			setNotice(`Completed. Current streak: ${data.streak}`)
			await loadHabits()
			if (selectedHabitId === habitId) {
				const calendar = await getHabitCalendar(habitId, year, month)
				setCalendarDates(calendar.dates || [])
			}
		} catch (e) {
			setError(e.message)
		}
	}

	const openCalendar = async (habitId) => {
		setSelectedHabitId(habitId)
		try {
			const data = await getHabitCalendar(habitId, year, month)
			setCalendarDates(data.dates || [])
		} catch (e) {
			setError(e.message)
		}
	}

	return (
		<section className="grid two-col">
			<article className="card">
				<h3>Create habit</h3>
				<form className="inline-form" onSubmit={submitHabit}>
					<input
						type="text"
						placeholder="Habit name"
						value={form.name}
						onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
						required
					/>
					<select
						value={form.frequency}
						onChange={(event) => setForm((prev) => ({ ...prev, frequency: event.target.value }))}
					>
						<option value="daily">Daily</option>
						<option value="weekly">Weekly</option>
					</select>
					<input
						type="time"
						value={form.reminderTime}
						onChange={(event) => setForm((prev) => ({ ...prev, reminderTime: event.target.value }))}
					/>
					<button type="submit">Add habit</button>
				</form>
			</article>

			<article className="card">
				<h3>Habit calendar</h3>
				{selectedHabitId ? (
					<Calendar year={year} month={month} dates={calendarDates} />
				) : (
					<p className="muted">Select a habit to view this month calendar.</p>
				)}
			</article>

			<article className="card full-width">
				<h3>Your habits</h3>
				<div className="list">
					{habits.map((habit) => (
						<div key={habit.id}>
							<HabitCard habit={habit} onComplete={onComplete} />
							<button className="text-button" type="button" onClick={() => openCalendar(habit.id)}>
								View calendar
							</button>
						</div>
					))}
				</div>
			</article>

			{notice ? <p className="notice">{notice}</p> : null}
			{error ? <p className="error">{error}</p> : null}
		</section>
	)
}
