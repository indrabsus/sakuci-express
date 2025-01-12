const express = require('express');
const router = express.Router();

// Rute untuk halaman PPDB
router.get('/', (req, res) => {
    res.send('Ini halaman utama PPDB');
});

module.exports = router;