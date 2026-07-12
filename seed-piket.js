require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User, DataUser, Role } = require('./models');

const USERNAME = 'piket';
const ROLE_NAME = 'manajemen';

(async () => {
  try {
    const role = await Role.findOne({ where: { nama_role: ROLE_NAME } });
    if (!role) {
      console.error(`Role "${ROLE_NAME}" tidak ditemukan.`);
      process.exit(1);
    }

    let user = await User.findOne({ where: { username: USERNAME } });
    const password = crypto.randomBytes(6).toString('base64url');

    if (user) {
      const hashed = await bcrypt.hash(password, 10);
      await user.update({ id_role: role.id_role, password: hashed, acc: 'y' });
      console.log(`User "${USERNAME}" sudah ada, password direset.`);
    } else {
      const hashed = await bcrypt.hash(password, 10);
      user = await User.create({
        username: USERNAME,
        id_role: role.id_role,
        password: hashed,
        acc: 'y',
      });
      console.log(`User "${USERNAME}" berhasil dibuat.`);
    }

    let dataUser = await DataUser.findOne({ where: { id_user: user.id } });
    if (!dataUser) {
      dataUser = await DataUser.create({
        id_user: user.id,
        nama_lengkap: 'Piket',
        nama_singkat: 'Piket',
        jenkel: 'l',
      });
      console.log('Profil DataUser untuk "Piket" dibuat.');
    }

    console.log('--- SELESAI ---');
    console.log('username:', USERNAME);
    console.log('password:', password);
    console.log('id_role:', role.id_role, `(${role.nama_role})`);
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();
