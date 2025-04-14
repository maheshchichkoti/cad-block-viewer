"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {
      // define association here
      File.hasMany(models.Block, {
        foreignKey: "fileId",
        as: "blocks", // Alias for the association
        onDelete: "CASCADE", // Ensure blocks are deleted when a file is deleted
      });
    }
  }
  File.init(
    {
      originalName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "originalName",
      },
      storedFileName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: "storedFileName",
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "createdAt",
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updatedAt",
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "processing", // 'processing', 'completed', 'failed'
        validate: {
          isIn: [["processing", "completed", "failed"]],
        },
      },
      // createdAt and updatedAt are handled by Sequelize by default (timestamps: true)
    },
    {
      sequelize,
      modelName: "File",
      tableName: "files", // Explicit table name
      timestamps: true,
    }
  );
  return File;
};
