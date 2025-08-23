const db = require('../models');
const {Role, User, DataSiswa} = db;

// Contoh fungsi untuk mendapatkan semua role
const getAllRoles = async (req, res) => {
  try {
    const roles = await DataSiswa.findAll({
      include: [{ model: User, as: 'users' }],
    });
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving roles', error });
  }
};

// Contoh fungsi untuk menambahkan role baru
const createRole = async (req, res) => {
  try {
    const { id_role, nama_role } = req.body;
    const newRole = await Role.create({ id_role, nama_role });
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ message: 'Error creating role', error });
  }
};

module.exports = {
  getAllRoles,
  createRole,
};