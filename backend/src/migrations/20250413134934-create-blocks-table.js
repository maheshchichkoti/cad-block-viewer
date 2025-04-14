"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE blocks (
        id SERIAL PRIMARY KEY,
        "fileId" INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        layer VARCHAR(255),
        coordinates JSONB NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_blocks_file_id ON blocks("fileId");
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_blocks_name ON blocks(name);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS blocks;
    `);
  },
};
