const {KelasPpdb} = require('../models')
const dataKelas = async (req, res) => {
  try {
     const {tingkat} = req.params
    const kelas = await KelasPpdb.findAll({
  where: tingkat ? { tingkat } : {},
  order: [
    ["tingkat", "ASC"],
    ["nama_kelas", "ASC"]
  ]
});
    res.status(200).json({
      status: 'success',
      message: 'Data kelas berhasil diambil.',
      data: kelas,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data kelas.',
      error: error.message,
    });
  }
}

module.exports = {dataKelas}