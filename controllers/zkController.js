// zkController.js
const ZKLib = require('zklib-js');

const userZk = async (req, res) => {
  const zkInstance = new ZKLib(
  process.env.ZK_HOST_AGENDA,   // IP address mesin
  parseInt(process.env.ZK_PORT), // Port (integer)
  10000, // timeout
  4000   // interval
)

  try {
    // Koneksi ke mesin
    await zkInstance.createSocket()

    // Ambil daftar user
    const users = await zkInstance.getUsers()

    return res.json({
      success: true,
      message: 'Data berhasil diambil',
      users
    })
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data',
      error: e.message
    })
  }
}

const createUserZk = async (req, res) => {
  const { uid_fp, nama_singkat } = req.body
  const zkInstance = new ZKLib(
  process.env.ZK_HOST_AGENDA,   // IP address mesin
  parseInt(process.env.ZK_PORT), // Port (integer)
  10000, // timeout
  4000   // interval
)

  try {
    // Koneksi ke mesin
    await zkInstance.createSocket()

    // Ambil daftar user
    await zkInstance.setUser(
      parseInt(uid_fp),         // uid unik di mesin (pakai uid_fp kamu)
      String(uid_fp),       // userid (pakai id database)
      nama_singkat,             // nama
      "",                       // password kosong
      0,                        // role 0 = user biasa
      0                         // cardno = 0 kalau tidak pakai RFID
    );

    await zkInstance.disconnect();

    return res.json({
      success: true,
      message: 'Data berhasil diambil'
    })
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data',
      error: e.message
    })
  }
}

const getKehadiran = async (req, res) => {
  const zkInstance = new ZKLib(
  process.env.ZK_HOST_AGENDA,   // IP address mesin
  parseInt(process.env.ZK_PORT), // Port (integer)
  10000, // timeout
  4000   // interval
)

  try {
    // Koneksi ke mesin
    await zkInstance.createSocket()

// ambil data terakhir
const attendances = await zkInstance.getAttendances()

// pastikan ada data
if (attendances && attendances.data && attendances.data.length > 0) {
  const lastAttendance = attendances.data[attendances.data.length - 1]

  res.json({
    success: true,
    message: "Data berhasil diambil",
    attendance: lastAttendance
  })
} else {
  res.json({
    success: false,
    message: "Tidak ada data absensi"
  })
}
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data',
      error: e.message
    })
  }
}

module.exports = { userZk, getKehadiran, createUserZk }