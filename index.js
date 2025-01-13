const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');

// Inisialisasi klien dengan autentikasi lokal
const client = new Client({
    authStrategy: new LocalAuth()
});

// Penyimpanan sesi dalam memori (gunakan database untuk produksi)
const sessions = {};

// Pertanyaan pendaftaran PPDB
const ppdbQuestions = [
    { key: 'nama_lengkap', question: 'Apa nama lengkap Anda?' },
    { key: 'tempat_lahir', question: 'Di mana tempat lahir Anda?' },
    { key: 'tanggal_lahir', question: 'Kapan tanggal lahir Anda? (Format: YYYY-MM-DD)' },
    { key: 'jenkel', question: 'Apa jenis kelamin Anda? (l/p)' },
    { key: 'agama', question: 'Apa agama Anda? (islam/nonis)' },
    { key: 'alamat', question: 'Apa alamat lengkap Anda?' },
    { key: 'nisn', question: 'Apa NISN Anda?' },
    { key: 'nik_siswa', question: 'Apa NIK siswa?' },
    { key: 'nohp', question: 'Apa nomor HP Anda? (Format: 08xxxxxxxxxx)' },
    { key: 'ayah', question: 'Apa nama ayah Anda?' },
    { key: 'ibu', question: 'Apa nama ibu Anda?' },
    { key: 'asal_sekolah', question: 'Apa asal sekolah Anda?' },
    { key: 'minat_jurusan1', question: 'Pilih minat jurusan pertama Anda (ketik angka):\n1. Perkantoran (MPLB)\n2. Manajemen Bisnis (BDP)\n3. Komputer Software (PPLG)\n4. Manajemen Keuangan (AKL)' },
    { key: 'minat_jurusan2', question: 'Pilih minat jurusan kedua Anda (ketik angka):\n1. Perkantoran (MPLB)\n2. Manajemen Bisnis (BDP)\n3. Komputer Software (PPLG)\n4. Manajemen Keuangan (AKL)' }
];

// Daftar jurusan
const jurusan = {
    '1': 'Perkantoran (MPLB)',
    '2': 'Manajemen Bisnis (BDP)',
    '3': 'Komputer Software (PPLG)',
    '4': 'Manajemen Keuangan (AKL)'
};

// Generate QR Code untuk autentikasi
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR Code di WhatsApp Anda');
});

// Setelah berhasil terhubung
client.on('ready', () => {
    console.log('Bot WhatsApp siap!');
});

// Menangani pesan masuk
client.on('message', async (message) => {
    const userId = message.from; // Identifikasi pengguna berdasarkan nomor
    const pesan = message.body.trim().toLowerCase();

    // Inisialisasi sesi untuk pengguna jika belum ada
    if (!sessions[userId]) {
        sessions[userId] = {
            step: null,
            data: {}
        };
    }

    // Ambil sesi pengguna
    const userSession = sessions[userId];

    if (!userSession.step) {
        // Tampilkan menu awal
        message.reply(`Selamat datang di SMK Sangkuriang 1 Cimahi!
Silakan pilih salah satu opsi berikut dengan mengetik angka:
1. Informasi Sekolah
2. Biaya Masuk
3. Daftar PPDB`);
        userSession.step = 'menu';
    } else if (userSession.step === 'menu') {
        if (pesan === '3') {
            // Mulai proses pendaftaran PPDB
            userSession.step = 'ppdb';
            userSession.currentQuestion = 0;
            message.reply(ppdbQuestions[0].question);
        } else if (pesan === '1' || pesan === '2') {
            // Informasi lain
            const responses = {
                '1': `📚 *Informasi Sekolah SMK Sangkuriang 1 Cimahi*:
- Alamat: Jl. Sangkuriang no.76 Cimahi
- Instagram: @sangkuriang1.official
- Website: www.smksangkuriang1cimahi.sch.id`,
                '2': `💰 *Biaya Masuk SMK Sangkuriang 1 Cimahi*:
- Biaya Pendaftaran: Rp 150.000
- Biaya Pendidikan: Rp 2.350.000 (Sudah termasuk SPP bulan Juli)
- Biaya SPP: Rp 170.000 per bulan`
            };
            message.reply(responses[pesan]);
            userSession.step = null; // Reset sesi
        } else {
            // Jika pesan tidak valid
            message.reply(`Opsi tidak valid. Silakan pilih salah satu opsi berikut:
1. Informasi Sekolah
2. Biaya Masuk
3. Daftar PPDB`);
        }
    } else if (userSession.step === 'ppdb') {
        // Proses pendaftaran PPDB
        const currentQuestionIndex = userSession.currentQuestion;
        const currentQuestion = ppdbQuestions[currentQuestionIndex];
        const key = currentQuestion.key;

        // Validasi jawaban untuk minat jurusan
        if ((key === 'minat_jurusan1' || key === 'minat_jurusan2') && !jurusan[pesan]) {
            message.reply('Jawaban tidak valid. Silakan pilih salah satu dari:\n1. Perkantoran\n2. Pemasaran\n3. RPL\n4. Akuntansi');
            return;
        }

        // Validasi untuk nomor HP
        if (key === 'nohp' && !/^08\d{8,11}$/.test(pesan)) {
            message.reply('Nomor HP tidak valid. Silakan masukkan nomor HP dengan format yang benar (08xxxxxxxxxx).');
            return;
        }

        // Simpan jawaban pengguna
        userSession.data[key] = (key === 'minat_jurusan1' || key === 'minat_jurusan2') ? jurusan[pesan] : pesan;

        if (currentQuestionIndex + 1 < ppdbQuestions.length) {
            // Lanjut ke pertanyaan berikutnya
            userSession.currentQuestion += 1;
            message.reply(ppdbQuestions[userSession.currentQuestion].question);
        } else {
            // Selesai, kirim data ke API
            message.reply('Terima kasih! Data Anda akan dikirimkan.');
            try {
                const response = await axios.post('http://api.sakuci.id/api/daftarppdb', userSession.data);
                if (response.status === 200) {
                    message.reply('Data berhasil dikirim ke server. Terima kasih telah mendaftar!');
                } else {
                    message.reply('Maaf, terjadi kesalahan saat mengirim data. Silakan coba lagi nanti.');
                }
            } catch (error) {
                console.error(error);
                message.reply('Maaf, terjadi kesalahan saat mengirim data. Silakan coba lagi nanti.');
            }
            userSession.step = null; // Reset sesi
            userSession.data = {}; // Hapus data pengguna
        }
    }
});

// Mulai klien
client.initialize();
