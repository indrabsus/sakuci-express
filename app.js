const express = require("express");
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
// const protectedRoutes = require('./routes/protectedRoutes');
const ppdbRoutes = require('./routes/ppdbRoutes');

const client = require('./wabot');

const app = express();
app.use(express.json());


app.use('/api/auth', authRoutes);


// app.use('/api', protectedRoutes);

app.use('/ppdb', ppdbRoutes)

client.initialize();

// API Endpoint
app.get("/", (req, res) => {
    
    res.json({
        "status": "Server Ready!"
    });
});

app.post("/notifuser", async (req, res) => {
    const { nomor, pesan } = req.body;
    try {
        const formattedNumber = `${nomor}@c.us`; // Format nomor
        await client.sendMessage(formattedNumber, pesan);
        res.status(200).send({ success: true, message: "Message sent successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: "Failed to send message!" });
    }
})



// Kirim Pesan
app.post("/kirimpesan", async (req, res) => {
    const { nomor, pesan } = req.body;

    try {
        const formattedNumber = `${nomor}@c.us`; // Format nomor
        await client.sendMessage(formattedNumber, pesan);
        res.status(200).send({ success: true, message: "Message sent successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: "Failed to send message!" });
    }
});


// Menjalankan server untuk bot
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
