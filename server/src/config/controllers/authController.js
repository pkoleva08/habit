import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createUser, findUserByEmail, findUserById } from '../models/User.js'
import { getUserBadges } from '../models/Badge.js'

function signToken(user) {
	return jwt.sign(
		{ id: user.id, email: user.email, role: user.role, name: user.name },
		process.env.JWT_SECRET || 'dev-secret',
		{ expiresIn: '7d' },
	)
}

export async function register(req, res) {
	try {
		const { name, email, password } = req.body

		if (!name || !email || !password) {
			return res.status(400).json({ message: 'name, email and password are required' })
		}

		const existing = await findUserByEmail(email)
		if (existing) {
			return res.status(409).json({ message: 'Email already exists' })
		}

		const passwordHash = await bcrypt.hash(password, 10)
		const user = await createUser({ name, email, passwordHash })
		const token = signToken(user)

		return res.status(201).json({ user, token })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to register', error: error.message })
	}
}

export async function login(req, res) {
	try {
		const { email, password } = req.body

		if (!email || !password) {
			return res.status(400).json({ message: 'email and password are required' })
		}

		const user = await findUserByEmail(email)
		if (!user) {
			return res.status(401).json({ message: 'Invalid credentials' })
		}

		const matches = await bcrypt.compare(password, user.password_hash)
		if (!matches) {
			return res.status(401).json({ message: 'Invalid credentials' })
		}

		const token = signToken(user)

		return res.json({
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
			token,
		})
	} catch (error) {
		return res.status(500).json({ message: 'Failed to login', error: error.message })
	}
}

export async function me(req, res) {
	try {
		const [user, badges] = await Promise.all([
			findUserById(req.user.id),
			getUserBadges(req.user.id),
		])
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}
		return res.json({ user, badges })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to get user', error: error.message })
	}
}
