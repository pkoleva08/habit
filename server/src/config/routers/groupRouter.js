import { Router } from 'express'
import {
	createGroupItem,
	groupLeaderboard,
	joinGroupItem,
	leaveGroupItem,
	listGroups,
} from '../controllers/groupController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authMiddleware)
router.get('/', listGroups)
router.post('/', createGroupItem)
router.post('/join', joinGroupItem)
router.post('/:code/join', joinGroupItem)
router.post('/:id/leave', leaveGroupItem)
router.get('/:id/leaderboard', groupLeaderboard)

export default router
