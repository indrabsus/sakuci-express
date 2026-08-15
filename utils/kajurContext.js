const { DataUser } = require("../models");

async function getKajurDataUser(req) {
  return DataUser.findByPk(req.user.id_data);
}

async function getKajurJurusan(req) {
  const dataUser = await getKajurDataUser(req);
  return dataUser?.jurusan || null;
}

module.exports = { getKajurDataUser, getKajurJurusan };
