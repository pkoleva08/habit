import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
	const navigate = useNavigate()
	const { login } = useAuth()
	const [form, setForm] = useState({ email: '', password: '' })
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const onSubmit = async (event) => {
		event.preventDefault()
		setError('')
		setLoading(true)
		try {
			await login(form)
			navigate('/')
		} catch (e) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="auth-screen">
			<form className="auth-card" onSubmit={onSubmit}>
				<h2>Login</h2>
				<input
					type="email"
					placeholder="Email"
					value={form.email}
					onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
					required
				/>
				<input
					type="password"
					placeholder="Password"
					value={form.password}
					onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
					required
				/>
				{error ? <p className="error">{error}</p> : null}
				<button type="submit" disabled={loading}>
					{loading ? 'Signing in...' : 'Sign in'}
				</button>
				<p className="muted">
					No account yet? <Link to="/register">Create one</Link>
				</p>
			</form>
		</div>
	)
}
