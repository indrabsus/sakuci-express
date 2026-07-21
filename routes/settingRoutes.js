const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const { getStafEditHapus, updateStafEditHapus } = require('../controllers/settingController');
const router = express.Router();

router.get('/staf-edit-hapus', proteksi, getStafEditHapus);
router.put('/staf-edit-hapus', proteksi, updateStafEditHapus);

module.exports = router;
