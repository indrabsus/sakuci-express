const db = require('../models');
const {Role, User, DataSiswa} = db;

// Contoh fungsi untuk mendapatkan semua role
const getAllRoles = async (req, res) => {
  try {
    const { id_role } = req.params;

    if (id_role) {
      const role = await Role.findOne({ where: { id_role } });

      if (!role) {
        return res.status(404).json({
          status: "error",
          message: "Data tidak ditemukan",
        });
      }

      return res.status(200).json({
        status: "sukses",
        data: role,
      });
    }

    // Kalau tidak ada id_role → ambil semua
    const roles = await Role.findAll();
    return res.status(200).json({
      status: "sukses",
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error retrieving roles",
      error,
    });
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