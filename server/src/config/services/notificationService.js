export async function getDueReminders(db, userId) {
	const { rows } = await db.query(
		`SELECT id AS habit_id, user_id, name, reminder_time
		 FROM habits
		 WHERE reminder_time IS NOT NULL
			 AND user_id = $1
			 AND id NOT IN (
				 SELECT habit_id
				 FROM habit_completions
				 WHERE date(completed_at) = date('now')
			 )`,
		[userId],
	)

	return rows
}

export async function createNotification(db, { userId, type, message }) {
	const { rows } = await db.query(
		`INSERT INTO notifications (user_id, type, message)
		 VALUES ($1, $2, $3)
		 RETURNING id, user_id, type, message, read_at, created_at`,
		[userId, type, message],
	)

	return rows[0]
}

export async function getUserNotifications(db, userId, limit = 20) {
	const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
	const { rows } = await db.query(
		`SELECT id, user_id, type, message, read_at, created_at
		 FROM notifications
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2`,
		[userId, safeLimit],
	)

	return rows
}

export async function clearUserNotifications(db, userId) {
	const { rowCount } = await db.query(
		`DELETE FROM notifications
		 WHERE user_id = $1`,
		[userId],
	)

	return rowCount
}

export async function getNotificationPreference(db, userId) {
	const { rows } = await db.query(
		`SELECT user_id, notifications_enabled, permission_state, updated_at
		 FROM user_notification_settings
		 WHERE user_id = $1
		 LIMIT 1`,
		[userId],
	)

	return rows[0] || { user_id: userId, notifications_enabled: true, permission_state: 'unknown' }
}

export async function setNotificationPreference(db, { userId, notificationsEnabled, permissionState }) {
	const enabled = notificationsEnabled === undefined ? true : Boolean(notificationsEnabled)
	const state = permissionState || (enabled ? 'granted' : 'denied')

	const { rows } = await db.query(
		`INSERT INTO user_notification_settings (user_id, notifications_enabled, permission_state, updated_at)
		 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
		 ON CONFLICT (user_id)
		 DO UPDATE SET notifications_enabled = EXCLUDED.notifications_enabled,
			permission_state = EXCLUDED.permission_state,
			updated_at = CURRENT_TIMESTAMP
		 RETURNING user_id, notifications_enabled, permission_state, updated_at`,
		[userId, enabled, state],
	)

	return rows[0]
}

export async function processDueHabitReminders(db) {
	const { rows: habits } = await db.query(
		`SELECT h.id, h.user_id, h.name, h.reminder_time
		 FROM habits h
		 WHERE h.reminder_time IS NOT NULL`,
	)

	const now = new Date()
	const nowMinutes = now.getHours() * 60 + now.getMinutes()

	for (const habit of habits) {
		if (!habit.reminder_time) continue

		const [hours, minutes] = String(habit.reminder_time).split(':').map(Number)
		if (Number.isNaN(hours) || Number.isNaN(minutes)) continue

		const reminderMinutes = hours * 60 + minutes
		if (Math.abs(nowMinutes - reminderMinutes) > 1) continue

		const targetMessage = `Habit reminder: "${habit.name}" is due now.`
		const { rows: existing } = await db.query(
			`SELECT id
			 FROM notifications
			 WHERE user_id = $1 AND message = $2 AND date(created_at) = date('now')
			 LIMIT 1`,
			[habit.user_id, targetMessage],
		)

		if (existing.length > 0) continue

		await createNotification(db, {
			userId: habit.user_id,
			type: 'reminder',
			message: targetMessage,
		})
	}
}

export async function processBadgeNotifications(db, userId) {
	const milestones = [7, 30, 100]
	const notifications = []

	const { rows: habits } = await db.query(
		`SELECT id, name, streak
		 FROM habits
		 WHERE user_id = $1`,
		[userId],
	)

	for (const habit of habits) {
		if (!milestones.includes(Number(habit.streak))) {
			continue
		}

		const badgeName = `${habit.streak}-day streak`

		const badgeResult = await db.query(
			`INSERT INTO badges (name, description)
			 VALUES ($1, $2)
			 ON CONFLICT (name)
			 DO UPDATE SET description = EXCLUDED.description
			 RETURNING id, name`,
			[badgeName, `Completed ${habit.streak} consecutive days on ${habit.name}`],
		)

		const badge = badgeResult.rows[0]

		const awardResult = await db.query(
			`INSERT INTO user_badges (user_id, badge_id)
			 VALUES ($1, $2)
			 ON CONFLICT (user_id, badge_id)
			 DO NOTHING
			 RETURNING id`,
			[userId, badge.id],
		)

		if (awardResult.rowCount > 0) {
			const message = `Поздравления! Спечели badge: ${badge.name}`
			notifications.push(message)
			await createNotification(db, {
				userId,
				type: 'badge',
				message,
			})
		}
	}

	return notifications
}
