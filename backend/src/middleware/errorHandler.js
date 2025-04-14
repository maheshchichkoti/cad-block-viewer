const multer = require("multer");
/**
 * Global Error Handling Middleware.
 * Catches errors passed via next(error) and sends a standardized JSON response.
 */
function errorHandler(err, req, res, next) {
  console.error("Global Error Handler:", err); // Log the error for debugging

  // Handle Multer errors specifically (e.g., file size limit)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  // Handle custom file filter errors
  if (err.message.includes("Invalid file type")) {
    return res.status(400).json({ error: err.message });
  }

  // Handle Sequelize validation errors
  if (err.name === "SequelizeValidationError") {
    const messages = err.errors.map((e) => e.message);
    return res
      .status(400)
      .json({ error: "Validation failed", details: messages });
  }
  // Handle Sequelize unique constraint errors
  if (err.name === "SequelizeUniqueConstraintError") {
    const messages = err.errors.map((e) => `${e.path} must be unique.`);
    return res.status(409).json({ error: "Conflict", details: messages }); // 409 Conflict
  }

  // Default to 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message =
    err.message || "An unexpected internal server error occurred.";

  res.status(statusCode).json({
    error: message,
    // Optionally include stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = errorHandler;
