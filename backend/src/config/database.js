// Example using DATABASE_URL from .env
require("dotenv").config();
const { Sequelize } = require("sequelize");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false, // Set to console.log for debugging SQL queries
  dialectOptions: {
    // Add SSL options here if connecting to a cloud DB that requires it
    // ssl: {
    //   require: true,
    //   rejectUnauthorized: false // Note: Use with caution, depends on your provider's CA
    // }
  },
});

module.exports = sequelize;
