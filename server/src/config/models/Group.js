import db from '../database.js'

const GROUP_CODE_CHARS = '0123456789'

function generateGroupCode(length = 6) {
	let code = ''
	for (let index = 0; index < length; index += 1) {
		code += GROUP_CODE_CHARS[Math.floor(Math.random() * GROUP_CODE_CHARS.length)]
	}
	return code
}

async function generateUniqueGroupCode() {
	for (let attempt = 0; attempt < 10; attempt += 1) {
		const inviteCode = generateGroupCode(6)
		const { rows } = await db.query('SELECT id FROM groups WHERE invite_code = $1 LIMIT 1', [inviteCode])
		if (rows.length === 0) {
			return inviteCode
		}
	}

	return String(Date.now()).slice(-6).padStart(6, '0')
}

export async function createGroup({ name, description, ownerId }) {
	const client = await db.connect()
	try {
		await client.query('BEGIN')
		const inviteCode = await generateUniqueGroupCode()

		const groupResult = await client.query(
			`INSERT INTO groups (name, description, invite_code, owner_id)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, name, description, invite_code, owner_id, created_at`,
			[name, description || null, inviteCode, ownerId],
		)

		const group = groupResult.rows[0]

		await client.query(
			`INSERT INTO group_members (group_id, user_id, role)
			 VALUES ($1, $2, 'admin')`,
			[group.id, ownerId],
		)

		await client.query('COMMIT')
		return group
	} catch (error) {
		await client.query('ROLLBACK')
		throw error
	} finally {
		client.release()
	}
}

export async function joinGroup(groupId, userId) {
	await db.query(
		`INSERT INTO group_members (group_id, user_id, role)
		 VALUES ($1, $2, 'member')
		 ON CONFLICT (group_id, user_id) DO NOTHING`,
		[groupId, userId],
	)
}

export async function findGroupByInviteCode(inviteCode) {
	const { rows } = await db.query(
		`SELECT id, name, description, invite_code, owner_id, created_at
		 FROM groups
		 WHERE invite_code = $1
		 LIMIT 1`,
		[inviteCode],
	)
	return rows[0] || null
}
