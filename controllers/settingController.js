const { Setting } = require('../models');
const catatLogAktivitas = require('../utils/catatLogAktivitas');

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

    const sebelum = !!setting.staf_boleh_edit_hapus;
    const sesudah = !!staf_boleh_edit_hapus;

    await setting.update({
      staf_boleh_edit_hapus: sesudah,
      updated_at: new Date(),
    });

    if (sebelum !== sesudah) {
      catatLogAktivitas(req, {
        modul: 'setting',
        aksi: 'update',
        keterangan: `Mengubah izin staf edit/hapus dari ${sebelum ? 'diizinkan' : 'tidak diizinkan'} menjadi ${sesudah ? 'diizinkan' : 'tidak diizinkan'}`,
        data_sebelum: { staf_boleh_edit_hapus: sebelum },
        data_sesudah: { staf_boleh_edit_hapus: sesudah },
      });
    }

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
