// authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

// Endpoint untuk login dan menghasilkan JWT
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Proses validasi username dan password (misalnya, cek di database)
  if (username === 'user' && password === 'password123') {
    const payload = { userId: 1, username }; // Data yang ingin Anda masukkan dalam token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Membuat token dengan expire 1 jam

    return res.status(200).json({
      message: 'Login Successful!',
      token: token, // Kirimkan token JWT ke client
    });
  } else {
    return res.status(401).json({ message: 'Invalid Credentials' });
  }
});

module.exports = router;
