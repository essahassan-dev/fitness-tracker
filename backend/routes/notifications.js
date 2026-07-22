const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getNotifications, markRead, deleteNotification, clearAll } = require('../controllers/notificationController');

router.use(protect);
router.get('/',           getNotifications);
router.put('/read',       markRead);
router.delete('/all',     clearAll);
router.delete('/:id',     deleteNotification);

module.exports = router;
