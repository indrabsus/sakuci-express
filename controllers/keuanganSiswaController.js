const { KeuanganKategori, KeuanganPembayaran, SiswaPpdb } = require("../models");
const { getKajurDataUser, getKajurJurusan } = require("../utils/kajurContext");
const { getSiswaJurusanAktif } = require("../utils/siswaJurusan");
const catatLogAktivitas = require("../utils/catatLogAktivitas");

async function ambilKategoriMilikKajur(req, idKategori) {
  const kodeJurusan = await getKajurJurusan(req);
  const row = await KeuanganKategori.findByPk(idKategori);
  if (!row || row.jurusan !== kodeJurusan) return null;
  return row;
}

// target_tingkat disimpan sebagai CSV, mis. "10,11" - kategori hanya berlaku
// untuk siswa di tingkat tersebut (mis. baju jurusan cuma untuk kelas 10 baru).
function siswaSesuaiTingkat(siswaList, targetTingkat) {
  const tingkatSet = new Set(String(targetTingkat || "").split(",").map((t) => t.trim()).filter(Boolean));
  if (tingkatSet.size === 0) return siswaList;
  return siswaList.filter((s) => tingkatSet.has(String(s.tingkat)));
}

function parseTargetTingkat(input) {
  const list = Array.isArray(input) ? input : [];
  const valid = list.map((t) => String(t).trim()).filter((t) => ["10", "11", "12"].includes(t));
  return Array.from(new Set(valid));
}

const daftarKategori = async (req, res) => {
  try {
    const kodeJurusan = await getKajurJurusan(req);

    const kategoriList = await KeuanganKategori.findAll({
      where: { jurusan: kodeJurusan },
      order: [["created_at", "DESC"]],
    });

    const siswaJurusan = await getSiswaJurusanAktif(kodeJurusan);

    const idKategoriList = kategoriList.map((k) => k.id_kategori);
    const pembayaranList = idKategoriList.length
      ? await KeuanganPembayaran.findAll({ where: { id_kategori: idKategoriList } })
      : [];

    const data = kategoriList.map((k) => {
      const siswaTerkena = siswaSesuaiTingkat(siswaJurusan, k.target_tingkat);
      const idSiswaSet = new Set(siswaTerkena.map((s) => s.id_siswa));
      const jumlahSiswa = siswaTerkena.length;

      const pembayaranKategori = pembayaranList.filter(
        (p) => p.id_kategori === k.id_kategori && idSiswaSet.has(p.id_siswa)
      );

      const totalTerkumpul = pembayaranKategori.reduce((sum, p) => sum + Number(p.nominal), 0);

      const totalPerSiswa = new Map();
      pembayaranKategori.forEach((p) => {
        totalPerSiswa.set(p.id_siswa, (totalPerSiswa.get(p.id_siswa) || 0) + Number(p.nominal));
      });

      const jumlahLunas = Array.from(totalPerSiswa.values()).filter(
        (total) => total >= Number(k.target_nominal)
      ).length;

      return {
        ...k.toJSON(),
        jumlah_siswa: jumlahSiswa,
        jumlah_lunas: jumlahLunas,
        total_terkumpul: totalTerkumpul,
        target_keseluruhan: Number(k.target_nominal) * jumlahSiswa,
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Daftar kategori keuangan berhasil diambil.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar kategori keuangan.",
      error: error.message,
    });
  }
};

const buatKategori = async (req, res) => {
  try {
    const kodeJurusan = await getKajurJurusan(req);

    if (!kodeJurusan) {
      return res.status(400).json({ status: "error", message: "Akun kajur ini belum diatur jurusannya." });
    }

    const namaKategori = String(req.body?.nama_kategori || "").trim();
    const deskripsi = String(req.body?.deskripsi || "").trim() || null;
    const targetNominal = Number(req.body?.target_nominal);
    const targetTingkat = parseTargetTingkat(req.body?.target_tingkat);
    const tenggat = String(req.body?.tenggat || "").trim() || null;

    if (!namaKategori || !Number.isFinite(targetNominal) || targetNominal <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Nama kategori dan target nominal (lebih dari 0) wajib diisi.",
      });
    }

    if (targetTingkat.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Pilih minimal satu tingkat (10/11/12) yang dituju kategori ini.",
      });
    }

    const row = await KeuanganKategori.create({
      jurusan: kodeJurusan,
      nama_kategori: namaKategori,
      deskripsi,
      target_nominal: targetNominal,
      target_tingkat: targetTingkat.join(","),
      tenggat,
      dibuat_oleh: req.user.userId,
    });

    catatLogAktivitas(req, {
      modul: "keuangan_siswa",
      aksi: "create",
      keterangan: `Membuat kategori keuangan "${namaKategori}" untuk jurusan ${kodeJurusan}`,
      data_sebelum: null,
      data_sesudah: row.toJSON(),
    });

    return res.status(201).json({
      status: "success",
      message: "Kategori keuangan berhasil dibuat.",
      data: row,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal membuat kategori keuangan.", error: error.message });
  }
};

const updateKategori = async (req, res) => {
  try {
    const row = await ambilKategoriMilikKajur(req, req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Kategori tidak ditemukan." });
    }

    const namaKategori = String(req.body?.nama_kategori || "").trim();
    const deskripsi = String(req.body?.deskripsi || "").trim() || null;
    const targetNominal = Number(req.body?.target_nominal);
    const targetTingkat = parseTargetTingkat(req.body?.target_tingkat);
    const tenggat = String(req.body?.tenggat || "").trim() || null;
    const status = String(req.body?.status || row.status);

    if (!namaKategori || !Number.isFinite(targetNominal) || targetNominal <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Nama kategori dan target nominal (lebih dari 0) wajib diisi.",
      });
    }

    if (targetTingkat.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Pilih minimal satu tingkat (10/11/12) yang dituju kategori ini.",
      });
    }

    if (!["aktif", "selesai", "dibatalkan"].includes(status)) {
      return res.status(400).json({ status: "error", message: "Status tidak valid." });
    }

    const dataSebelum = row.toJSON();
    await row.update({
      nama_kategori: namaKategori,
      deskripsi,
      target_nominal: targetNominal,
      target_tingkat: targetTingkat.join(","),
      tenggat,
      status,
    });

    catatLogAktivitas(req, {
      modul: "keuangan_siswa",
      aksi: "update",
      keterangan: `Mengubah kategori keuangan "${dataSebelum.nama_kategori}"`,
      data_sebelum: dataSebelum,
      data_sesudah: row.toJSON(),
    });

    return res.status(200).json({ status: "success", message: "Kategori keuangan berhasil diubah.", data: row });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengubah kategori keuangan.", error: error.message });
  }
};

const hapusKategori = async (req, res) => {
  try {
    const row = await ambilKategoriMilikKajur(req, req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Kategori tidak ditemukan." });
    }

    const jumlahPembayaran = await KeuanganPembayaran.count({ where: { id_kategori: row.id_kategori } });

    if (jumlahPembayaran > 0) {
      return res.status(400).json({
        status: "error",
        message: `Tidak bisa dihapus, sudah ada ${jumlahPembayaran} catatan pembayaran. Ubah status ke "dibatalkan" jika ingin menghentikan kategori ini.`,
      });
    }

    const namaSebelum = row.nama_kategori;
    await row.destroy();

    catatLogAktivitas(req, {
      modul: "keuangan_siswa",
      aksi: "delete",
      keterangan: `Menghapus kategori keuangan "${namaSebelum}"`,
      data_sebelum: { id_kategori: req.params.id, nama_kategori: namaSebelum },
      data_sesudah: null,
    });

    return res.status(200).json({ status: "success", message: "Kategori keuangan berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menghapus kategori keuangan.", error: error.message });
  }
};

const detailKategoriSiswa = async (req, res) => {
  try {
    const kategori = await ambilKategoriMilikKajur(req, req.params.id);

    if (!kategori) {
      return res.status(404).json({ status: "error", message: "Kategori tidak ditemukan." });
    }

    const kodeJurusan = await getKajurJurusan(req);
    const siswaJurusan = await getSiswaJurusanAktif(kodeJurusan);
    const siswaList = siswaSesuaiTingkat(siswaJurusan, kategori.target_tingkat);

    const pembayaranList = await KeuanganPembayaran.findAll({
      where: { id_kategori: kategori.id_kategori },
    });

    const totalPerSiswa = new Map();
    pembayaranList.forEach((p) => {
      totalPerSiswa.set(p.id_siswa, (totalPerSiswa.get(p.id_siswa) || 0) + Number(p.nominal));
    });

    const target = Number(kategori.target_nominal);

    const data = siswaList.map((s) => {
      const totalDibayar = totalPerSiswa.get(s.id_siswa) || 0;
      const status = totalDibayar >= target ? "lunas" : totalDibayar > 0 ? "sebagian" : "belum";

      return {
        ...s,
        total_dibayar: totalDibayar,
        sisa: Math.max(target - totalDibayar, 0),
        status,
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Detail kategori berhasil diambil.",
      data: { kategori, siswa: data },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil detail kategori.", error: error.message });
  }
};

const catatPembayaran = async (req, res) => {
  try {
    const idKategori = String(req.body?.id_kategori || "");
    const idSiswa = String(req.body?.id_siswa || "");
    const nominal = Number(req.body?.nominal);
    const tanggalBayar = String(req.body?.tanggal_bayar || "").trim();
    const keterangan = String(req.body?.keterangan || "").trim() || null;

    if (!idKategori || !idSiswa || !Number.isFinite(nominal) || nominal <= 0 || !tanggalBayar) {
      return res.status(400).json({
        status: "error",
        message: "Kategori, siswa, nominal (lebih dari 0), dan tanggal bayar wajib diisi.",
      });
    }

    const kategori = await ambilKategoriMilikKajur(req, idKategori);
    if (!kategori) {
      return res.status(404).json({ status: "error", message: "Kategori tidak ditemukan." });
    }

    const kodeJurusan = await getKajurJurusan(req);
    const siswaJurusan = await getSiswaJurusanAktif(kodeJurusan);
    const siswaTerkena = siswaSesuaiTingkat(siswaJurusan, kategori.target_tingkat);
    const siswa = siswaTerkena.find((s) => s.id_siswa === idSiswa);

    if (!siswa) {
      return res.status(400).json({
        status: "error",
        message: "Siswa ini bukan siswa jurusan Anda, atau tingkatnya tidak termasuk target kategori ini.",
      });
    }

    const kajurDataUser = await getKajurDataUser(req);

    const row = await KeuanganPembayaran.create({
      id_kategori: idKategori,
      id_siswa: idSiswa,
      nominal,
      tanggal_bayar: tanggalBayar,
      keterangan,
      dicatat_oleh: req.user.userId,
      nama_pencatat: kajurDataUser?.nama_lengkap || req.user.username,
    });

    catatLogAktivitas(req, {
      modul: "keuangan_siswa",
      aksi: "create",
      keterangan: `Mencatat pembayaran Rp${nominal.toLocaleString("id-ID")} dari ${siswa.nama_lengkap} untuk "${kategori.nama_kategori}"`,
      data_sebelum: null,
      data_sesudah: row.toJSON(),
    });

    return res.status(201).json({ status: "success", message: "Pembayaran berhasil dicatat.", data: row });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mencatat pembayaran.", error: error.message });
  }
};

const daftarPembayaranSiswa = async (req, res) => {
  try {
    const { id_kategori, id_siswa } = req.params;

    const kategori = await ambilKategoriMilikKajur(req, id_kategori);
    if (!kategori) {
      return res.status(404).json({ status: "error", message: "Kategori tidak ditemukan." });
    }

    const rows = await KeuanganPembayaran.findAll({
      where: { id_kategori, id_siswa },
      order: [["tanggal_bayar", "DESC"], ["created_at", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      message: "Riwayat pembayaran berhasil diambil.",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil riwayat pembayaran.", error: error.message });
  }
};

const hapusPembayaran = async (req, res) => {
  try {
    const row = await KeuanganPembayaran.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Pembayaran tidak ditemukan." });
    }

    const kategori = await ambilKategoriMilikKajur(req, row.id_kategori);
    if (!kategori) {
      return res.status(403).json({ status: "error", message: "Pembayaran ini bukan milik jurusan Anda." });
    }

    await row.destroy();

    return res.status(200).json({ status: "success", message: "Catatan pembayaran berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menghapus catatan pembayaran.", error: error.message });
  }
};

module.exports = {
  daftarKategori,
  buatKategori,
  updateKategori,
  hapusKategori,
  detailKategoriSiswa,
  catatPembayaran,
  daftarPembayaranSiswa,
  hapusPembayaran,
};
