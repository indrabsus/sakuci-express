const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const authMiddleware = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "chat");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maksimal 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Format file lampiran tidak didukung."));
    }
  },
});

router.use(authMiddleware);

router.get("/conversations", chatController.getConversations);
router.get("/contacts", chatController.getContacts);
router.get("/unread-count", chatController.getUnreadCount);
router.get("/messages/:otherUserId", chatController.getMessages);
router.post("/send", upload.single("lampiran"), chatController.sendMessage);
router.put("/read/:otherUserId", chatController.markAsRead);

module.exports = router;
