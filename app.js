const express = require("express");
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const ppdbRoutes = require('./routes/ppdbRoutes');
const siswaRoutes = require('./routes/siswaRoutes');
const kelasRoutes = require('./routes/kelasRoutes');
const jsMenuRoutes = require('./routes/jsMenuRoutes');
const sumatifRoutes = require('./routes/sumatifRoutes');
const sitepatRoutes = require('./routes/sitepatRoutes');
const agendaRoutes = require('./routes/agendaRoutes');
const roleRoutes = require('./routes/roleRoutes');
const masukanRoutes = require('./routes/masukanRoutes');
const settingRoutes = require('./routes/settingRoutes');
const dataRoutes = require('./routes/dataRoutes');
const sppRoutes = require('./routes/sppRoutes');
const cors = require('cors');
const path = require("path");

const app = express();
app.use(express.json());


app.use(cors());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/api/auth', authRoutes);
app.use('/role', roleRoutes);
app.use('/sitepat', sitepatRoutes);
app.use('/ppdb', ppdbRoutes);
app.use('/siswa', siswaRoutes);
app.use('/kelas', kelasRoutes);
app.use('/sumatif', sumatifRoutes);
app.use('/agenda', agendaRoutes);
app.use('/masukan', masukanRoutes);
app.use('/menu', jsMenuRoutes);
app.use('/setting', settingRoutes);
app.use('/data', dataRoutes);
app.use('/spp', sppRoutes);


// API Endpoint
app.get("/", (req, res) => {
    
    res.json({
        "status": "Server Ready...!"
    });
});



// Menjalankan server untuk bot
app.listen(`${process.env.PORT}`, () => {
    console.log('Server running');
});
