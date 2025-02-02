const express = require('express');
const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT
const router = express.Router();

// Route yang dilindungi, hanya dapat diakses jika token valid
router.get('/profile', authMiddleware, (req, res) => {
  return res.status(200).json({
    message: 'Welcome to your profile',
    user: req.user, // Data user yang terdapat di dalam token
  });
});

module.exports = router;
