const crypto = require("crypto");
const { Sertifikat, SiswaPpdb, InformasiSekolah } = require("../models");
const { jabatanKajur } = require("../utils/jurusan");
const { getKajurDataUser, getKajurJurusan } = require("../utils/kajurContext");
const { getSiswaJurusanAktif } = require("../utils/siswaJurusan");
const catatLogAktivitas = require("../utils/catatLogAktivitas");

const daftarSiswaJurusan = async (req, res) => {
  try {
    const kodeJurusan = await getKajurJurusan(req);
    const data = await getSiswaJurusanAktif(kodeJurusan);

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

const daftarSertifikat = async (req, res) => {
  try {
    const kodeJurusan = await getKajurJurusan(req);

    const rows = await Sertifikat.findAll({
      where: { jurusan: kodeJurusan },
      include: [{ model: SiswaPpdb, as: "siswa", attributes: ["nama_lengkap"] }],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      message: "Daftar sertifikat berhasil diambil.",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar sertifikat.",
      error: error.message,
    });
  }
};

const buatSertifikatManual = async (req, res) => {
  try {
    const kajurDataUser = await getKajurDataUser(req);
    const kodeJurusan = kajurDataUser?.jurusan || null;

    if (!kodeJurusan) {
      return res.status(400).json({
        status: "error",
        message: "Akun kajur ini belum diatur jurusannya.",
      });
    }

    const idSiswaList = Array.isArray(req.body?.id_siswa_list) ? req.body.id_siswa_list : [];
    const judulManual = String(req.body?.judul_manual || "").trim();
    const nilaiRaw = req.body?.nilai;
    const nilai = nilaiRaw === "" || nilaiRaw === null || nilaiRaw === undefined ? null : Number(nilaiRaw);
    const sertakanKepsek = !!req.body?.sertakan_kepsek;

    if (idSiswaList.length === 0 || !judulManual) {
      return res.status(400).json({
        status: "error",
        message: "Minimal satu siswa dan judul kompetensi wajib diisi.",
      });
    }

    if (nilai !== null && (!Number.isFinite(nilai) || nilai < 0 || nilai > 100)) {
      return res.status(400).json({
        status: "error",
        message: "Nilai harus berupa angka 0-100, atau kosongkan jika tidak perlu.",
      });
    }

    const siswaJurusan = await getSiswaJurusanAktif(kodeJurusan);
    const idSiswaValidSet = new Set(siswaJurusan.map((s) => s.id_siswa));
    const idSiswaValid = idSiswaList.filter((id) => idSiswaValidSet.has(id));

    if (idSiswaValid.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Tidak ada siswa terpilih yang merupakan siswa aktif di jurusan Anda.",
      });
    }

    let namaKepsek = null;
    let nipKepsek = null;

    if (sertakanKepsek) {
      const sekolah = await InformasiSekolah.findOne({ order: [["created_at", "ASC"]] });
      namaKepsek = sekolah?.nama_kepala_sekolah || null;
      nipKepsek = sekolah?.nip_kepala_sekolah || null;

      if (!namaKepsek) {
        return res.status(400).json({
          status: "error",
          message: "Nama Kepala Sekolah belum diatur di menu Informasi Sekolah (Admin).",
        });
      }
    }

    const namaKajur = kajurDataUser?.nama_lengkap || req.user.username;
    const tahun = new Date().getFullYear();

    const payload = idSiswaValid.map((idSiswa) => ({
      nomor_sertifikat: `CERT-${tahun}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      id_siswa: idSiswa,
      judul_manual: judulManual,
      jurusan: kodeJurusan,
      nilai,
      kode_verifikasi: crypto.randomBytes(6).toString("hex").toUpperCase(),
      diterbitkan_oleh: req.user.userId,
      nama_kajur: namaKajur,
      status: "aktif",
      nama_kepsek: namaKepsek,
      nip_kepsek: nipKepsek,
    }));

    const created = await Sertifikat.bulkCreate(payload);

    catatLogAktivitas(req, {
      modul: "sertifikat",
      aksi: "create",
      keterangan: `Menerbitkan ${created.length} sertifikat manual "${judulManual}" untuk jurusan ${kodeJurusan}`,
      data_sebelum: null,
      data_sesudah: { judul_manual: judulManual, jumlah: created.length },
    });

    const skipped = idSiswaList.length - idSiswaValid.length;

    return res.status(201).json({
      status: "success",
      message: `Sertifikat manual berhasil diterbitkan untuk ${idSiswaValid.length} siswa.${
        skipped > 0 ? ` (${skipped} siswa dilewati karena bukan siswa aktif di jurusan Anda)` : ""
      }`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menerbitkan sertifikat manual.",
      error: error.message,
    });
  }
};

async function ambilSertifikatMilikKajur(req, idSertifikat) {
  const kodeJurusan = await getKajurJurusan(req);
  const row = await Sertifikat.findByPk(idSertifikat);
  if (!row || row.jurusan !== kodeJurusan) return null;
  return row;
}

const cabutSertifikat = async (req, res) => {
  try {
    const row = await ambilSertifikatMilikKajur(req, req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Sertifikat tidak ditemukan." });
    }

    await row.update({ status: "dicabut" });

    return res.status(200).json({ status: "success", message: "Sertifikat berhasil dicabut." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mencabut sertifikat.", error: error.message });
  }
};

const aktifkanSertifikat = async (req, res) => {
  try {
    const row = await ambilSertifikatMilikKajur(req, req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Sertifikat tidak ditemukan." });
    }

    await row.update({ status: "aktif" });

    return res.status(200).json({ status: "success", message: "Sertifikat berhasil diaktifkan kembali." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengaktifkan sertifikat.", error: error.message });
  }
};

const hapusSertifikat = async (req, res) => {
  try {
    const row = await ambilSertifikatMilikKajur(req, req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Sertifikat tidak ditemukan." });
    }

    await row.destroy();

    return res.status(200).json({ status: "success", message: "Sertifikat berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menghapus sertifikat.", error: error.message });
  }
};

const detailCetakSertifikat = async (req, res) => {
  try {
    const row = await ambilSertifikatMilikKajur(req, req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Sertifikat tidak ditemukan." });
    }

    const siswa = await SiswaPpdb.findByPk(row.id_siswa, { attributes: ["nama_lengkap"] });

    return res.status(200).json({
      status: "success",
      message: "Detail sertifikat berhasil diambil.",
      data: {
        ...row.toJSON(),
        nama_siswa: siswa?.nama_lengkap || "-",
        jabatan_kajur: jabatanKajur(row.jurusan),
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil detail sertifikat.", error: error.message });
  }
};

// Sertifikat milik siswa yang login sendiri.
const sertifikatSiswa = async (req, res) => {
  try {
    const data = await Sertifikat.findAll({
      where: { id_siswa: req.user.userId },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ status: "success", message: "Sertifikat berhasil diambil.", data });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil sertifikat.", error: error.message });
  }
};

module.exports = {
  daftarSiswaJurusan,
  daftarSertifikat,
  buatSertifikatManual,
  cabutSertifikat,
  aktifkanSertifikat,
  hapusSertifikat,
  detailCetakSertifikat,
  sertifikatSiswa,
};
