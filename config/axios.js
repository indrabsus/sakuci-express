// config/axios.js
const axios = require('axios');

const axiosInstance = axios.create({
  baseURL: process.env.API_INTERNAL, // Ganti dengan domain yang sesuai
  timeout: 5000,  // Timeout jika server lambat
});

module.exports = {axios, axiosInstance};
