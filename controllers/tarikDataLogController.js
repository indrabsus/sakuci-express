const { TarikDataLog } = require("../models");

const catatLog = async (req, res) => {
  try {
    const { sumber, status, pesan } = req.body;

    if (!["manual", "terjadwal"].includes(sumber)) {
      return res.status(400).json({ status: "error", message: "sumber harus 'manual' atau 'terjadwal'." });
    }
    if (!["sukses", "gagal"].includes(status)) {
      return res.status(400).json({ status: "error", message: "status harus 'sukses' atau 'gagal'." });
    }

    const log = await TarikDataLog.create({
      sumber,
      status,
      pesan: pesan ? String(pesan).slice(0, 255) : null,
    });

    res.json({ status: "success", data: log });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getLog = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const logs = await TarikDataLog.findAll({ order: [["created_at", "DESC"]], limit });
    res.json({ status: "success", data: logs });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = { catatLog, getLog };
