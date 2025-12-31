const db = require('../models');
const {Role, User, DataSiswa} = db;

// Contoh fungsi untuk mendapatkan semua role
const getAllRoles = async (req, res) => {
  try {
    const { id_role } = req.params;

    if (id_role) {
      const role = await Role.findOne({ where: { id_role } }
      );

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
    const roles = await Role.findAll({order: [["created_at", "DESC"]]});
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
    const { nama_role } = req.body;
    const data = await Role.create({ nama_role });
    return res.status(201).json({
      status: "sukses",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error creating role",
      error,
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id_role } = req.params;
    const { nama_role } = req.body;
    const data = await Role.update({ nama_role }, { where: { id_role } });
    return res.status(200).json({
      status: "sukses",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error updating role",
      error,
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id_role } = req.params;
    const data = await Role.destroy({ where: { id_role } });
    return res.status(200).json({
      status: "sukses",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error deleting role",
      error,
    });
  }
};

module.exports = {
  getAllRoles,
  createRole, updateRole, deleteRole
};