require('dotenv').config();
const { Role } = require('./models');

const ROLE_NAME = 'kajur';

(async () => {
  try {
    const existing = await Role.findOne({ where: { nama_role: ROLE_NAME } });

    if (existing) {
      console.log(`Role "${ROLE_NAME}" sudah ada, id_role:`, existing.id_role);
    } else {
      const role = await Role.create({ nama_role: ROLE_NAME });
      console.log(`Role "${ROLE_NAME}" berhasil dibuat, id_role:`, role.id_role);
    }

    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();
