const express = require('express');
const { dataUjian, ujianku } = require('../controllers/sitepatController');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/data/:id', dataUjian);
router.get('/dataku', ujianku);

module.exports = router;