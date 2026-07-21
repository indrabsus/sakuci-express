const { Setting } = require('../models');

const getStafEditHapus = async (req, res) => {
  try {
    const [setting] = await Setting.findOrCreate({
      where: { id: 1 },
      defaults: { staf_boleh_edit_hapus: false },
    });

    return res.status(200).json({
      status: 'success',
      data: { staf_boleh_edit_hapus: !!setting.staf_boleh_edit_hapus },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil setting.',
      error: error.message,
    });
  }
};

const updateStafEditHapus = async (req, res) => {
  try {
    const { staf_boleh_edit_hapus } = req.body;

    const [setting] = await Setting.findOrCreate({
      where: { id: 1 },
      defaults: { staf_boleh_edit_hapus: !!staf_boleh_edit_hapus },
    });

    await setting.update({
      staf_boleh_edit_hapus: !!staf_boleh_edit_hapus,
      updated_at: new Date(),
    });

    return res.status(200).json({
      status: 'success',
      message: 'Setting berhasil diperbarui.',
      data: { staf_boleh_edit_hapus: !!setting.staf_boleh_edit_hapus },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui setting.',
      error: error.message,
    });
  }
};

module.exports = { getStafEditHapus, updateStafEditHapus };
