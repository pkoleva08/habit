import { Router } from 'express'
import {
	clearNotifications,
	completeHabit,
	createHabitItem,
	deleteAllHabits,
	deleteHabit,
	getHabitCalendar,
	getNotificationPreferenceState,
	listNotifications,
	getReminders,
	listHabits,
	updateHabit,
	updateNotificationPreference,
} from '../controllers/habitController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authMiddleware)
router.get('/', listHabits)
router.get('/notifications', listNotifications)
router.delete('/notifications', clearNotifications)
router.get('/notifications/preference', getNotificationPreferenceState)
router.post('/notifications/preference', updateNotificationPreference)
router.get('/reminders', getReminders)
router.delete('/', deleteAllHabits)
router.post('/', createHabitItem)
router.get('/:id/calendar', getHabitCalendar)
router.patch('/:id', updateHabit)
router.delete('/:id', deleteHabit)
router.post('/:id/complete', completeHabit)

export default router
