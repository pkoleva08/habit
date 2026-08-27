import cors from 'cors'
import express from 'express'
import authRoutes from './config/routers/authRouters.js'
import habitRoutes from './config/routers/habitRouters.js'
import groupRoutes from './config/routers/groupRouter.js'
import analyticsRoutes from './config/routers/analyticsRouters.js'
import adminRoutes from './config/routers/adminRoutes.js'
import { errorHandler, notFoundHandler } from './config/middleware/errorMiddleware.js'

const app = express()

const isAllowedOrigin = (origin) => {
	if (!origin) return true

	const normalizedOrigin = origin.toLowerCase()

	if (
		normalizedOrigin.includes('localhost') ||
		normalizedOrigin.includes('127.0.0.1') ||
		normalizedOrigin.includes('0.0.0.0')
	) {
		return true
	}

	if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)[0-9.]+:[0-9]+$/.test(normalizedOrigin)) {
		return true
	}

	return false
}

app.use(
	cors({
		origin: (origin, callback) => {
			callback(null, isAllowedOrigin(origin))
		},
		credentials: true,
	}),
)
app.use(express.json())

app.get('/health', (_req, res) => {
	res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/habits', habitRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/admin', adminRoutes)

// 404 handler for undefined routes
app.use(notFoundHandler)

// Error handling middleware (must be last)
app.use(errorHandler)

export default app
