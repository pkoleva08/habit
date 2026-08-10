export default function Notification({ title, items }) {
	return (
		<section className="card">
			<h3>{title}</h3>
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
