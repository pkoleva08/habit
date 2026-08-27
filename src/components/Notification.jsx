export default function Notification({ title, items, onClear, clearLabel = 'Clear all' }) {
	return (
		<section className="card">
			<div className="notification-header">
				<h3>{title}</h3>
				{onClear ? (
					<button type="button" className="clear-all-button" onClick={onClear}>
						{clearLabel}
					</button>
				) : null}
			</div>
			{items?.length ? (
				<ul className="plain-list">
					{items.map((item, index) => (
						<li key={`${item}-${index}`}>{item}</li>
					))}
				</ul>
			) : (
				<p className="muted">No notifications right now.</p>
			)}
		</section>
	)
}
