import express from 'express';
import {
  getUserNotificationsModel,
} from '../models/notificationModel.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications =
      await getUserNotificationsModel(userId);

    res.json(notifications);
  } catch (error) {
    console.error(
      'Error getting notifications:',
      error
    );

    res.status(500).json({
      message: 'Failed to get notifications',
    });
  }
});

export default router;