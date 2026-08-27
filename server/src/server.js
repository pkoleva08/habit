import dotenv from 'dotenv'
import app from './app.js'
import db from './config/database.js'
import { processDueHabitReminders } from './config/services/notificationService.js'

dotenv.config()

const port = Number(process.env.PORT || 4000)

async function startReminderScheduler() {
	await processDueHabitReminders(db)
	setInterval(() => {
		processDueHabitReminders(db).catch((error) => {
			console.error('Reminder scheduler error:', error.message)
		})
	}, 60_000)
}

async function start() {
	try {
		const { usingFallback } = await db.init()
		await db.query('SELECT 1')
		app.listen(port, '0.0.0.0', () => {
			console.log(`Server is running on http://0.0.0.0:${port}`)
			console.log(`Access from network: http://192.168.68.59:${port}`)
			console.log(`Database mode: ${usingFallback ? 'SQLite (persistent file)' : 'postgres'}`)
		})
		await startReminderScheduler()
	} catch (error) {
		console.error('Failed to start server:', error)
		process.exit(1)
	}
}

start()
