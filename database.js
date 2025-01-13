const sequelize = new Sequelize('zakola_id', 'zakola_id', 'Sangkuriang2020@#@#', {
  host: '127.0.0.1', // Sesuaikan jika tidak menggunakan 'localhost'
  port: 3306, // Pastikan port sesuai dengan konfigurasi MySQL di aaPanel
  dialect: 'mysql',
  logging: false,
});
