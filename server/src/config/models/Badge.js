import db from '../database.js'

export async function getUserBadges(userId) {
	const { rows } = await db.query(
		`SELECT b.id, b.name, b.description, ub.earned_at
		 FROM user_badges ub
		 JOIN badges b ON b.id = ub.badge_id
		 WHERE ub.user_id = $1
		 ORDER BY ub.earned_at DESC`,
		[userId],
	)

	return rows
}

export async function getAllBadges() {
	const { rows } = await db.query(
		`SELECT id, name, description, icon_url, criteria, created_at
		 FROM badges
		 ORDER BY name`,
	)
	return rows
}

export async function createBadge({ name, description, iconUrl, criteria }) {
	const { rows } = await db.query(
		`INSERT INTO badges (name, description, icon_url, criteria)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, description, icon_url, criteria, created_at`,
		[name, description, iconUrl, criteria],
	)
	return rows[0]
}

export async function getBadgeById(badgeId) {
	const { rows } = await db.query(
		`SELECT id, name, description, icon_url, criteria, created_at
		 FROM badges
		 WHERE id = $1
		 LIMIT 1`,
		[badgeId],
	)
	return rows[0] || null
}

