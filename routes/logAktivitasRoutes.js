const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const { getLogAktivitas } = require('../controllers/logAktivitasController');

const router = express.Router();

router.get('/', proteksi, getLogAktivitas);

module.exports = router;
