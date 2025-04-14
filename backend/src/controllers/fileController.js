const path = require("path");
const db = require("../models");
const { processDxfFile } = require("../services/dxfParsingService");

// Configure Multer Storage (adjust as needed)
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

/**
 * Controller to handle DXF file uploads.
 * Creates a File record and triggers background processing.
 */
exports.uploadFile = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(400)
      .json({
        error: "No file uploaded. Make sure the form field name is 'file'.",
      });
  }

  let fileRecord;
  try {
    // 1. Create the initial File record with 'processing' status
    fileRecord = await db.File.create({
      originalName: req.file.originalname,
      storedFileName: req.file.filename, // filename from multer
      status: "processing",
    });

    // 2. Trigger background processing (DO NOT await this here)
    // We send the response immediately, processing happens in the background.
    processDxfFile(req.file.path, fileRecord.id);

    // 3. Respond to the client immediately
    res.status(202).json({
      message: "File upload accepted, processing started.",
      file: fileRecord, // Send back the initial record
    });
  } catch (error) {
    console.error("File upload controller error:", error);
    // If file record creation failed before processing started
    if (fileRecord) {
      // Attempt to clean up if record was created but processing trigger failed
      await db.File.destroy({ where: { id: fileRecord.id } }).catch((e) =>
        console.error("Cleanup failed:", e)
      );
    }
    // Pass error to the global error handler
    next(error);
  }
};

/**
 * Controller to list uploaded files (optional endpoint)
 */
exports.listFiles = async (req, res, next) => {
  try {
    const files = await db.File.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(files);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get the status of a specific file
 */
exports.getFileStatus = async (req, res, next) => {
  const { id } = req.params;
  try {
    const file = await db.File.findByPk(id, {
      attributes: ["id", "status", "originalName"],
    });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    res.status(200).json(file);
  } catch (error) {
    next(error);
  }
};
