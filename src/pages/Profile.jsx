import { useAuth } from '../hooks/useAuth'

export default function Profile() {
	const { user, badges } = useAuth()

	return (
		<section className="grid one-col">
			<article className="card">
				<h3>Profile</h3>
				<p>
					<strong>Name:</strong> {user?.name}
				</p>
				<p>
					<strong>Email:</strong> {user?.email}
				</p>
				<p>
					<strong>Role:</strong> {user?.role}
				</p>
			</article>

			<article className="card">
				<h3>Badges</h3>
				{badges?.length ? (
					<ul className="plain-list">
						{badges.map((badge) => (
							<li key={badge.id}>
								<strong>{badge.name}</strong> - {badge.description}
							</li>
						))}
					</ul>
				) : (
					<p className="muted">Complete streak milestones to unlock badges.</p>
				)}
			</article>
		</section>
	)
}
