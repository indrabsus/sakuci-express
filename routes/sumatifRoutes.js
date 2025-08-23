const express = require('express');
const { dataSumatif, jawabSoal, getJawaban, fetchSumatif, selesai, cekUjian, opsiSoal, tampungSoal } = require('../controllers/sumatifController');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/data/:id', dataSumatif);
router.post('/jawab-soal', jawabSoal);
router.get('/get-jawaban/:id_sumatif/:id_user_siswa', getJawaban);
router.get('/fetch/:id_sumatif', fetchSumatif);
router.put('/selesai/:id_sumatif/:id_user_siswa', selesai);
router.get('/cek-ujian/:id_sumatif/:id_user', cekUjian);
router.get('/tampung-soal/:id_soalujian', tampungSoal);
router.get('/opsi-soal/:id_soal', opsiSoal);

module.exports = router;