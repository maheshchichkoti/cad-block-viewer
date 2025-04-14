module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/src/config/",
    "/src/models/index.js", // Usually don't test boilerplate
    "/src/server.js", // Integration tests are better for the main server file
  ],
  testTimeout: 10000, // Increase timeout if tests involving DB are slow
};
