const express = require('express');
const { dataUjian } = require('../controllers/sitepatController');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/data/:id', dataUjian);

module.exports = router;