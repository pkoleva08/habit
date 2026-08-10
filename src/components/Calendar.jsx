function toDateKey(date) {
	return date.toISOString().slice(0, 10)
}

export default function Calendar({ year, month, dates }) {
	const completed = new Set((dates || []).map((value) => toDateKey(new Date(value))))
	const daysInMonth = new Date(year, month, 0).getDate()

	return (
		<div className="calendar-grid">
			{Array.from({ length: daysInMonth }, (_, index) => {
				const day = index + 1
				const date = new Date(year, month - 1, day)
				const key = toDateKey(date)
				const active = completed.has(key)

				return (
					<div key={key} className={active ? 'day active' : 'day'}>
						{day}
					</div>
				)
			})}
		</div>
	)
}
