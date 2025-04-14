// backend/src/config/database.js
require("dotenv").config();
const { Sequelize } = require("sequelize");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const isProduction = process.env.NODE_ENV === "production";

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false, // Keep logging off unless debugging
  dialectOptions: {
    // --- ADD THIS SSL CONFIGURATION ---
    ssl: isProduction
      ? {
          require: true,
          // Render typically uses self-signed certificates or doesn't require CA verification from within its network
          rejectUnauthorized: false, // Adjust if Render provides specific CA guidance
        }
      : false, // Disable SSL for non-production environments (like local dev)
    // --- END SSL CONFIGURATION ---
  },
  // Optional: Pool configuration (good for production)
  // pool: {
  //   max: 5,
  //   min: 0,
  //   acquire: 30000,
  //   idle: 10000
  // }
});

module.exports = sequelize;
