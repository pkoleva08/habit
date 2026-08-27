import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import {
	getAllUsers,
	updateUserRole,
	getSystemStats,
	deleteUser,
	getUserActivityReport,
} from '../controllers/adminController.js'

const router = Router()

/**
 * All admin routes require authentication and admin role
 */

// Get all users
router.get('/users', authMiddleware, requireRole('admin'), getAllUsers)

// Update user role
router.put('/users/:id/role', authMiddleware, requireRole('admin'), updateUserRole)

// Get system statistics
router.get('/stats', authMiddleware, requireRole('admin'), getSystemStats)

// Delete user
router.delete('/users/:id', authMiddleware, requireRole('admin'), deleteUser)

// Get user activity report
router.get('/activity-report', authMiddleware, requireRole('admin'), getUserActivityReport)

export default router
