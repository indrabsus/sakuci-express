const axios = require("axios");
const { TarikDataLog } = require("../models");

const TARIK_DATA_URL = "https://sakuci.id/tarikdata";

const runTarikDataScheduled = async () => {
  try {
    const { data } = await axios.get(TARIK_DATA_URL, { timeout: 60000 });
    if (!data?.success) {
      throw new Error(data?.message || "Response tidak menandakan sukses.");
    }
    console.log("[tarik data terjadwal] Berhasil menarik data dari mesin.");
    await TarikDataLog.create({ sumber: "terjadwal", status: "sukses", pesan: data.message || null });
  } catch (error) {
    console.error("[tarik data terjadwal] Gagal menarik data:", error.message);
    await TarikDataLog.create({ sumber: "terjadwal", status: "gagal", pesan: String(error.message).slice(0, 255) });
  }
};

module.exports = { runTarikDataScheduled };
