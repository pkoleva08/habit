import db from '../database.js'

export async function findUserByEmail(email) {
	const { rows } = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
	return rows[0] || null
}

export async function findUserById(id) {
	const { rows } = await db.query(
		'SELECT id, name, email, role, created_at FROM users WHERE id = $1 LIMIT 1',
		[id],
	)
	return rows[0] || null
}

export async function createUser({ name, email, passwordHash, role = 'user' }) {
	const { rows } = await db.query(
		`INSERT INTO users (name, email, password_hash, role)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, email, role, created_at`,
		[name, email, passwordHash, role],
	)

	return rows[0]
}
