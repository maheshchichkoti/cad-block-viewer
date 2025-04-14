require("dotenv").config(); // Load environment variables first
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./models"); // Sequelize instance and models
const fileRoutes = require("./routes/fileRoutes");
const blockRoutes = require("./routes/blockRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
// Enable CORS for requests from frontend (adjust origin in production)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow frontend origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

// Body Parsers
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Serve static files (e.g., uploaded files if needed, though usually not recommended directly)
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- API Routes ---
app.use("/api/files", fileRoutes);
app.use("/api/blocks", blockRoutes);

// --- Root/Health Check ---
app.get("/", (req, res) => {
  res.send("CAD Block Viewer API is running!");
});

// --- Global Error Handler ---
// This middleware should be the LAST middleware added
app.use(errorHandler);

// --- Database Connection & Server Start ---
async function startServer() {
  try {
    // Authenticate connection
    await db.sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Sync models (Use with caution in production - migrations are better)
    // await db.sequelize.sync({ force: false }); // force: true drops tables first
    // console.log("Database synced.");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database or start server:", error);
    process.exit(1); // Exit if DB connection fails
  }
}

startServer();
