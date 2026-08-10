import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const TITLES = {
	'/': 'Dashboard',
	'/habits': 'Habits',
	'/groups': 'Groups',
	'/analytics': 'Analytics',
	'/profile': 'Profile',
}

export default function Navbar() {
	const location = useLocation()
	const { user, logout } = useAuth()

	const title = useMemo(() => TITLES[location.pathname] || 'Habitly', [location.pathname])

	return (
		<header className="topbar">
			<div>
				<h1>{title}</h1>
				<p>Build consistency, track progress, grow with your community.</p>
			</div>
			<div className="topbar-actions">
				<span className="welcome">Hi, {user?.name}</span>
				<button type="button" className="secondary" onClick={logout}>
					Logout
				</button>
			</div>
		</header>
	)
}
