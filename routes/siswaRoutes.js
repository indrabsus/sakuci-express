const express = require('express');
const { dataSiswa, siswaDetail } = require('../controllers/siswaController');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/data', dataSiswa);
router.get('/data/:id', siswaDetail);

module.exports = router;