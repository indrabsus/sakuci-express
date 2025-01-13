// config/axios.js
const axios = require('axios');

const axiosInstance = axios.create({
  baseURL: 'https://exs.sakuci.id', // Ganti dengan domain yang sesuai
  timeout: 5000,  // Timeout jika server lambat
});

module.exports = axiosInstance;
