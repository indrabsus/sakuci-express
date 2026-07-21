const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const path = require("path");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

require("dotenv").config();

const { runScheduledBackup } = require("./controllers/backupController");
const waService = require("./whatsapp/waService");

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
const backupRoutes = require("./routes/backupRoutes");
const waRoutes = require("./routes/waRoutes");

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
app.use("/backup", backupRoutes);
app.use("/wa", waRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "Server Ready...!",
  });
});

// Backup database otomatis tiap hari jam 01:00 (Asia/Jakarta), simpan 3 backup terakhir
cron.schedule("0 1 * * *", runScheduledBackup, { timezone: "Asia/Jakarta" });

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

const waNamespace = io.of("/wa");

waNamespace.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Access Denied. No Token Provided."));
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    next(new Error("Invalid Token."));
  }
});

waService.attachIO(io);

server.on("error", (err) => {
  console.error(`Gagal listen di port ${PORT}:`, err.message);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});