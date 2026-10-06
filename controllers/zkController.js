// zkController.js
const ZKLib = require("zklib-js");
const axios = require("axios");
const { DataUser } = require("../models");

// IP mesin fingerprint absen staf/guru (2 mesin terpasang di sekolah).
// Bisa dioverride lewat env FP_MESIN_IPS (dipisah koma) jika IP berubah.
const IP_MESIN_FP = (process.env.FP_MESIN_IPS || "24.0.0.99,113.113.113.99")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

const ZK_PORT = parseInt(process.env.ZK_PORT, 10) || 4370;

function pesanErrorZk(err) {
  if (err && typeof err.toast === "function") return err.toast();
  if (err && err.err && err.err.message) return err.err.message;
  return err?.message || String(err);
}

function withTimeout(promise, ms, errorMsg) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMsg || `Koneksi timeout setelah ${ms / 1000} detik`));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const userZk = async (req, res) => {
  const zkInstance = new ZKLib(
    process.env.ZK_HOST_AGENDA, // IP address mesin
    parseInt(process.env.ZK_PORT, 10), // Port (integer)
    10000, // timeout
    4000 // interval
  );

  try {
    // Koneksi ke mesin
    await zkInstance.createSocket();

    // Ambil daftar user
    const users = await zkInstance.getUsers();

    return res.json({
      success: true,
      message: "Data berhasil diambil",
      users,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data",
      error: pesanErrorZk(e),
    });
  }
};

async function pushUserKeMesin(ip, uid_fp, nama_singkat) {
  const zk = new ZKLib(ip, ZK_PORT, 7000, 4000);
  try {
    const run = async () => {
      await zk.createSocket();

      // 1. Ambil daftar user yang ada di mesin untuk mengecek apakah UID sudah ada
      let existingUser = null;
      try {
        const userList = await zk.getUsers();
        const records = userList?.data || [];
        const targetUid = parseInt(uid_fp, 10);
        const targetUserId = String(uid_fp).trim();

        existingUser = records.find((u) => {
          const uUid = parseInt(u.uid, 10);
          const uUserId = String(u.userId || "").trim();
          return uUid === targetUid || uUserId === targetUserId;
        });
      } catch (errGetUsers) {
        throw new Error(`Gagal memeriksa daftar user di mesin (${pesanErrorZk(errGetUsers)})`);
      }

      // 2. Jika UID sudah ada di mesin -> notif sudah ada data
      if (existingUser) {
        return {
          ip,
          success: true,
          already_exists: true,
          existing_name: existingUser.name || "",
          message: `Sudah ada data di mesin ${ip} (UID ${uid_fp}${existingUser.name ? `: ${existingUser.name}` : ""})`,
        };
      }

      // 3. Jika belum ada data (klo g ada data berarti sukses insert)
      const result = await zk.setUser(
        parseInt(uid_fp, 10),
        String(uid_fp).slice(0, 9),
        String(nama_singkat || "").slice(0, 24),
        "",
        0,
        0
      );

      if (result === false) {
        throw new Error("Mesin menolak data user (parameter tidak valid atau melebihi batas).");
      }

      return {
        ip,
        success: true,
        already_exists: false,
        message: `Sukses ditambahkan ke mesin ${ip}`,
      };
    };

    const res = await withTimeout(run(), 10000, `Koneksi ke ${ip} timeout setelah 10 detik`);
    return res;
  } catch (err) {
    return {
      ip,
      success: false,
      already_exists: false,
      message: pesanErrorZk(err),
    };
  } finally {
    try {
      if (zk.zklibTcp?.socket) {
        zk.zklibTcp.socket.destroy();
      }
      await zk.disconnect();
    } catch (_) {}
  }
}

const createUserZk = async (req, res) => {
  let { uid_fp, nama_singkat, id_data, id_user, ip } = req.body;

  // Jika nama_singkat atau uid_fp tidak dikirim langsung, coba ambil dari DataUser
  if ((!uid_fp || !nama_singkat) && (id_data || id_user)) {
    try {
      const where = id_data ? { id_data } : { id_user };
      const user = await DataUser.findOne({ where });
      if (user) {
        if (!uid_fp && user.uid_fp) uid_fp = user.uid_fp;
        if (!nama_singkat) nama_singkat = user.nama_singkat || user.nama_lengkap?.split(" ")[0];
      }
    } catch (err) {
      console.error("Gagal mengambil data staf untuk push ZK:", err);
    }
  }

  if (!uid_fp) {
    return res.status(400).json({
      success: false,
      message: "UID Fingerprint (uid_fp) wajib diisi.",
    });
  }

  if (!nama_singkat) {
    return res.status(400).json({
      success: false,
      message: "Nama singkat (nama_singkat) wajib diisi.",
    });
  }

  try {
    const laravelBase = process.env.LARAVEL_URL || "https://sakuci.id";
    const laravelUrl = `${laravelBase}/insertuser/${uid_fp}/${uid_fp}/${encodeURIComponent(nama_singkat)}/0/0/0?json=1`;
    const response = await axios.get(laravelUrl, {
      headers: { Accept: "application/json" },
      timeout: 20000,
    });

    return res.status(response.status).json(response.data);
  } catch (e) {
    if (e.response && e.response.data) {
      return res.status(e.response.status).json(e.response.data);
    }
    return res.status(500).json({
      success: false,
      message: "Gagal mengirim data ke mesin fingerprint: " + (e.message || String(e)),
    });
  }
};

const getKehadiran = async (req, res) => {
  const zkInstance = new ZKLib(
    process.env.ZK_HOST_AGENDA, // IP address mesin
    parseInt(process.env.ZK_PORT, 10), // Port (integer)
    10000, // timeout
    4000 // interval
  );

  try {
    // Koneksi ke mesin
    await zkInstance.createSocket();

    // ambil data terakhir
    const attendances = await zkInstance.getAttendances();

    // pastikan ada data
    if (attendances && attendances.data && attendances.data.length > 0) {
      const lastAttendance = attendances.data[attendances.data.length - 1];

      res.json({
        success: true,
        message: "Data berhasil diambil",
        attendance: lastAttendance,
      });
    } else {
      res.json({
        success: false,
        message: "Tidak ada data absensi",
      });
    }
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data",
      error: pesanErrorZk(e),
    });
  }
};

module.exports = { userZk, getKehadiran, createUserZk };