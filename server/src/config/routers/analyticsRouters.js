import { Router } from 'express'
import { clearRecommendations, overview } from '../controllers/analyticsController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authMiddleware)
router.get('/overview', overview)
router.delete('/recommendations', clearRecommendations)

export default router
