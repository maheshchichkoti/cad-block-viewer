// backend/config/config.js
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const prodSslOptions = isProduction
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Adjust if Render provides specific CA guidance
      },
    }
  : {};

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    logging: false,
    // No SSL needed for local dev typically
  },
  test: {
    use_env_variable: "DATABASE_URL", // Or a specific test DB URL
    dialect: "postgres",
    logging: false,
    // No SSL typically
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    logging: false, // Keep logging off
    // --- ADD dialectOptions HERE ---
    dialectOptions: {
      ...prodSslOptions, // Spread the SSL options only in production
    },
    // --- END dialectOptions ---
    // Optional: Pool configuration
    // pool: { ... }
  },
};
