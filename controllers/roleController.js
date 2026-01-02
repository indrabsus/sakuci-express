const { where, Op } = require('sequelize');
const db = require('../models');
const {Role, User, DataSiswa} = db;
const bcrypt = require("bcrypt");

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

const userData = async (req, res) => {
  try {
    const { id } = req.params;
    if(id){
    const data = await User.findOne({ where: { id },
      include: [
        {
          model: Role,
          as: "role",
        },
      ],
    });
    if(!data){
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: "sukses",
      data,
    });
    }

    const data = await User.findAll({
      where: {
        id_role: {
          [Op.notIn]: [6,7,8]
        }
      },
      include: [
        {
          model: Role,
          as: "role",
        },
      ],
      order: [["created_at", "DESC"]]
    });
    return res.status(200).json({
      status: "sukses",
      data,
    });
    
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
      error,
    });
  }
};



const createUser = async (req, res) => {
  try {
    const { username, id_role } = req.body;

    if (!username) {
      return res.status(400).json({
        status: "error",
        message: "Username wajib diisi",
      });
    }

    // 1️⃣ Bersihkan username (hanya huruf & angka)
    const baseUsername = username
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    if (baseUsername.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Username tidak valid setelah dibersihkan",
      });
    }

    // 2️⃣ Cari username unik dengan 3 digit
    let finalUsername = baseUsername;
    let counter = 1;

    const exists = await User.findOne({ where: { username: finalUsername } });

    if (exists) {
      while (true) {
        const suffix = String(counter).padStart(3, "0"); // 001, 002, 003
        finalUsername = `${baseUsername}${suffix}`;

        const check = await User.findOne({
          where: { username: finalUsername },
        });

        if (!check) break;
        counter++;
      }
    }

    // 3️⃣ Password default
    const defaultPassword = "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 4️⃣ Simpan user
    const data = await User.create({
      username: finalUsername,
      id_role,
      password: hashedPassword,
      acc: "y",
    });

    return res.status(201).json({
      status: "sukses",
      data,
      info: `Username disimpan sebagai ${finalUsername}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await User.update(req.body, { where: { id } });
    return res.status(200).json({
      status: "sukses",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
      error,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await User.destroy({ where: { id } });
    return res.status(200).json({
      status: "sukses",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
      error,
    });
  }
};

module.exports = {
  getAllRoles, updateUser, deleteUser, createUser,
  createRole, updateRole, deleteRole, userData
};