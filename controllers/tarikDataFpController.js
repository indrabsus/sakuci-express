const ZKLib = require("zklib-js");
const { Op } = require("sequelize");
const { Absen, DataUser } = require("../models");

// IP mesin fingerprint absen staf/guru - hasil salinan dari controller PHP
// lama (sakuci.id/tarikdata). Bisa dioverride lewat env FP_MESIN_IPS
// (dipisah koma) tanpa perlu ubah kode.
const IP_MESIN_FP = (process.env.FP_MESIN_IPS || "24.0.0.99,113.113.113.99")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

const ZK_PORT = parseInt(process.env.ZK_PORT, 10) || 4370;

// zklib-js melempar instance ZKError (bukan Error biasa) yang tidak punya
// properti .message - ambil pesannya lewat toast()/getError() supaya log
// gagal koneksi tetap informatif.
function pesanErrorZk(err) {
  if (err && typeof err.toast === "function") return err.toast();
  if (err && err.err && err.err.message) return err.err.message;
  return err?.message || String(err);
}

// zklib-js cuma fallback TCP->UDP kalau koneksi TCP-nya di-refused
// (ECONNREFUSED) - kalau cuma timeout (ETIMEDOUT, sering terjadi kalau
// network/firewall diam-diam buang paket TCP-nya), library ini menyerah
// tanpa pernah coba UDP sama sekali. Banyak mesin fingerprint (terutama
// yang murah/clone) jalan di UDP, jadi di sini kita paksa coba UDP manual
// kalau createSocket() bawaannya gagal.
async function connectZk(ip) {
  const zk = new ZKLib(ip, ZK_PORT, 10000, 4000);

  try {
    await zk.createSocket();
    return zk;
  } catch (errTcp) {
    try {
      await zk.zklibUdp.createSocket();
      await zk.zklibUdp.connect();
      zk.connectionType = "udp";
      return zk;
    } catch (errUdp) {
      throw errTcp;
    }
  }
}

// CATATAN: library zklib-js yang dipakai di sini cuma expose deviceUserId +
// recordTime per catatan absen (tidak ada field "type"/state check-in vs
// check-out seperti punya library PHP ZKTeco) - jadi semua catatan untuk
// sementara disimpan sebagai status "0" (masuk), belum bisa membedakan
// pulang seperti versi PHP (status 0/4).
async function tarikDariMesinFp(ip) {
  const zk = await connectZk(ip);
  let total = 0;

  try {
    const attendance = await zk.getAttendances();
    const records = attendance?.data || [];

    for (const d of records) {
      const waktu = new Date(d.recordTime);
      if (isNaN(waktu)) continue;

      // skip Sabtu & Minggu
      const day = waktu.getDay();
      if (day === 0 || day === 6) continue;

      const dataUser = await DataUser.findOne({ where: { uid_fp: String(d.deviceUserId) } });
      if (!dataUser) continue;

      const status = "0";

      const startDay = new Date(waktu);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(waktu);
      endDay.setHours(23, 59, 59, 999);

      const sudahAda = await Absen.findOne({
        where: {
          id_user: dataUser.id_user,
          status,
          waktu: { [Op.between]: [startDay, endDay] },
        },
      });

      if (!sudahAda) {
        await Absen.create({ id_user: dataUser.id_user, status, waktu });
        total += 1;
      }
    }

    await zk.clearAttendanceLog();
  } finally {
    try {
      await zk.disconnect();
    } catch (err) {
      // abaikan - mesin kadang sudah putus duluan
    }
  }

  return { total };
}

async function jalankanTarikDataFp() {
  if (IP_MESIN_FP.length === 0) {
    return { success: false, message: "Belum ada IP mesin fingerprint yang dikonfigurasi.", detail: [] };
  }

  const detail = [];

  for (const ip of IP_MESIN_FP) {
    try {
      const hasil = await tarikDariMesinFp(ip);
      detail.push({ ip, success: true, total: hasil.total });
    } catch (err) {
      detail.push({ ip, success: false, message: pesanErrorZk(err) });
    }
  }

  const totalSukses = detail.filter((d) => d.success).length;
  const totalGagal = detail.length - totalSukses;
  const totalData = detail.reduce((sum, d) => sum + (d.total || 0), 0);

  return {
    success: totalGagal === 0,
    message: `Tarik data fingerprint selesai: ${totalSukses} mesin sukses, ${totalGagal} gagal, ${totalData} data diproses.`,
    detail,
  };
}

// Setara controller PHP tarikSemua() (sakuci.id/tarikdata) - absensi staf/guru
// dari mesin fingerprint ZKTeco. Sengaja tidak diproteksi JWT (dipanggil
// cron/scheduler tanpa token).
const tarikDataFp = async (req, res) => {
  try {
    const hasil = await jalankanTarikDataFp();
    return res.json(hasil);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Gagal menarik data fingerprint.", error: error.message });
  }
};

module.exports = { tarikDataFp, jalankanTarikDataFp };
