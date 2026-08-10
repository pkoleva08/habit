export default function HabitCard({ habit, onComplete }) {
	return (
		<article className="card habit-card">
			<div>
				<h3>{habit.name}</h3>
				<p className="muted">{habit.frequency} habit</p>
			</div>

			<div className="habit-meta">
				<div className="pill">Streak: {habit.streak}</div>
				<div className="pill">Reminder: {habit.reminder_time || 'not set'}</div>
			</div>

			<button type="button" onClick={() => onComplete(habit.id)}>
				Mark Completed
			</button>
		</article>
	)
}
