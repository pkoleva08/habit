import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import Analytics from '../pages/Analytics'
import Dashboard from '../pages/Dashboard'
import Groups from '../pages/Groups'
import Habits from '../pages/Habits'
import Login from '../pages/Login'
import Profile from '../pages/Profile'
import Register from '../pages/Register'

function ProtectedRoute({ children }) {
	const { user, loading } = useAuth()

	if (loading) {
		return <div className="center-screen">Loading...</div>
	}

	if (!user) {
		return <Navigate to="/login" replace />
	}

	return children
}

function DashboardLayout() {
	return (
		<div className="app-shell">
			<Sidebar />
			<div className="app-content">
				<Navbar />
				<main className="page-content">
					<Routes>
						<Route path="/" element={<Dashboard />} />
						<Route path="/habits" element={<Habits />} />
						<Route path="/groups" element={<Groups />} />
						<Route path="/analytics" element={<Analytics />} />
						<Route path="/profile" element={<Profile />} />
					</Routes>
				</main>
			</div>
		</div>
	)
}

export default function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route
					path="/*"
					element={
						<ProtectedRoute>
							<DashboardLayout />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	)
}
