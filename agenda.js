const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');

// Objek untuk menyimpan sesi pengguna
const sessions = {};

const client = new Client({
    authStrategy: new LocalAuth(),
});

// Fungsi untuk mengirim kembali ke menu utama
function sendBackToMenu(chatId) {
    client.sendMessage(chatId, 'Kembali ke menu utama. Ketik 1 untuk isi agenda atau 2 untuk absen siswa.');
}

client.on('message', async (message) => {
    const chatId = message.from; // ID unik untuk setiap pengguna
    const text = message.body.trim().toLowerCase(); // Normalisasi teks

    // Jika belum ada sesi untuk pengguna, buat sesi baru
    if (!sessions[chatId]) {
        sessions[chatId] = {
            step: 'welcome', // Status awal
            username: null,  // Untuk menyimpan username
            agendaList: [],  // Menyimpan daftar agenda
            selectedAgenda: null, // Menyimpan agenda terpilih
            materiList: [], // Menyimpan daftar materi untuk absen
        };
    }

    const session = sessions[chatId];

    // Logika berdasarkan status sesi
    switch (session.step) {
        case 'welcome':
            client.sendMessage(chatId, 'Selamat datang di sistem agenda. Silakan masukkan username Anda untuk memulai:');
            session.step = 'waiting_username'; // Pindah ke langkah meminta username
            break;

        case 'waiting_username':
            const username = text; // Ambil input username
            const cekUsernameUrl = `http://api.sakuci.id/api/cekusername/${username}`;

            try {
                // Cek apakah username ada di sistem
                const { data } = await axios.get(cekUsernameUrl);

                if (data.status === 200) {
                    session.username = username; // Simpan username
                    session.step = 'menu'; // Pindah ke menu
                    client.sendMessage(chatId, `Terima kasih, ${session.username}.\n1.isi agenda \n2 untuk absen siswa \n\nketik 'c' untuk kembali ke menu utama.`);
                } else {
                    client.sendMessage(chatId, 'Username tidak ditemukan. Silakan coba lagi.');
                    client.sendMessage(chatId, 'Silakan masukkan username Anda:');
                }
            } catch (error) {
                client.sendMessage(chatId, 'Terjadi kesalahan saat mengecek username. Silakan coba lagi.');
            }
            break;

        case 'menu':
            if (text === '1') {
                session.step = 'display_agenda';
                client.sendMessage(chatId, `Sedang mengambil data agenda untuk username "${session.username}"...`);

                // Panggil API untuk mendapatkan data agenda
                const apiUrl = `http://api.sakuci.id/api/isiagenda/${session.username}`;
                try {
                    const { data } = await axios.get(apiUrl);
                    if (data.data && data.data.length > 0) {
                        session.agendaList = data.data.map((item, index) => ({
                            index: index + 1, // Nomor urut
                            tingkat: item.tingkat,
                            kelas: `${item.singkatan} ${item.nama_kelas}`,
                            id_mapelkelas: item.id_mapelkelas,
                        }));

                        const agendaMessage = session.agendaList.map(
                            (item) => `${item.index}. ${item.tingkat} ${item.kelas}`
                        ).join('\n');

                        client.sendMessage(chatId, `Agenda untuk username "${session.username}":\n${agendaMessage}\n\nKetik nomor pilihan Anda atau c untuk kembali ke menu utama:`);
                    } else {
                        client.sendMessage(chatId, 'Tidak ada agenda yang tersedia.');
                        sendBackToMenu(chatId);
                    }
                } catch (error) {
                    client.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data agenda. Pastikan username benar.');
                    sendBackToMenu(chatId);
                }
            } else if (text === '2') {
                session.step = 'waiting_absen'; // Pindah ke step untuk absen siswa
                client.sendMessage(chatId, `Sedang mengambil data absen untuk username "${session.username}"...`);

                // Panggil API untuk mendapatkan daftar materi absen
                const absenUrl = `http://api.sakuci.id/api/absenwa/${session.username}`;
                try {
                    const { data } = await axios.get(absenUrl);
                    if (data.data && data.data.length > 0) {
                        session.materiList = data.data.map((item, index) => ({
                            index: index + 1, // Nomor urut
                            id_materi: item.id_materi,
                            materi: item.materi,
                        }));

                        const materiMessage = session.materiList.map(
                            (item) => `${item.index}. ${item.materi}` // Menampilkan nama materi beserta ID-nya
                        ).join('\n');

                        client.sendMessage(chatId, `Daftar materi untuk absen siswa:\n${materiMessage}\n\nKetik nomor materi yang ingin diabsen atau ketik c untuk kembali ke menu utama.`);
                    } else {
                        client.sendMessage(chatId, 'Tidak ada materi absen yang tersedia.');
                        sendBackToMenu(chatId);
                    }
                } catch (error) {
                    client.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data absen. Pastikan username benar.');
                    sendBackToMenu(chatId);
                }
            } else if (text === 'c') {
                sendBackToMenu(chatId);
            } else {
                client.sendMessage(chatId, 'Perintah tidak valid. Ketik 1 untuk isi agenda, 2 untuk absen siswa, atau c untuk kembali ke menu utama.');
            }
            break;

        case 'display_agenda':
            if (text === 'c') {
                session.step = 'menu';
                sendBackToMenu(chatId);
            } else {
                const selectedIndex = parseInt(text, 10);
                if (isNaN(selectedIndex)) {
                    client.sendMessage(chatId, 'Pilihan tidak valid. Silakan pilih nomor yang sesuai dari daftar atau ketik c untuk kembali ke menu utama.');
                    return;  // Menghentikan eksekusi lebih lanjut jika input tidak valid
                }

                const selectedAgenda = session.agendaList.find(item => item.index === selectedIndex);

                if (selectedAgenda) {
                    session.selectedAgenda = selectedAgenda;
                    session.step = 'waiting_materi';
                    client.sendMessage(chatId, `Anda memilih: ${selectedAgenda.tingkat} ${selectedAgenda.kelas}. Silakan masukkan materi atau ketik c untuk kembali ke menu utama:`);
                } else {
                    client.sendMessage(chatId, 'Pilihan tidak valid. Silakan pilih nomor yang sesuai dari daftar atau ketik c untuk kembali ke menu utama.');
                }
            }
            break;

        case 'waiting_materi':
            if (text === 'c') {
                session.step = 'menu';
                sendBackToMenu(chatId);
            } else {
                const materi = text;
                const prosesAgendaUrl = `http://api.sakuci.id/api/prosesagenda/${materi}/${session.selectedAgenda.tingkat}/${session.selectedAgenda.id_mapelkelas}`;
                try {
                    await axios.get(prosesAgendaUrl);
                    client.sendMessage(chatId, 'Materi berhasil disimpan. Terima kasih!');
                } catch (error) {
                    client.sendMessage(chatId, 'Terjadi kesalahan saat menyimpan materi. Silakan coba lagi.');
                }
                session.step = 'menu'; // Kembali ke menu
                sendBackToMenu(chatId);
            }
            break;

            case 'waiting_absen':
                if (text === 'c') {
                    session.step = 'menu';
                    sendBackToMenu(chatId);
                } else {
                    const selectedIndex = parseInt(text, 10);
                    if (isNaN(selectedIndex)) {
                        client.sendMessage(chatId, 'Pilihan tidak valid. Silakan pilih nomor yang sesuai atau ketik c untuk kembali ke menu utama.');
                        return;
                    }
            
                    const selectedMateri = session.materiList.find(item => item.index === selectedIndex);
            
                    if (selectedMateri) {
                        // Proses absen materi
                        const absenUrl = `http://api.sakuci.id/api/absenlist/${selectedMateri.id_materi}`;
                        try {
                            const { data } = await axios.get(absenUrl);
                            if (data.data && data.data.length > 0) {
                                session.absenList = data.data.map((item, index) => ({
                                    index: index + 1, // Nomor urut
                                    nama_lengkap: item.nama_lengkap,
                                    id_user: item.id_user,
                                    id_materi: item.id_materi,
                                    waktu_agenda: item.waktu_agenda
                                }));
            
                                const absenMessage = session.absenList.map(
                                    (item) => `${item.index}. ${item.nama_lengkap}`
                                ).join('\n');
            
                                client.sendMessage(chatId, `Absen : \n${absenMessage}\n\nKetik nomor siswa yang ingin Anda beri keterangan, atau ketik c untuk kembali ke menu utama:`);
                                session.step = 'waiting_keterangan';
                            } else {
                                client.sendMessage(chatId, 'Tidak ada data absen yang tersedia.');
                                sendBackToMenu(chatId);
                            }
                        } catch (error) {
                            client.sendMessage(chatId, 'Terjadi kesalahan saat mengambil data absen. Pastikan username benar.');
                            sendBackToMenu(chatId);
                        }
                    } else {
                        client.sendMessage(chatId, 'Pilihan tidak valid. Silakan pilih nomor materi yang sesuai atau ketik c untuk kembali ke menu utama.');
                        sendBackToMenu(chatId);
                    }
                }
                break;
            
            case 'waiting_keterangan':
                if (text === 'c') {
                    session.step = 'menu';
                    sendBackToMenu(chatId);
                } else {
                    const selectedIndex = parseInt(text, 10);
                    if (isNaN(selectedIndex)) {
                        client.sendMessage(chatId, 'Pilihan tidak valid. Silakan pilih nomor siswa yang sesuai atau ketik c untuk kembali ke menu utama.');
                        return;
                    }
            
                    const selectedSiswa = session.absenList.find(item => item.index === selectedIndex);
            
                    if (selectedSiswa) {
                        session.selectedSiswa = selectedSiswa; // Simpan data siswa terpilih
                        session.step = 'waiting_keterangan_input'; // Pindah ke step input keterangan
            
                        client.sendMessage(chatId, `Anda memilih: ${selectedSiswa.nama_lengkap}. Pilih keterangan untuk siswa ini:\n1. Terlambat\n2. Sakit\n3. Izin\n4. Tanpa Keterangan`);
                    } else {
                        client.sendMessage(chatId, 'Pilihan tidak valid. Silakan pilih nomor siswa yang sesuai atau ketik c untuk kembali ke menu utama.');
                    }
                }
                break;
            
            case 'waiting_keterangan_input':
                if (text === 'c') {
                    session.step = 'menu';
                    sendBackToMenu(chatId);
                } else {
                    const keteranganMap = {
                        '1': 'Terlambat',
                        '2': 'Sakit',
                        '3': 'Izin',
                        '4': 'Tanpa Keterangan',
                    };
                    const nomorKeterangan = text;
                    const keterangan = keteranganMap[text];
                    
                   if (keterangan) {
                        
                        // Simpan keterangan ke API dengan parameter sesuai format yang diminta
                        const keteranganUrl = `http://api.sakuci.id/api/prosesabsen/${session.selectedSiswa.id_user}/${session.selectedSiswa.id_materi}/${session.selectedSiswa.waktu_agenda}/${nomorKeterangan}`;
                        console.log(nomorKeterangan);
                        try {
                            // Panggil API menggunakan metode GET (atau POST jika diperlukan)
                            const { data } = await axios.get(keteranganUrl);
                            
                            if (data.status === 200) {
                                client.sendMessage(chatId, `Keterangan berhasil disimpan untuk siswa ${session.selectedSiswa.nama_lengkap}.\nKeterangan: ${keterangan}. \nKetik 'c' untuk kembali ke menu utama.`);
                               
                            } else {
                                client.sendMessage(chatId, `Gagal menyimpan keterangan. Pesan: ${data.message}`);
                            }
                        } catch (error) {
                            client.sendMessage(chatId, 'Terjadi kesalahan saat menyimpan keterangan. Silakan coba lagi.');
                        }
                    
                        // Kembali ke menu utama setelah menyimpan
                        session.step = 'waiting_keterangan';
                        // sendBackToMenu(chatId);
                    } else {
                        client.sendMessage(chatId, 'Silakan masukkan keterangan yang valid.');
                    }
                    
                }
                break;
            
        default:
            client.sendMessage(chatId, 'Saya tidak memahami perintah Anda. Ketik 1 untuk isi agenda atau 2 untuk absen siswa.');
            break;
    }
});

client.initialize();
