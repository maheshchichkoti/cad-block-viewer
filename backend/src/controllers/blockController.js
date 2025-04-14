const { Op } = require("sequelize");
const db = require("../models");

/**
 * Controller to list blocks with pagination, optionally filtered by fileId.
 */
exports.listBlocks = async (req, res, next) => {
  const { fileId, page = 1, limit = 10 } = req.query;

  // Basic Validation
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const fileIdNum = fileId ? parseInt(fileId, 10) : null;

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    return res
      .status(400)
      .json({
        error:
          "Invalid pagination parameters. Page and limit must be positive integers.",
      });
  }
  if (fileId && (isNaN(fileIdNum) || fileIdNum < 1)) {
    return res
      .status(400)
      .json({ error: "Invalid fileId parameter. Must be a positive integer." });
  }

  const offset = (pageNum - 1) * limitNum;
  const whereClause = {};
  if (fileIdNum) {
    whereClause.fileId = fileIdNum;
  }

  try {
    const { count, rows } = await db.Block.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      order: [["name", "ASC"]], // Example ordering
      // Include File info if needed
      include: [
        { model: db.File, as: "file", attributes: ["id", "originalName"] },
      ],
    });

    res.status(200).json({
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
      data: rows,
    });
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

/**
 * Controller to search blocks by name, optionally filtered by fileId.
 */
exports.searchBlocks = async (req, res, next) => {
  const { q, fileId } = req.query;

  if (!q || typeof q !== "string" || q.trim() === "") {
    return res
      .status(400)
      .json({
        error:
          'Search query parameter "q" is required and must be a non-empty string.',
      });
  }
  const fileIdNum = fileId ? parseInt(fileId, 10) : null;
  if (fileId && (isNaN(fileIdNum) || fileIdNum < 1)) {
    return res
      .status(400)
      .json({ error: "Invalid fileId parameter. Must be a positive integer." });
  }

  const whereClause = {
    name: {
      [Op.iLike]: `%${q.trim()}%`, // Case-insensitive search (PostgreSQL specific)
    },
  };
  if (fileIdNum) {
    whereClause.fileId = fileIdNum;
  }

  try {
    const blocks = await db.Block.findAll({
      where: whereClause,
      order: [["name", "ASC"]],
      include: [
        { model: db.File, as: "file", attributes: ["id", "originalName"] },
      ],
    });
    res.status(200).json(blocks); // Return array directly for search
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get details of a single block by its ID.
 */
exports.getBlockDetails = async (req, res, next) => {
  const { id } = req.params;
  const blockId = parseInt(id, 10);

  if (isNaN(blockId) || blockId < 1) {
    return res
      .status(400)
      .json({ error: "Invalid block ID. Must be a positive integer." });
  }

  try {
    const block = await db.Block.findByPk(blockId, {
      include: [
        { model: db.File, as: "file", attributes: ["id", "originalName"] },
      ],
    });

    if (!block) {
      return res
        .status(404)
        .json({ error: `Block with ID ${blockId} not found.` });
    }

    res.status(200).json(block);
  } catch (error) {
    next(error);
  }
};
