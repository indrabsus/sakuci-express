const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const path = require("path");
const http = require("http");

require("dotenv").config();

const { runScheduledBackup } = require("./controllers/backupController");
const { runTarikDataScheduled } = require("./jobs/tarikDataCron");

const authRoutes = require("./routes/authRoutes");
const ppdbRoutes = require("./routes/ppdbRoutes");
const siswaRoutes = require("./routes/siswaRoutes");
const kelasRoutes = require("./routes/kelasRoutes");
const agendaRoutes = require("./routes/agendaRoutes");
const roleRoutes = require("./routes/roleRoutes");
const settingRoutes = require("./routes/settingRoutes");
const dataRoutes = require("./routes/dataRoutes");
const sppRoutes = require("./routes/sppRoutes");
const rfidRoutes = require("./routes/rfidRoutes");
const presensiRoutes = require("./routes/presensiRoutes");
const zkRoutes = require("./routes/zkRoutes");
const riwayatKelasRoutes = require("./routes/riwayatKelasRoutes");
const tahunAjaranRoutes = require("./routes/tahunAjaranRoutes");
const mapelRoutes = require("./routes/mapelRoutes");
const informasiSekolahRoutes = require("./routes/informasiSekolahRoutes");
const publicRoutes = require("./routes/publicRoutes");
const sertifikatRoutes = require("./routes/sertifikatRoutes");
const projectSiswaRoutes = require("./routes/projectSiswaRoutes");
const catatanSiswaRoutes = require("./routes/catatanSiswaRoutes");
const keuanganSiswaRoutes = require("./routes/keuanganSiswaRoutes");
const mengajarRoutes = require("./routes/mengajarRoutes");
const materiAjarRoutes = require("./routes/materiAjarRoutes");
const bankSoalRoutes = require("./routes/bankSoalRoutes");
const tugasRoutes = require("./routes/tugasRoutes");
const absenKelasRoutes = require("./routes/absenKelasRoutes");
const profileRoutes = require("./routes/profileRoutes");
const backupRoutes = require("./routes/backupRoutes");
const tarikDataLogRoutes = require("./routes/tarikDataLogRoutes");
const logAktivitasRoutes = require("./routes/logAktivitasRoutes");

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception (server tetap jalan):", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection (server tetap jalan):", reason);
});

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options(
  "*",
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/role", roleRoutes);
app.use("/ppdb", ppdbRoutes);
app.use("/siswa", siswaRoutes);
app.use("/kelas", kelasRoutes);
app.use("/agenda", agendaRoutes);
app.use("/setting", settingRoutes);
app.use("/data", dataRoutes);
app.use("/spp", sppRoutes);
app.use("/rfid", rfidRoutes);
app.use("/presensi", presensiRoutes);
app.use("/zk", zkRoutes);
app.use("/riwayat-kelas", riwayatKelasRoutes);
app.use("/tahun-ajaran", tahunAjaranRoutes);
app.use("/mapel", mapelRoutes);
app.use("/informasi-sekolah", informasiSekolahRoutes);
app.use("/public", publicRoutes);
app.use("/sertifikat", sertifikatRoutes);
app.use("/project-siswa", projectSiswaRoutes);
app.use("/catatan-siswa", catatanSiswaRoutes);
app.use("/keuangan-siswa", keuanganSiswaRoutes);
app.use("/mengajar", mengajarRoutes);
app.use("/materi-ajar", materiAjarRoutes);
app.use("/bank-soal", bankSoalRoutes);
app.use("/tugas", tugasRoutes);
app.use("/absen-kelas", absenKelasRoutes);
app.use("/profile", profileRoutes);
app.use("/backup", backupRoutes);
app.use("/tarik-data-log", tarikDataLogRoutes);
app.use("/log-aktivitas", logAktivitasRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "Server Ready...!",
  });
});

// Backup database otomatis tiap hari jam 01:00 (Asia/Jakarta), simpan 3 backup terakhir
cron.schedule("0 1 * * *", runScheduledBackup, { timezone: "Asia/Jakarta" });

// Tarik data absen dari mesin fingerprint otomatis tiap hari jam 07:00 dan 16:00 (Asia/Jakarta)
cron.schedule("0 7 * * *", runTarikDataScheduled, { timezone: "Asia/Jakarta" });
cron.schedule("0 16 * * *", runTarikDataScheduled, { timezone: "Asia/Jakarta" });

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.on("error", (err) => {
  console.error(`Gagal listen di port ${PORT}:`, err.message);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});