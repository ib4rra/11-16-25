const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// ✅ CRUD Endpoints
router.post('/', verifyToken, activityController.createActivity);
router.get('/', activityController.getActivities);
router.get('/:id', activityController.getActivityById);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

module.exports = router;
