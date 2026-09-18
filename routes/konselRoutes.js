const express = require("express");
const router = express.Router();
const konselApiKey = require("../middleware/konselApiKey");
const {
  getStats,
  getSessions,
  getSessionDetail,
  createSession,
  updateSession,
  addMessage,
  getStudents,
  findStudentForBot,
  saveNotificationLog,
  resetStudentPassword,
  getSettings,
  saveSettings,
} = require("../controllers/konselController");

// Seluruh route di /api/konsel diamankan oleh konselApiKey
router.use(konselApiKey);

router.get("/stats", getStats);
router.get("/sessions", getSessions);
router.get("/sessions/:id", getSessionDetail);
router.post("/sessions", createSession);
router.put("/sessions/:id", updateSession);
router.post("/messages", addMessage);
router.get("/students", getStudents);
router.post("/students/auth-find", findStudentForBot);
router.post("/notifications", saveNotificationLog);
router.post("/students/reset-password", resetStudentPassword);
router.get("/settings", getSettings);
router.post("/settings", saveSettings);

module.exports = router;
