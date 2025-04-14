"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Block extends Model {
    static associate(models) {
      // define association here
      Block.belongsTo(models.File, {
        foreignKey: "fileId",
        as: "file", // Alias for the association
      });
    }
  }
  Block.init(
    {
      fileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "fileId", // Matches DB
        references: { model: "files", key: "id" },
        onDelete: "CASCADE",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      layer: {
        type: DataTypes.STRING,
        allowNull: true, // Layer might not always be present or extracted
      },
      coordinates: {
        type: DataTypes.JSONB, // Use JSONB for efficiency and querying in Postgres
        allowNull: false,
        // Example validation: Ensure it's an object with x, y, z
        validate: {
          isCoordinatesObject(value) {
            if (
              typeof value !== "object" ||
              value === null ||
              !("x" in value) ||
              !("y" in value)
            ) {
              // Z might be optional depending on DXF
              throw new Error(
                "Coordinates must be an object with at least x and y properties."
              );
            }
          },
        },
      },
      // createdAt and updatedAt handled by Sequelize
    },
    {
      sequelize,
      modelName: "Block",
      tableName: "blocks",
      timestamps: true,
      indexes: [
        // Define indexes here matching schema.sql
        { fields: ["fileId"] },
        { fields: ["name"] },
      ],
    }
  );
  return Block;
};
