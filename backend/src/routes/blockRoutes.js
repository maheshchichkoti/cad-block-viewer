const express = require("express");
const blockController = require("../controllers/blockController");

const router = express.Router();

// GET /api/blocks - List blocks (paginated, filter by fileId)
router.get("/", blockController.listBlocks);

// GET /api/blocks/search - Search blocks (by name 'q', filter by fileId)
router.get("/search", blockController.searchBlocks);

// GET /api/blocks/:id - Get details for a specific block
router.get("/:id", blockController.getBlockDetails);

module.exports = router;
