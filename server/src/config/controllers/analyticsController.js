import db from '../database.js'
import {
	clearUserRecommendations,
	getMonthlyTrends,
	getRecommendations,
	getWeeklyTrends,
} from '../services/analyticsService.js'

export async function overview(req, res) {
	try {
		const userId = req.user.id

		const [weekly, monthly, recommendations] = await Promise.all([
			getWeeklyTrends(db, userId),
			getMonthlyTrends(db, userId),
			getRecommendations(db, userId),
		])

		return res.json({ weekly, monthly, recommendations })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to get analytics', error: error.message })
	}
}

export async function clearRecommendations(req, res) {
	try {
		const deletedCount = await clearUserRecommendations(db, req.user.id)
		return res.json({ deletedCount, message: 'Recommendations cleared successfully' })
	} catch (error) {
		return res.status(500).json({ message: 'Failed to clear recommendations', error: error.message })
	}
}
