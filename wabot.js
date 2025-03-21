const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require('fs');
const qrcode = require("qrcode");
const {axios, axiosInstance} = require('./config/axios');

const formatNoHp = (no_hp) => {
  // Hapus semua karakter yang tidak diperlukan (spasi, tanda minus, tanda plus)
  let formatted = no_hp.replace(/[^0-9]/g, '');

  // Jika nomor telepon diawali dengan '0', ganti dengan '62'
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.slice(1);
  } 
  // Jika nomor telepon diawali dengan '+62', hapus tanda '+'
  else if (formatted.startsWith('62') && formatted.charAt(0) === '0') {
    formatted = '62' + formatted.slice(1);
  }

  return formatted;
};

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
    console.log("QR Code received, scan using your phone.");
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error(err);
            return;
        }
        fs.writeFileSync('qrcode.png', url.split(',')[1], 'base64');
        console.log("QR Code saved as 'qrcode.png'.");
    });
});

client.on("ready", () => {
    console.log("WhatsApp Siap!");
});

const sessions = {};

function isValidDate(year, month, day) {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === parseInt(year) &&
           date.getMonth() === month - 1 &&
           date.getDate() === parseInt(day);
}

function isValidYear(year) {
    const currentYear = new Date().getFullYear();
    return /^\d{4}$/.test(year) && year > 1900 && year <= currentYear;
}

function isValidMonth(month) {
    return /^\d+$/.test(month) && month >= 1 && month <= 12;
}

function isValidGender(gender) {
    return gender.toLowerCase() === 'l' || gender.toLowerCase() === 'p';
}

function isValidAgama(input) {
    return /^[1-6]$/.test(input);
}

function isValidNoHp(number) {
    return /^08\d{9,12}$/.test(number);
}

function isValidJurusan(input) {
    return /^[1-4]$/.test(input);
}

// Pertanyaan pendaftaran PPDB
const ppdbQuestions = [
    { key: 'nama_lengkap', question: 'Apa nama lengkap Anda?' },
    { key: 'tempat_lahir', question: 'Di mana tempat lahir Anda?' },
    { key: 'tahun_lahir', question: 'Tahun berapa Anda lahir? tulis tahun full, contoh: 2005' },
    { key: 'bulan_lahir', question: 'Bulan berapa Anda lahir? (1-12)' },
    { key: 'tanggal_lahir', question: 'Tanggal berapa Anda lahir? (1-31)' },
    { key: 'jenkel', question: 'Apa jenis kelamin Anda? (l/p)' },
    { key: 'agama', question: 'Apa agama Anda? (Ketik angka):\n1. Islam\n2. Kristen\n3. Katolik\n4. Hindu\n5. Buddha\n6. Konghucu' },
    { key: 'jalan', question: 'Apa nama jalan tempat tinggal Anda?' },
    { key: 'rt_rw', question: 'Apa RT/RW tempat tinggal Anda? (contoh: 04/07)' },
    { key: 'kelurahan', question: 'Apa nama kelurahan tempat tinggal Anda?' },
    { key: 'kecamatan', question: 'Apa nama kecamatan tempat tinggal Anda?' },
    { key: 'kab_kota', question: 'Apa nama kabupaten/kota tempat tinggal Anda?' },
    { key: 'nisn', question: 'Apa NISN Anda?' },
    { key: 'nik_siswa', question: 'Apa NIK siswa Anda?' },
    { key: 'no_hp', question: 'Apa nomor HP Anda? (Format: 08xxxxxxxxxx)' },
    { key: 'nama_ayah', question: 'Apa nama ayah Anda?' },
    { key: 'nama_ibu', question: 'Apa nama ibu Anda?' },
    { key: 'asal_sekolah', question: 'Apa asal sekolah Anda?' },
    { key: 'minat_jurusan1', question: 'Pilih minat jurusan pertama Anda (ketik angka):\n1. Perkantoran (MPLB)\n2. Manajemen Bisnis (BDP)\n3. Komputer Software (PPLG)\n4. Manajemen Keuangan (AKL)' },
    { key: 'minat_jurusan2', question: 'Pilih minat jurusan kedua Anda (ketik angka):\n1. Perkantoran (MPLB)\n2. Manajemen Bisnis (BDP)\n3. Komputer Software (PPLG)\n4. Manajemen Keuangan (AKL)' },
];

const jurusanMapping = {
    '1': 'Perkantoran (MPLB)',
    '2': 'Manajemen Bisnis (BDP)',
    '3': 'Komputer Software (PPLG)',
    '4': 'Manajemen Keuangan (AKL)',
};

const agamaMapping = {
    1: "Islam",
    2: "Kristen",
    3: "Katolik",
    4: "Hindu",
    5: "Buddha",
    6: "Konghucu",
};

// Menangani pesan masuk
client.on('message', async (message) => {
    const userId = message.from;
    const pesan = message.body.trim();

    if (!sessions[userId]) {
        sessions[userId] = { step: null, data: {} };
    }

    const userSession = sessions[userId];

    if (!userSession.step) {
        message.reply(`Selamat datang di SMK Sangkuriang 1 Cimahi!
Silakan pilih salah satu opsi berikut dengan mengetik angka:
1. Informasi Sekolah
2. Biaya Masuk
3. Daftar PPDB`);
        userSession.step = 'menu';
    } else if (userSession.step === 'menu') {
        if (pesan === '3') {
            userSession.step = 'ppdb';
            userSession.currentQuestion = 0;
            message.reply(ppdbQuestions[0].question + "\n\n*Ketik 'c' untuk batal.*");
        } else if (pesan === '1' || pesan === '2') {
            const responses = {
                '1': `📚 *Informasi Sekolah SMK Sangkuriang 1 Cimahi*:\n- Alamat: Jl. Sangkuriang no.76 Cimahi\n- Instagram: @sangkuriang1.official\n- Website: www.smksangkuriang1cimahi.sch.id`,
                '2': `💰 *Biaya Masuk*:\n- Pendaftaran: Rp 150.000\n- Pendidikan: Rp 2.350.000\n- SPP: Rp 170.000/bulan`,
            };
            message.reply(responses[pesan]);
            userSession.step = null;
        } else {
            message.reply("Opsi tidak valid. Silakan pilih 1, 2, atau 3.");
        }
    } else if (userSession.step === 'ppdb') {
        if (pesan.toLowerCase() === 'c') {
            message.reply("Proses pendaftaran dibatalkan.");
            userSession.step = null;
            userSession.data = {};
            return;
        }

        const currentQuestionIndex = userSession.currentQuestion;
        const currentQuestion = ppdbQuestions[currentQuestionIndex];
        const key = currentQuestion.key;

        if (key === 'kab_kota') {
            const alamat = `Jl. ${userSession.data['jalan']}, RT/RW ${userSession.data['rt_rw']}, Kelurahan ${userSession.data['kelurahan']}, Kecamatan ${userSession.data['kecamatan']}, Kab/Kota ${pesan}`;
            userSession.data['alamat'] = alamat; // Gabungkan data alamat
            userSession.data['kab_kota'] = pesan; // Simpan kab_kota secara terpisah jika diperlukan
        }

        // Validasi per pertanyaan
        if (key === 'tahun_lahir' && !isValidYear(pesan)) {
            message.reply("Tahun lahir tidak valid. Masukkan tahun dengan format YYYY (contoh: 2005).");
            return;
        }

        if (key === 'bulan_lahir' && !isValidMonth(pesan)) {
            message.reply("Bulan lahir tidak valid. Masukkan angka antara 1 dan 12.");
            return;
        }

        if (key === 'tanggal_lahir') {
            if (!isValidDate(userSession.data['tahun_lahir'], userSession.data['bulan_lahir'], pesan)) {
                message.reply("Tanggal lahir tidak valid. Periksa kembali tahun, bulan, dan tanggal.");
                return;
            }
            userSession.data['tanggal_lahir'] = `${userSession.data['tahun_lahir']}-${userSession.data['bulan_lahir']}-${pesan}`;
        } else if (key === 'jenkel' && !isValidGender(pesan)) {
            message.reply("Jenis kelamin tidak valid. Masukkan 'l' untuk laki-laki atau 'p' untuk perempuan.");
            return;
        } else if (key === 'agama' && !isValidAgama(pesan)) {
            message.reply("Agama tidak valid. Masukkan angka 1-6 sesuai pilihan.");
            return;
        } else if (key === 'nohp' && !isValidNoHp(pesan)) {
            message.reply("Nomor HP tidak valid. Gunakan format 08xxxxxxxxxx.");
            return;
        } else if ((key === 'minat_jurusan1' || key === 'minat_jurusan2') && !isValidJurusan(pesan)) {
            message.reply("Pilihan jurusan tidak valid. Masukkan angka 1-4.");
            return;
        } else {
            if (key === 'agama') {
                userSession.data[key] = agamaMapping[pesan];
            } else if (key === 'minat_jurusan1' || key === 'minat_jurusan2') {
                userSession.data[key] = jurusanMapping[pesan];
            } else {
                userSession.data[key] = pesan;
            }
        }

        if (currentQuestionIndex + 1 < ppdbQuestions.length) {
    userSession.currentQuestion++;
    message.reply(ppdbQuestions[userSession.currentQuestion].question);
} else {
    let summary = "Berikut adalah data yang Anda pilih:\n\n";
    Object.entries(userSession.data).forEach(([key, value]) => {
        if (key === 'agama') {
            value = agamaMapping[userSession.data[key]] || value;
        }
        if (key === 'minat_jurusan1' || key === 'minat_jurusan2') {
            value = jurusanMapping[userSession.data[key]] || value;
        }
        summary += `${key}: ${value}\n`;
    });
    summary += "\nApakah data Anda sudah benar?\nKetik 'y' untuk kirim, ketik 'n' untuk batal.";
    message.reply(summary);
    userSession.step = 'confirmation';
}

    } else if (userSession.step === 'confirmation') {
    if (pesan.toLowerCase() === 'y') {
        try {
            // Kirim data ke server API
            const no_hpFormatted = formatNoHp(userSession.data.no_hp);
            const text = `Pemberitahuan, ada siswa baru mendaftar dengan nama ${userSession.data.nama_lengkap}, dan asal sekolah dari ${userSession.data.asal_sekolah}, no Whatsapp : https://wa.me/${no_hpFormatted}`;
            const response = await axiosInstance.post('/ppdb/daftar', userSession.data);
            const tele = await axios.get(`https://api.telegram.org/bot${process.env.API_BOT_TELEGRAM}/sendMessage?chat_id=${process.env.CHAT_ID_TELEGRAM}&text=${text}`);
            message.reply("✅ Data Anda berhasil dikirim. Terima kasih telah mendaftar!");
            // Reset sesi pengguna
            userSession.step = null;
            userSession.data = {};
        } catch (error) {
            message.reply(error.message);
            console.error("Error sending data:", error.message);
        }
    } else if (pesan.toLowerCase() === 'n') {
        message.reply("Proses pendaftaran dibatalkan.");
        // Reset sesi pengguna
        userSession.step = null;
        userSession.data = {};
    } else {
        message.reply("Masukkan tidak valid. Ketik 'y' untuk kirim atau 'n' untuk batal.");
    }
}

});

module.exports = client;