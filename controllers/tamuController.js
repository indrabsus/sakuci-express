const {DataTamu} = require('../models')
const dataTamu = async (req, res) => {
  try {
    const { id_tamu } = req.params;

    let data;

    if (id_tamu) {
      // ================== FIND ONE ==================
      data = await DataTamu.findOne({
        where: { id_tamu }
      });

      if (!data) {
        return res.status(404).json({
          status: 'error',
          message: 'Data tamu tidak ditemukan'
        });
      }
    } else {
      // ================== FIND ALL ==================
      data = await DataTamu.findAll({
        order: [["created_at", "DESC"]]
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Data tamu berhasil diambil.',
      data
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data tamu.',
      error: error.message
    });
  }
};


const postBukuTamu = async(req, res) => {
  try {
    const data = await DataTamu.create(req.body)
    res.status(200).json({
      status: 'success',
      message: 'Data tamu berhasil ditambahkan.',
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal menambahkan data tamu.',
      error: error.message,
    });
  }
}

const updateBukuTamu = async(req, res) => {
  const {id_tamu} = req.params;
  try {
    const data = await DataTamu.update(req.body, {
      where: {id_tamu}
    })
    res.status(200).json({
      status: 'success',
      message: 'Data tamu berhasil diperbarui.',
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui data tamu.',
      error: error.message,
    });
  }
}

const deleteBukuTamu = async(req, res) => {
  const {id_tamu} = req.params;
  try {
    const data = await DataTamu.destroy({
      where: {id_tamu}
    })
    res.status(200).json({
      status: 'success',
      message: 'Data tamu berhasil dihapus.',
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal menghapus data tamu.',
      error: error.message,
    });
  }
}


module.exports = {dataTamu, postBukuTamu, updateBukuTamu, deleteBukuTamu}