const express = require("express");
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const ppdbRoutes = require('./routes/ppdbRoutes');
const siswaRoutes = require('./routes/siswaRoutes');
const kelasRoutes = require('./routes/kelasRoutes');
const sumatifRoutes = require('./routes/sumatifRoutes');
const agendaRoutes = require('./routes/agendaRoutes');
const cors = require('cors');

const app = express();
app.use(express.json());


app.use(cors());
app.use('/api/auth', authRoutes);

app.use('/ppdb', ppdbRoutes);
app.use('/siswa', siswaRoutes);
app.use('/kelas', kelasRoutes);
app.use('/sumatif', sumatifRoutes);
app.use('/agenda', agendaRoutes);


// API Endpoint
app.get("/", (req, res) => {
    
    res.json({
        "status": "Server Ready Bro CEK!"
    });
});



// Menjalankan server untuk bot
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
