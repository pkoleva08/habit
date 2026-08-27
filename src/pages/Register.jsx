import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
	const navigate = useNavigate()
	const { register } = useAuth()
	const [form, setForm] = useState({ name: '', email: '', password: '' })
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const onSubmit = async (event) => {
		event.preventDefault()
		setError('')
		setLoading(true)
		try {
			await register(form)
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
				<h2>Create account</h2>
				<input
					autoComplete="name"
					type="text"
					placeholder="Name"
					value={form.name}
					onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
					required
				/>
				<input
					autoComplete="email"
					type="email"
					placeholder="Email"
					value={form.email}
					onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
					required
				/>
				<PasswordInput
					value={form.password}
					onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
					placeholder="Password"
					autoComplete="new-password"
					required
				/>
				{error ? <p className="error">{error}</p> : null}
				<button type="submit" disabled={loading}>
					{loading ? 'Creating...' : 'Create account'}
				</button>
				<p className="muted">
					Already have an account? <Link to="/login">Login</Link>
				</p>
			</form>
		</div>
	)
}
