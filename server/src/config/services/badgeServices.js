/**
 * Badge Service - handles badge awarding logic
 */

import db from '../database.js'

/**
 * Predefined badge thresholds and their criteria
 */
const BADGE_CRITERIA = {
	WEEK_WARRIOR: { days: 7, label: '7-Day Streak' },
	MONTH_MASTER: { days: 30, label: '30-Day Streak' },
	CENTURY_ACHIEVER: { days: 100, label: '100-Day Streak' },
	PERFECT_WEEK: { completions: 7, period: 'week', label: 'Perfect Week' },
	SOCIAL_BUTTERFLY: { friends: 5, label: 'Social Butterfly' },
	GROUP_LEADER: { groupsCreated: 1, label: 'Group Leader' },
}

/**
 * Award a badge to a user
 */
export async function awardBadgeToUser(userId, badgeId) {
	try {
		const { rows } = await db.query(
			`INSERT INTO user_badges (user_id, badge_id, earned_at)
			 VALUES ($1, $2, NOW())
			 ON CONFLICT (user_id, badge_id) DO NOTHING
			 RETURNING id, user_id, badge_id, earned_at`,
			[userId, badgeId],
		)

		return rows[0] || null
	} catch (error) {
		console.error('Error awarding badge:', error)
		return null
	}
}

/**
 * Check and award streak badges
 */
export async function checkStreakBadges(userId) {
	const awardedBadges = []

	try {
		// Get all habits for the user with their current streaks
		const { rows: habits } = await db.query(
			`SELECT id, name, streak, frequency
			 FROM habits
			 WHERE user_id = $1`,
			[userId],
		)

		for (const habit of habits) {
			let badgeId = null
			let badgeName = null

			// Check daily habits for milestone streaks
			if (habit.frequency === 'daily') {
				if (habit.streak === 7) {
					badgeName = BADGE_CRITERIA.WEEK_WARRIOR.label
				} else if (habit.streak === 30) {
					badgeName = BADGE_CRITERIA.MONTH_MASTER.label
				} else if (habit.streak === 100) {
					badgeName = BADGE_CRITERIA.CENTURY_ACHIEVER.label
				}
			}

			if (badgeName) {
				// Get or create badge
				const { rows: badges } = await db.query(
					`SELECT id FROM badges WHERE name = $1 LIMIT 1`,
					[badgeName],
				)

				badgeId = badges[0]?.id

				if (!badgeId) {
					const { rows: newBadges } = await db.query(
						`INSERT INTO badges (name, description, icon_url)
						 VALUES ($1, $2, $3)
						 RETURNING id`,
						[badgeName, `Achieved ${habit.streak}-day streak on ${habit.name}`, null],
					)
					badgeId = newBadges[0].id
				}

				// Award badge to user
				const awarded = await awardBadgeToUser(userId, badgeId)
				if (awarded) {
					awardedBadges.push({
						id: badgeId,
						name: badgeName,
						habitName: habit.name,
					})
				}
			}
		}
	} catch (error) {
		console.error('Error checking streak badges:', error)
	}

	return awardedBadges
}

/**
 * Get all badges earned by a user
 */
export async function getUserBadges(userId) {
	try {
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
	} catch (error) {
		console.error('Error fetching user badges:', error)
		return []
	}
}

/**
 * Get all available badges
 */
export async function getAllBadges() {
	try {
		const { rows } = await db.query(
			`SELECT id, name, description, icon_url, created_at
			 FROM badges
			 ORDER BY name`,
		)

		return rows
	} catch (error) {
		console.error('Error fetching all badges:', error)
		return []
	}
}

/**
 * Get badge statistics for a user
 */
export async function getUserBadgeStats(userId) {
	try {
		const { rows } = await db.query(
			`SELECT 
				COUNT(DISTINCT ub.badge_id) as total_earned,
				COUNT(DISTINCT b.id) as total_available,
				ROUND(
					COUNT(DISTINCT ub.badge_id)::numeric / NULLIF(COUNT(DISTINCT b.id), 0) * 100, 
					2
				) as completion_percentage
			 FROM badges b
			 LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1`,
			[userId],
		)

		return rows[0]
	} catch (error) {
		console.error('Error fetching badge stats:', error)
		return null
	}
}
