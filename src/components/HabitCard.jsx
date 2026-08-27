export default function HabitCard({
	habit,
	onComplete,
	onDelete,
	onEdit,
	editing,
	editValue,
	onEditChange,
	onSaveEdit,
	onCancelEdit,
	menuOpen,
	onToggleMenu,
}) {
	const completedToday = Boolean(habit.completed_today)

	return (
		<article className="card habit-card">
			<div className="habit-card-header">
				{editing ? (
					<div className="edit-form-inline">
						<input
							type="text"
							value={editValue.name}
							onChange={(event) => onEditChange('name', event.target.value)}
							placeholder="Habit name"
						/>
						<input
							type="time"
							value={editValue.reminderTime}
							onChange={(event) => onEditChange('reminderTime', event.target.value)}
						/>
					</div>
				) : (
					<div>
						<h3>{habit.name}</h3>
						<p className="muted">{habit.frequency} habit</p>
					</div>
				)}

				<div className="habit-card-menu-wrap">
					<button type="button" className="menu-dots-button" aria-label="More options" onClick={onToggleMenu}>
						⋮
					</button>
					{menuOpen ? (
						<div className="habit-menu-dropdown">
							<button type="button" onClick={onEdit}>
								Edit
							</button>
							<button type="button" className="danger-text" onClick={onDelete}>
								Delete
							</button>
						</div>
					) : null}
				</div>
			</div>

			<div className="habit-meta">
				<div className="pill">Streak: {habit.streak || 0}</div>
				<div className="pill">Best: {habit.best_streak || habit.streak || 0}</div>
				<div className="pill">Reminder: {habit.reminder_time || 'not set'}</div>
				{completedToday ? <div className="pill success">Completed today</div> : null}
			</div>

			{editing ? (
				<div className="habit-actions-row">
					<button type="button" className="secondary-button" onClick={onCancelEdit}>
						Cancel
					</button>
					<button type="button" onClick={onSaveEdit}>
						Save changes
					</button>
				</div>
			) : (
				<div className="habit-actions-row">
					<button
						type="button"
						onClick={() => onComplete(habit.id)}
						disabled={completedToday}
						style={{ opacity: completedToday ? 0.7 : 1, cursor: completedToday ? 'not-allowed' : 'pointer' }}
					>
						{completedToday ? 'Completed' : 'Mark Completed'}
					</button>
				</div>
			)}
		</article>
	)
}
