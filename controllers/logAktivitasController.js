const { LogAktivitas } = require('../models');
const { Op } = require('sequelize');

const getLogAktivitas = async (req, res) => {
  try {
    const { modul, keyword, tanggal_mulai, tanggal_selesai } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const where = {};

    if (modul) where.modul = modul;

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { keterangan: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (tanggal_mulai || tanggal_selesai) {
      where.created_at = {};
      if (tanggal_mulai) where.created_at[Op.gte] = new Date(`${tanggal_mulai}T00:00:00`);
      if (tanggal_selesai) where.created_at[Op.lte] = new Date(`${tanggal_selesai}T23:59:59`);
    }

    const { count, rows } = await LogAktivitas.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Data log aktivitas berhasil diambil.',
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data log aktivitas.',
      error: error.message,
    });
  }
};

module.exports = { getLogAktivitas };
