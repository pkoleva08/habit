import { NavLink } from 'react-router-dom'

const LINKS = [
	{ to: '/', label: 'Dashboard' },
	{ to: '/habits', label: 'Habits' },
	{ to: '/groups', label: 'Groups' },
	{ to: '/analytics', label: 'Analytics' },
	{ to: '/profile', label: 'Profile' },
]

export default function Sidebar() {
	return (
		<aside className="sidebar">
			<div className="brand">Habitly</div>
			<nav>
				{LINKS.map((link) => (
					<NavLink
						key={link.to}
						to={link.to}
						end={link.to === '/'}
						className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
					>
						{link.label}
					</NavLink>
				))}
			</nav>
		</aside>
	)
}
