const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fileController = require("../controllers/fileController");

const router = express.Router();

// Ensure upload directory exists
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter (accept only .dxf)
const fileFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === ".dxf") {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Invalid file type. Only .dxf files are allowed."), false); // Reject file
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 20, // Example limit: 20MB
  },
});

// --- Routes ---
// POST /api/files/upload - Handles single file upload with field name 'file'
router.post("/upload", upload.single("file"), fileController.uploadFile);

// GET /api/files - List uploaded files (optional)
router.get("/", fileController.listFiles);

// GET /api/files/:id/status - Get status of a specific file
router.get("/:id/status", fileController.getFileStatus);

module.exports = router;
