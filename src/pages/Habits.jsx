import { useEffect, useMemo, useRef, useState } from 'react'
import Calendar from '../components/Calendar'
import HabitCard from '../components/HabitCard'
import {
	completeHabit,
	createHabit,
	deleteAllHabits,
	deleteHabit,
	getHabitCalendar,
	getHabits,
	updateHabit,
} from '../services/habitService'

function getTodayKey(date = new Date()) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

export default function Habits() {
	const [habits, setHabits] = useState([])
	const [form, setForm] = useState({ name: '', frequency: 'daily', reminderTime: '' })
	const [selectedHabitId, setSelectedHabitId] = useState(null)
	const [calendarDates, setCalendarDates] = useState([])
	const [notice, setNotice] = useState('')
	const [error, setError] = useState('')
	const [menuOpen, setMenuOpen] = useState(false)
	const [completedTodayByHabit, setCompletedTodayByHabit] = useState({})
	const [pendingCompletionIds, setPendingCompletionIds] = useState([])
	const [editingHabitId, setEditingHabitId] = useState(null)
	const [menuOpenHabitId, setMenuOpenHabitId] = useState(null)
	const [editValue, setEditValue] = useState({ name: '', reminderTime: '' })
	const inFlightCompletionRef = useRef(new Set())
	const [calendarView, setCalendarView] = useState(() => {
		const now = new Date()
		return { year: now.getFullYear(), month: now.getMonth() + 1 }
	})

	const now = new Date()
	const year = calendarView.year
	const month = calendarView.month

	const loadHabits = async () => {
		const data = await getHabits()
		const nextHabits = (data.habits || []).map((habit) => ({
			...habit,
			streak: Number(habit.streak || 0),
			best_streak: Number(habit.best_streak || 0),
			completed_today: Boolean(habit.completed_today),
		}))
		setHabits(nextHabits
		return { year: now.getFullYear(), month: now.getMonth() + 1 }
	})

	const now = new Date()
	const year = calendarView.year
	const month = calendarView.month

	const loadHabits = async () => {
		const data = await getHabits()
		const nextHabits = (data.habits || []).map((habit) => ({
			...habit,
			streak: Number(habit.streak || 0),
			best_streak: Number(habit.best_streak || 0),
			completed_today: Boolean(habit.completed_today),
		}))
		setHabits(nextHabits)
	}

	useEffect(() => {
		loadHabits().catch((e) => setError(e.message))
	}, [])

	useEffect(() => {
		if (!habits.length) return
		if (!selectedHabitId) {
			const firstHabit = habits[0]
			setSelectedHabitId(firstHabit.id)
			openCalendar(firstHabit.id, calendarView.year, calendarView.month)
			return
		}
		const activeHabit = habits.find((habit) => habit.id === selectedHabitId)
		if (activeHabit) {
			openCalendar(activeHabit.id, calendarView.year, calendarView.month)
		}
	}, [habits, selectedHabitId, calendarView.year, calendarView.month])
const habit = habits.find((item) => item.id === habitId)
		if (!habit || habit.completed_today || inFlightCompletionRef.current.has(habitId)) {
			return
		}

		const todayKey = getTodayKey()
		const previousStreak = Number(habit?.streak || 0)
		const nextStreak = Math.max(previousStreak + 1, 1)
		const nextBest = Math.max(Number(habit?.best_streak || habit?.streak || 0), nextStreak)

		inFlightCompletionRef.current.add(habitId)
		setPendingCompletionIds((prev) => [...new Set([...prev, habitId])])
		setCompletedTodayByHabit((prev) => ({
			...prev,
			[habitId]: { dayKey: todayKey },
		}))
		setHabits((prev) =>
			prev.map((item) =>
				item.id === habitId
					? {
							...item,
							streak: nextStreak,
							best_streak: nextBest,
							completed_today: true,
					  }
					: item,
			),
		)

		try {
			const data = await completeHabit(habitId)
			const serverStreak = Number(data?.streak || nextStreak)
			const serverBest = Number(data?.bestStreak || nextBest)
			const safeStreak = Math.max(serverStreak, nextStreak, 1)
			const safeBest = Math.max(serverBest, nextBest, 1)
			setNotice(`Completed. Current streak: ${safeStreak}`)
			setHabits((prev) =>
				prev.map((item) =>
					item.id === habitId
						? {
								...item,
								streak: safeStreak,
								best_streak: safeBest,
								completed_today: true,
						  }
						: item,
				),
			)
			await loadHabits()
			setHabits((prev) =>
				prev.map((item) =>
					item.id === habitId
						? {
								...item,
								streak: safeStreak,
								best_streak: safeBest,
								completed_today: true,
						  }
						: item,
				),
			)
			if (selectedHabitId === habitId) {
				const calendar = await getHabitCalendar(habitId, year, month)
				setCalendarDates(calendar.dates || [])
			}
		} catch (e) {
			if (e?.message?.includes('already recorded') || e?.message?.includes('current period')) {
				setHabits((prev) =>
					prev.map((item) =>
						item.id === habitId ? { ...item, completed_today: true } : item,
					),
				)
				return
			}
			setError(e.message)
		} finally {
			inFlightCompletionRef.current.delete(habitId)
			setPendingCompletionIds((prev) => prev.filter((id) => id !== habitId)
			setError(e.message)
		}
	}

	const onComplete = async (habitId) => {
		setError('')
		const habit = habits.find((item) => item.id === habitId)
		if (!habit || habit.completed_today || inFlightCompletionRef.current.has(habitId)) {
			return
		}

		const todayKey = getTodayKey()
		const previousStreak = Number(habit?.streak || 0)
		const nextStreak = Math.max(previousStreak + 1, 1)
		const nextBest = Math.max(Number(habit?.best_streak || habit?.streak || 0), nextStreak)

		inFlightCompletionRef.current.add(habitId)
		setPendingCompletionIds((prev) => [...new Set([...prev, habitId])])
		setCompletedTodayByHabit((prev) => ({
			...prev,
			[habitId]: { dayKey: todayKey },
		}))
		setHabits((prev) =>
			prev.map((item) =>
				item.id === habitId
					? {
							...item,
							streak: nextStreak,
							best_streak: nextBest,
							completed_today: true,
					  }
					: item,
			),
		)

		try {
			const data = await completeHabit(habitId)
			const serverStreak = Number(data?.streak || nextStreak)
			const serverBest = Number(data?.bestStreak || nextBest)
			const safeStreak = Math.max(serverStreak, nextStreak, 1)
			const safeBest = Math.max(serverBest, nextBest, 1)
			setNotice(`Completed. Current streak: ${safeStreak}`)
			setHabits((prev) =>
				prev.map((item) =>
					item.id === habitId
						? {
								...item,
								streak: safeStreak,
								best_streak: safeBest,
								completed_today: true,
						  }
						: item,
				),
			)
			await loadHabits()
			setHabits((prev) =>
				prev.map((item) =>
					item.id === habitId
						? {
								...item,
								streak: safeStreak,
								best_streak: safeBest,
								completed_today: true,
						  }
						: item,
				),
			)
			if (selectedHabitId === habitId) {
				const calendar = await getHabitCalendar(habitId, year, month)
				setCalendarDates(calendar.dates || [])
			}
		} catch (e) {
			if (e?.message?.includes('already recorded') || e?.message?.includes('current period')) {
				setHabits((prev) =>
					prev.map((item) =>
						item.id === habitId ? { ...item, completed_today: true } : item,
					),
				)
				return
			}
			setError(e.message)
		} finally {
			inFlightCompletionRef.current.delete(habitId)
			setPendingCompletionIds((prev) => prev.filter((id) => id !== habitId))
		}
	}

	const openCalendar = async (habitId, customYear = year, customMonth = month) => {
		setSelectedHabitId(habitId)
		try {
			const data = await getHabitCalendar(habitId, customYear, customMonth)
			setCalendarDates(data.dates || [])
		} catch (e) {
			setError(e.message)
		}
	}

	const changeCalendarMonth = (offset) => {
		const currentDate = new Date(calendarView.year, calendarView.month - 1, 1)
		const minDate = new Date(2020, 0, 1)
		const maxDate = new Date(now.getFullYear(), now.getMonth(), 1)
		currentDate.setMonth(currentDate.getMonth() + offset)

		let nextYear = currentDate.getFullYear()
		let nextMonth = currentDate.getMonth() + 1

		if (currentDate < minDate) {
			const earliestDate = new Date(minDate)
			nextYear = earliestDate.getFullYear()
			nextMonth = earliestDate.getMonth() + 1
		}

		if (currentDate > maxDate) {
			const latestDate = new Date(maxDate)
			nextYear = latestDate.getFullYear()
			nextMonth = latestDate.getMonth() + 1
		}

		setCalendarView({ year: nextYear, month: nextMonth })

		if (selectedHabitId) {
			openCalendar(selectedHabitId, nextYear, nextMonth)
		}
	}

	const handleDeleteHabit = async (habitId) => {
		setError('')
		try {
			await deleteHabit(habitId)
			setNotice('Habit deleted successfully')
			await loadHabits()
			if (selectedHabitId === habitId) {
				setSelectedHabitId(null)
				setCalendarDates([])
			}
		} catch (e) {
			setError(e.message)
		}
	}

	const handleDeleteAllHabits = async () => {
		setError('')
		if (!habits.length) {
			setNotice('There are no habits to delete')
			return
		}

		const confirmed = window.confirm('Are you sure you want to delete all habits?')
		if (!confirmed) return

		try {
			await deleteAllHabits()
			setMenuOpen(false)
			setSelectedHabitId(null)
			setCalendarDates([])
			setNotice('All habits deleted successfully')
			await loadHabits()
		} catch (e) {
			setError(e.message)
		}
	}

	const startEdit = (habit) => {
		setEditingHabitId(habit.id)
		setEditValue({
			name: habit.name,
			reminderTime: habit.reminder_time || '',
		})
		setMenuOpen(false)
		setMenuOpenHabitId(null)
	}

	const handleEditChange = (field, value) => {
		setEditValue((prev) => ({ ...prev, [field]: value }))
	}

	const saveEdit = async () => {
		if (!editingHabitId) return
		const currentHabit = habits.find((habit) => habit.id === editingHabitId)
		const payload = {
			name: (editValue.name || currentHabit?.name || '').trim(),
			frequency: currentHabit?.frequency || 'daily',
			reminderTime: editValue.reminderTime,
		}

		if (!payload.name) {
			setError('Habit name is required')
			return
		}

		setError('')
		try {
			const response = await updateHabit(editingHabitId, payload)
			const updatedHabit = response?.habit || {
				...currentHabit,
				...payload,
				reminder_time: payload.reminderTime || currentHabit?.reminder_time || null,
			}

			setHabits((prev) =>
				prev.map((habit) =>
					habit.id === editingHabitId
						? {
								...habit,
								name: updatedHabit.name,
								frequency: updatedHabit.frequency,
								reminder_time: updatedHabit.reminder_time ?? habit.reminder_time,
						  }
						: habit,
				),
			)

			setEditingHabitId(null)
			setEditValue({ name: '', reminderTime: '' })
			setMenuOpenHabitId(null)
			setNotice('Habit updated successfully')
			await loadHabits()
		} catch (e) {
			if (e.message?.includes('Invalid or expired token') || e.message?.includes('Missing auth token')) {
				setError('Your session has expired. Please log in again.')
				return
			}
			setError(e.message)
		}
	}

	const sectionActions = useMemo(
		() => [{ label: 'Delete all habits', action: handleDeleteAllHabits, danger: true }],
		[handleDeleteAllHabits],
	)

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
					<Calendar
						year={year}
						month={month}
						dates={calendarDates}
						onPrevMonth={() => changeCalendarMonth(-1)}
						onNextMonth={() => changeCalendarMonth(1)}
					/>
				) : (
					<p className="muted">Select a habit to view this month calendar.</p>
				)}
			</article>

			<article className="card full-width">
				<div className="section-header-row">
					<h3>Your habits</h3>
					<div className="section-menu-wrap">
						<button
							type="button"
							className="menu-dots-button"
							onClick={() => setMenuOpen((prev) => !prev)}
							aria-label="Habit actions"
						>
							⋯
						</button>
						{menuOpen ? (
							<div className="section-menu-dropdown">
								{sectionActions.map((item) => (
									<button
										type="button"
										key={item.label}
										className={item.danger ? 'danger-text' : ''}
										onClick={() => {
											item.action()
											setMenuOpen(false)
										}}
									>
										{item.label}
									</button>
								))}
							</div>
						) : null}
					</div>
				</div>

				<div className="list">
					{habits.map((habit) => (
						<div key={habit.id}>
							<HabitCard
								habit={habit}
								onComplete={onComplete}
								onDelete={() => {
									setMenuOpenHabitId(null)
									handleDeleteHabit(habit.id)
								}}
								onEdit={() => startEdit(habit)}
								editing={editingHabitId === habit.id}
								editValue={editValue}
								onEditChange={handleEditChange}
								onSaveEdit={saveEdit}
								onCancelEdit={() => {
									setEditingHabitId(null)
									setEditValue({ name: '', reminderTime: '' })
								}}
								menuOpen={menuOpenHabitId === habit.id}
								onToggleMenu={() => {
									setMenuOpenHabitId((current) => (current === habit.id ? null : habit.id))
								}}
							/>
							{selectedHabitId === habit.id ? null : (
								<button className="text-button" type="button" onClick={() => openCalendar(habit.id, calendarView.year, calendarView.month)}>
									View calendar
								</button>
							)}
						</div>
					))}
				</div>
			</article>

			{notice ? <p className="notice">{notice}</p> : null}
			{error ? <p className="error">{error}</p> : null}
		</section>
	)
}
