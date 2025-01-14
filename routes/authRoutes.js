// authRoutes.js
require('dotenv').config();
const express = require('express');
// const jwt = require('jsonwebtoken');
const router = express.Router();

// Endpoint untuk login dan menghasilkan JWT
router.post('/login', (req, res) => {
  const { username, password } = req.body;

});

module.exports = router;
