const axios = require("axios");

const TARIK_DATA_URL = "https://sakuci.id/tarikdata";

const runTarikDataScheduled = async () => {
  try {
    const { data } = await axios.get(TARIK_DATA_URL, { timeout: 60000 });
    if (!data?.success) {
      throw new Error(data?.message || "Response tidak menandakan sukses.");
    }
    console.log("[tarik data terjadwal] Berhasil menarik data dari mesin.");
  } catch (error) {
    console.error("[tarik data terjadwal] Gagal menarik data:", error.message);
  }
};

module.exports = { runTarikDataScheduled };
