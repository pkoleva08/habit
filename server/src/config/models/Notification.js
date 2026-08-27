import db from '../database.js'

export async function createNotificationRecord(userId, type, message, relatedId = null) {
	const { rows } = await db.query(
		`INSERT INTO notifications (user_id, type, message, related_id, created_at)
		 VALUES ($1, $2, $3, $4, NOW())
		 RETURNING id, user_id, type, message, related_id, created_at, is_read`,
		[userId, type, message, relatedId],
	)
	return rows[0]
}

export async function getUserNotificationsModel(userId, limit = 50) {
	const { rows } = await db.query(
		`SELECT id, user_id, type, message, related_id, created_at, is_read
		 FROM notifications
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2`,
		[userId, limit],
	)
	return rows
}

export async function markNotificationAsRead(notificationId, userId) {
	const { rows } = await db.query(
		`UPDATE notifications
		 SET is_read = true
		 WHERE id = $1 AND user_id = $2
		 RETURNING id, is_read`,
		[notificationId, userId],
	)
	return rows[0]
}

export async function deleteNotification(notificationId, userId) {
	await db.query(
		`DELETE FROM notifications
		 WHERE id = $1 AND user_id = $2`,
		[notificationId, userId],
	)
}

export async function getUnreadCount(userId) {
	const { rows } = await db.query(
		`SELECT COUNT(*) as unread_count
		 FROM notifications
		 WHERE user_id = $1 AND is_read = false`,
		[userId],
	)
	return rows[0].unread_count
}
