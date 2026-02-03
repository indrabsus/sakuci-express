const express = require('express');
const { dataTamu, postBukuTamu, updateBukuTamu, deleteBukuTamu } = require('../controllers/tamuController');
const router = express.Router();
const proteksi = require('../middleware/authMiddleware');
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/data/:id_tamu?', dataTamu);
router.post('/postbukutamu', postBukuTamu);
router.put('/updatebukutamu/:id_tamu', updateBukuTamu);
router.delete('/deletebukutamu/:id_tamu', deleteBukuTamu);

module.exports = router;