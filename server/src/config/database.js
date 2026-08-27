import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import pkg from 'pg'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

dotenv.config()

const { Pool } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const schemaPath = path.resolve(__dirname, '../../../database/schema.sql')
const dbFilePath = path.resolve(__dirname, '../../../database/habitly.sqlite')

let activePool = null
let usingFallback = false

function createPostgresPool() {
	const pool = new Pool({
		host: process.env.DB_HOST || 'localhost',
		port: Number(process.env.DB_PORT || 5432),
		user: process.env.DB_USER || 'postgres',
		password: process.env.DB_PASSWORD || 'postgres',
		database: process.env.DB_NAME || 'habitly',
	})

	pool.on('error', (error) => {
		console.error('Unexpected Postgres client error:', error)
	})

	return pool
}

// Wraps better-sqlite3 (sync) to look like a pg Pool (async query/connect API)
function createSQLitePool() {
	const sqlite = new Database(dbFilePath)
	sqlite.pragma('journal_mode = WAL')
	sqlite.pragma('foreign_keys = ON')

	// Only create tables if they don't exist yet — never drop existing data
	const rawSchema = fs.readFileSync(schemaPath, 'utf8')
	const sqliteSchema = convertSchemaToSQLite(rawSchema)
	sqlite.exec(sqliteSchema)
	ensureHabitBestStreakColumn(sqlite)
	ensureGroupInviteCodeColumn(sqlite)
	ensureDefaultUsers(sqlite)

	let nextId = {}

	function getNextId(table) {
		if (!nextId[table]) {
			const row = sqlite.prepare(`SELECT MAX(id) as max FROM ${table}`).get()
			nextId[table] = (row?.max || 0) + 1
		} else {
			nextId[table]++
		}
		return nextId[table]
	}

	// Convert $1, $2 style params to ? and handle RETURNING
	function sqliteQuery(text, params = []) {
		// Replace $1, $2 etc with ?
		let sql = text.replace(/\$(\d+)/g, '?')

		// Normalize whitespace
		sql = sql.trim()

		// Handle INSERT ... RETURNING
		const returningMatch = sql.match(/^(INSERT\s+INTO\s+(\w+)\s+.*?)\s+RETURNING\s+(.+)$/is)
		if (returningMatch) {
			const insertSql = returningMatch[1]
			const tableName = returningMatch[2]
			const returningCols = returningMatch[3]

			const stmt = sqlite.prepare(insertSql)
			const result = stmt.run(...params)
			const lastId = result.lastInsertRowid

			const colList = returningCols === '*' ? '*' : returningCols
			const row = sqlite.prepare(`SELECT ${colList} FROM ${tableName} WHERE rowid = ?`).get(lastId)
			return { rows: row ? [normalizeRow(row)] : [], rowCount: result.changes }
		}

		// Handle UPDATE ... RETURNING
		const updateReturningMatch = sql.match(/^(UPDATE\s+\w+\s+.*?)\s+RETURNING\s+(.+)$/is)
		if (updateReturningMatch) {
			// Extract table name from UPDATE
			const tableMatch = sql.match(/UPDATE\s+(\w+)\s+/i)
			const tableName = tableMatch ? tableMatch[1] : null

			// Extract WHERE condition to find updated rows
			const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+RETURNING|$)/is)
			const updateSql = updateReturningMatch[1]
			const returningCols = updateReturningMatch[2]

			const stmt = sqlite.prepare(updateSql)
			const result = stmt.run(...params)

			if (tableName && result.changes > 0) {
				try {
					const whereClause = (whereMatch?.[1] || '').trim()
					const whereParamCount = (whereClause.match(/\?/g) || []).length
					const whereValues = whereParamCount > 0 ? params.slice(-whereParamCount) : []
					const selectSql = whereClause
						? `SELECT ${returningCols} FROM ${tableName} WHERE ${whereClause} LIMIT 1`
						: `SELECT ${returningCols} FROM ${tableName} ORDER BY rowid DESC LIMIT 1`
					const row = sqlite.prepare(selectSql).get(...whereValues)
					return { rows: row ? [normalizeRow(row)] : [], rowCount: result.changes }
				} catch {
					return { rows: [], rowCount: result.changes }
				}
			}
			return { rows: [], rowCount: result.changes }
		}

		// Regular SELECT
		if (/^\s*SELECT/i.test(sql) || /^\s*WITH/i.test(sql)) {
			try {
				const rows = sqlite.prepare(sql).all(...params)
				return { rows: rows.map(normalizeRow), rowCount: rows.length }
			} catch (err) {
				throw new Error(`SQLite SELECT error: ${err.message}\nSQL: ${sql}`)
			}
		}

		// INSERT / UPDATE / DELETE (no RETURNING)
		try {
			const stmt = sqlite.prepare(sql)
			const result = stmt.run(...params)
			return { rows: [], rowCount: result.changes }
		} catch (err) {
			throw new Error(`SQLite write error: ${err.message}\nSQL: ${sql}`)
		}
	}

	function normalizeRow(row) {
		if (!row) return row
		const out = {}
		for (const [k, v] of Object.entries(row)) {
			// Convert SQLite integers (0/1) that represent booleans back to booleans for is_read
			if (k === 'is_read' || k === 'read_at') {
				out[k] = v === null ? null : v === 1 ? true : v === 0 ? false : v
			} else {
				out[k] = v
			}
		}
		return out
	}

	// Fake pg-compatible pool
	return {
		async query(text, params) {
			return sqliteQuery(text, params)
		},
		async connect() {
			// Return a client-like object with BEGIN/COMMIT/ROLLBACK support
			return {
				query(text, params) {
					if (/^\s*BEGIN/i.test(text)) {
						sqlite.prepare('BEGIN').run()
						return { rows: [], rowCount: 0 }
					}
					if (/^\s*COMMIT/i.test(text)) {
						sqlite.prepare('COMMIT').run()
						return { rows: [], rowCount: 0 }
					}
					if (/^\s*ROLLBACK/i.test(text)) {
						sqlite.prepare('ROLLBACK').run()
						return { rows: [], rowCount: 0 }
					}
					return sqliteQuery(text, params)
				},
				release() {},
			}
		},
	}
}

// Converts PostgreSQL CREATE TABLE statements to SQLite-compatible ones
// Strips DROP TABLE and uses CREATE TABLE IF NOT EXISTS to preserve existing data
function convertSchemaToSQLite(sql) {
	// Remove DROP TABLE statements entirely — never wipe data on restart
	let processed = sql.replace(/DROP TABLE IF EXISTS \w+( CASCADE)?;/g, '')

	// Use CREATE TABLE IF NOT EXISTS
	processed = processed.replace(/CREATE TABLE (\w+)/g, 'CREATE TABLE IF NOT EXISTS $1')

	// Remove TIMESTAMPTZ -> TEXT
	processed = processed.replace(/TIMESTAMPTZ/g, 'TEXT')

	// Remove VARCHAR(n) -> TEXT
	processed = processed.replace(/VARCHAR\(\d+\)/g, 'TEXT')

	// GENERATED BY DEFAULT AS IDENTITY -> INTEGER
	processed = processed.replace(/INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')

	// Preserve ON DELETE CASCADE, which SQLite supports and is required for habit cleanup.
	processed = processed.replace(/REFERENCES (\w+)\((\w+)\) ON DELETE CASCADE/g, 'REFERENCES $1($2) ON DELETE CASCADE')

	// Remove constraint checks that SQLite doesn't support well (keep simple ones)
	// Keep the sql as-is for CHECK constraints - SQLite supports basic CHECK

	// Remove INDEX creation (SQLite uses different syntax)
	processed = processed.replace(/CREATE INDEX \w+ ON \w+ \(.*?\);/g, '')

	// Remove DEFAULT CURRENT_TIMESTAMP with TIMESTAMPTZ (already changed to TEXT)
	processed = processed.replace(/DEFAULT CURRENT_TIMESTAMP/g, "DEFAULT (datetime('now'))")

	// Fix UNIQUE constraints
	processed = processed.replace(/UNIQUE NOT NULL/g, 'NOT NULL UNIQUE')

	return processed
}

function ensureHabitBestStreakColumn(sqlite) {
	const columns = sqlite.prepare('PRAGMA table_info(habits)').all()
	const hasBestStreak = columns.some((column) => column.name === 'best_streak')
	if (!hasBestStreak) {
		sqlite.exec('ALTER TABLE habits ADD COLUMN best_streak INTEGER NOT NULL DEFAULT 0')
	}
}

function ensureGroupInviteCodeColumn(sqlite) {
	const columns = sqlite.prepare('PRAGMA table_info(groups)').all()
	const hasInviteCode = columns.some((column) => column.name === 'invite_code')

	if (!hasInviteCode) {
		sqlite.exec('ALTER TABLE groups ADD COLUMN invite_code TEXT')
	}

	const rows = sqlite.prepare('SELECT id FROM groups WHERE invite_code IS NULL').all()
	for (const row of rows) {
		let inviteCode = ''
		for (let attempt = 0; attempt < 20; attempt += 1) {
			inviteCode = generateInviteCode()
			const existing = sqlite.prepare('SELECT id FROM groups WHERE invite_code = ? LIMIT 1').get(inviteCode)
			if (!existing) {
				break
			}
		}
		sqlite.prepare('UPDATE groups SET invite_code = ? WHERE id = ?').run(inviteCode, row.id)
	}

	try {
		sqlite.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code)')
	} catch {
		// SQLite will keep working even if the index already exists in older DBs.
	}
}

function ensureDefaultUsers(sqlite) {
	const defaultUsers = [
		{ name: 'Admin User', email: 'admin@habitly.dev', password: 'Pass1234!', role: 'admin' },
		{ name: 'Demo User', email: 'user@habitly.dev', password: 'Pass1234!', role: 'user' },
	]

	const existingEmails = sqlite
		.prepare('SELECT email FROM users WHERE email IN (?, ?)')
		.all(...defaultUsers.map((user) => user.email))
		.reduce((acc, row) => {
			acc.add(row.email)
			return acc
		}, new Set())

	const insertUser = sqlite.prepare(`
		INSERT INTO users (name, email, password_hash, role)
		VALUES (?, ?, ?, ?)
	`)

	sqlite.transaction(() => {
		defaultUsers.forEach(({ name, email, password, role }) => {
			if (existingEmails.has(email)) {
				return
			}
			const passwordHash = bcrypt.hashSync(password, 10)
			insertUser.run(name, email, passwordHash, role)
		})
	})()
}

function generateInviteCode(length = 8) {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
	let code = ''
	for (let index = 0; index < length; index += 1) {
		code += chars[Math.floor(Math.random() * chars.length)]
	}
	return code
}

async function resolvePool() {
	if (activePool) {
		return activePool
	}

	const primaryPool = createPostgresPool()

	try {
		await primaryPool.query('SELECT 1')
		activePool = primaryPool
		usingFallback = false
		return activePool
	} catch {
		await primaryPool.end().catch(() => {})
		console.warn('PostgreSQL not available — using SQLite (data saved to disk).')
		activePool = createSQLitePool()
		usingFallback = true
		return activePool
	}
}

export const db = {
	async query(text, params) {
		const pool = await resolvePool()
		return pool.query(text, params)
	},
	async connect() {
		const pool = await resolvePool()
		return pool.connect()
	},
	async init() {
		await resolvePool()
		return { usingFallback }
	},
	get pool() {
		if (!activePool) {
			throw new Error('Database pool is not initialized yet.')
		}
		return activePool
	},
	isFallback() {
		return usingFallback
	},
}

export default db
