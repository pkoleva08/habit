function toDateKey(date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function getDaysInMonth(year, month) {
	return new Date(year, month, 0).getDate()
}

export default function Calendar({ year, month, dates, onPrevMonth, onNextMonth, minYear = 2020 }) {
	const today = new Date()
	const maxYear = today.getFullYear()
	const maxMonth = today.getMonth() + 1
	const clampedYear = Math.min(Math.max(Number(year) || today.getFullYear(), minYear), maxYear)
	const clampedMonth = Math.min(Math.max(Number(month) || 1, 1), 12)
	const completed = new Set((dates || []).map((value) => toDateKey(new Date(value))))
	const daysInMonth = getDaysInMonth(clampedYear, clampedMonth)
	const todayKey = toDateKey(today)
	const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
		new Date(clampedYear, clampedMonth - 1, 1),
	)

	const canGoPrev = clampedYear > minYear || (clampedYear === minYear && clampedMonth > 1)
	const canGoNext =
		clampedYear < maxYear || (clampedYear === maxYear && clampedMonth < maxMonth)

	return (
		<div>
			<div className="calendar-header">
				<button type="button" disabled={!canGoPrev} onClick={onPrevMonth} aria-label="Previous month">
					‹
				</button>
				<strong>{monthLabel}</strong>
				<button type="button" disabled={!canGoNext} onClick={onNextMonth} aria-label="Next month">
					›
				</button>
			</div>

			<div className="calendar-grid">
				{Array.from({ length: daysInMonth }, (_, index) => {
					const day = index + 1
					const date = new Date(clampedYear, clampedMonth - 1, day)
					const key = toDateKey(date)
					const active = completed.has(key)
					const missed = !active && date < today && key !== todayKey

					return (
						<div key={key} className={active ? 'day active' : missed ? 'day missed' : 'day'}>
							{day}
						</div>
					)
				})}
			</div>
		</div>
	)
}
