const jwt = require('jsonwebtoken');
require('dotenv').config();



// app.use(cors({
//   origin: 'http://localhost:3000', // Ganti dengan URL frontend
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));


const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Ambil token dari header Authorization

  if (!token) {
    return res.status(401).json({ message: 'Access Denied. No Token Provided.' });
  }

  try {
    // Verifikasi token menggunakan JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Menyimpan data user dari token ke request
    next(); // Melanjutkan ke route berikutnya
  } catch (error) {
    return res.status(400).json({ message: 'Invalid Token.' });
  }
};

module.exports = authMiddleware;
