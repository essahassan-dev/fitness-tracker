const express = require('express');
const router  = express.Router();
const { protect, superAdminOnly } = require('../middleware/auth');
const {
  getPlatformStats, getAllAdmins, getAdminDetail,
  toggleAdminStatus, createAdmin, deleteAdmin,
  getAllUsers, banUser,
} = require('../controllers/superAdminController');

router.use(protect, superAdminOnly);

router.get('/stats',              getPlatformStats);
router.get('/admins',             getAllAdmins);
router.get('/admins/:id',         getAdminDetail);
router.post('/admins',            createAdmin);
router.put('/admins/:id/status',  toggleAdminStatus);
router.delete('/admins/:id',      deleteAdmin);
router.get('/users',              getAllUsers);
router.put('/users/:id/ban',      banUser);

module.exports = router;
