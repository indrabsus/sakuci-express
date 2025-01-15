const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Pastikan path sesuai dengan lokasi model User
const router = express.Router();
require('dotenv').config();

// Endpoint untuk login dan menghasilkan JWT
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Cari user berdasarkan username dan acc = 'y'
    const user = await User.findOne({
      where: { username, acc: 'y' }, // Hanya user dengan acc = 'y'
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid Credentials bro' });
    }

    // Validasi password dengan bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password.replace('$2y$', '$2a$'));

    if (!isPasswordValid) {
      return res.status(401).json({ message: isPasswordValid  });
    }

    // Data yang dimasukkan ke dalam JWT
    const payload = { userId: user.id, username: user.username, id_role: user.id_role };

    // Membuat token JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({
      message: 'Login Successful!',
      token: token,
      data: payload,
      status: 200
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
