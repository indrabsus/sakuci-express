const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};

// Baca semua file model
fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js')) // Hindari file index.js
  .forEach((file) => {
    const modelModule = require(path.join(__dirname, file));

    // Model sudah berupa instance, jadi langsung tambahkan ke db
    const model = modelModule(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Hubungkan asosiasi jika ada
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
