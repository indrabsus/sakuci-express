const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const ppdbRoutes = require("./routes/ppdbRoutes");
const siswaRoutes = require("./routes/siswaRoutes");
const kelasRoutes = require("./routes/kelasRoutes");
const jsMenuRoutes = require("./routes/jsMenuRoutes");
const sumatifRoutes = require("./routes/sumatifRoutes");
const sitepatRoutes = require("./routes/sitepatRoutes");
const agendaRoutes = require("./routes/agendaRoutes");
const roleRoutes = require("./routes/roleRoutes");
const masukanRoutes = require("./routes/masukanRoutes");
const settingRoutes = require("./routes/settingRoutes");
const dataRoutes = require("./routes/dataRoutes");
const sppRoutes = require("./routes/sppRoutes");
const rfidRoutes = require("./routes/rfidRoutes");
const presensiRoutes = require("./routes/presensiRoutes");
const zkRoutes = require("./routes/zkRoutes");
const tamuRoutes = require("./routes/tamuRoutes");
const riwayatKelasRoutes = require("./routes/riwayatKelasRoutes");
const backupRoutes = require("./routes/backupRoutes");

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
app.use("/sitepat", sitepatRoutes);
app.use("/ppdb", ppdbRoutes);
app.use("/siswa", siswaRoutes);
app.use("/kelas", kelasRoutes);
app.use("/sumatif", sumatifRoutes);
app.use("/agenda", agendaRoutes);
app.use("/masukan", masukanRoutes);
app.use("/menu", jsMenuRoutes);
app.use("/setting", settingRoutes);
app.use("/data", dataRoutes);
app.use("/spp", sppRoutes);
app.use("/rfid", rfidRoutes);
app.use("/presensi", presensiRoutes);
app.use("/zk", zkRoutes);
app.use("/tamu", tamuRoutes);
app.use("/riwayat-kelas", riwayatKelasRoutes);
app.use("/backup", backupRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "Server Ready...!",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});