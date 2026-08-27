import db from '../database.js'

export async function awardBadgeToUser(userId, badgeId) {
	const { rows } = await db.query(
		`INSERT INTO user_badges (user_id, badge_id, earned_at)
		 VALUES ($1, $2, NOW())
		 ON CONFLICT (user_id, badge_id) DO NOTHING
		 RETURNING id, user_id, badge_id, earned_at`,
		[userId, badgeId],
	)
	return rows[0] || null
}

export async function getUserBadges(userId) {
	const { rows } = await db.query(
		`SELECT ub.id, ub.user_id, ub.badge_id, ub.earned_at,
		        b.name, b.description, b.icon_url
		 FROM user_badges ub
		 JOIN badges b ON ub.badge_id = b.id
		 WHERE ub.user_id = $1
		 ORDER BY ub.earned_at DESC`,
		[userId],
	)
	return rows
}

export async function hasBadge(userId, badgeId) {
	const { rows } = await db.query(
		`SELECT id FROM user_badges
		 WHERE user_id = $1 AND badge_id = $2
		 LIMIT 1`,
		[userId, badgeId],
	)
	return rows.length > 0
}

export async function getAllBadges() {
	const { rows } = await db.query(
		`SELECT id, name, description, icon_url, criteria
		 FROM badges
		 ORDER BY name`,
	)
	return rows
}
