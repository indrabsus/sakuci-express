const express = require('express');
const { userZk, getKehadiran, createUserZk } = require('../controllers/zkController');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/userlist', userZk);
router.get('/getkehadiran', getKehadiran);
router.post('/createuser', createUserZk);

module.exports = router;