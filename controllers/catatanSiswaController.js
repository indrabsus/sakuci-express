const { CatatanSiswa, SiswaPpdb } = require("../models");
const { getKajurDataUser, getKajurJurusan } = require("../utils/kajurContext");
const { getSiswaJurusanAktif } = require("../utils/siswaJurusan");
const catatLogAktivitas = require("../utils/catatLogAktivitas");

const daftarSiswaJurusan = async (req, res) => {
  try {
    const kodeJurusan = await getKajurJurusan(req);
    const siswaList = await getSiswaJurusanAktif(kodeJurusan);

    const idSiswaList = siswaList.map((s) => s.id_siswa);
    const catatanList = idSiswaList.length
      ? await CatatanSiswa.findAll({ where: { id_siswa: idSiswaList }, attributes: ["id_siswa", "tipe"] })
      : [];

    const countMap = new Map();
    catatanList.forEach((c) => {
      const entry = countMap.get(c.id_siswa) || { positif: 0, negatif: 0 };
      entry[c.tipe] += 1;
      countMap.set(c.id_siswa, entry);
    });

    const data = siswaList.map((s) => ({
      ...s,
      jumlah_positif: countMap.get(s.id_siswa)?.positif || 0,
      jumlah_negatif: countMap.get(s.id_siswa)?.negatif || 0,
    }));

    return res.status(200).json({
      status: "success",
      message: "Daftar siswa jurusan berhasil diambil.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar siswa jurusan.",
      error: error.message,
    });
  }
};

async function pastikanSiswaSejurusan(req, idSiswa) {
  const kodeJurusan = await getKajurJurusan(req);
  const siswaList = await getSiswaJurusanAktif(kodeJurusan);
  return siswaList.some((s) => s.id_siswa === idSiswa);
}

const daftarCatatanSiswa = async (req, res) => {
  try {
    const { id_siswa } = req.params;

    if (!(await pastikanSiswaSejurusan(req, id_siswa))) {
      return res.status(403).json({ status: "error", message: "Siswa ini bukan siswa jurusan Anda." });
    }

    const rows = await CatatanSiswa.findAll({
      where: { id_siswa },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      message: "Daftar catatan siswa berhasil diambil.",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar catatan siswa.",
      error: error.message,
    });
  }
};

const buatCatatanSiswa = async (req, res) => {
  try {
    const idSiswa = String(req.body?.id_siswa || "");
    const tipe = String(req.body?.tipe || "");
    const catatan = String(req.body?.catatan || "").trim();

    if (!idSiswa || !["positif", "negatif"].includes(tipe) || !catatan) {
      return res.status(400).json({
        status: "error",
        message: "Siswa, tipe (positif/negatif), dan isi catatan wajib diisi.",
      });
    }

    if (!(await pastikanSiswaSejurusan(req, idSiswa))) {
      return res.status(403).json({ status: "error", message: "Siswa ini bukan siswa jurusan Anda." });
    }

    const kajurDataUser = await getKajurDataUser(req);
    const siswa = await SiswaPpdb.findByPk(idSiswa, { attributes: ["nama_lengkap"] });

    const row = await CatatanSiswa.create({
      id_siswa: idSiswa,
      tipe,
      catatan,
      dicatat_oleh: req.user.userId,
      nama_pencatat: kajurDataUser?.nama_lengkap || req.user.username,
    });

    catatLogAktivitas(req, {
      modul: "catatan_siswa",
      aksi: "create",
      keterangan: `Menambahkan catatan ${tipe} untuk ${siswa?.nama_lengkap || idSiswa}`,
      data_sebelum: null,
      data_sesudah: row.toJSON(),
    });

    return res.status(201).json({
      status: "success",
      message: "Catatan berhasil ditambahkan.",
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menambahkan catatan.",
      error: error.message,
    });
  }
};

const hapusCatatanSiswa = async (req, res) => {
  try {
    const row = await CatatanSiswa.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Catatan tidak ditemukan." });
    }

    if (!(await pastikanSiswaSejurusan(req, row.id_siswa))) {
      return res.status(403).json({ status: "error", message: "Catatan ini bukan milik siswa jurusan Anda." });
    }

    await row.destroy();

    return res.status(200).json({ status: "success", message: "Catatan berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menghapus catatan.", error: error.message });
  }
};

module.exports = {
  daftarSiswaJurusan,
  daftarCatatanSiswa,
  buatCatatanSiswa,
  hapusCatatanSiswa,
};
