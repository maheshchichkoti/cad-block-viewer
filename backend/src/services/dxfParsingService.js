const fs = require("fs").promises; // Use promise-based fs
const DxfParser = require("dxf-parser");
const db = require("../models"); // Import models through index

/**
 * Parses a DXF file content and extracts block insert information.
 * @param {string} dxfContent - The string content of the DXF file.
 * @param {number} fileId - The ID of the corresponding file record in the database.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of block data objects to be saved.
 * @throws {Error} If parsing fails or no INSERT entities are found.
 */
async function parseDxfContent(dxfContent, fileId) {
  const parser = new DxfParser();
  try {
    const dxf = parser.parse(dxfContent); // Use async parse if available, or wrap sync if necessary
    // Note: dxf-parser's parse seems synchronous in implementation details,
    // but reading the file content should be async.

    // --- Removed the console logs for parsed structure for cleaner production code ---
    // console.log("--- Parsed DXF Structure ---");
    // console.log(JSON.stringify(dxf.entities, null, 2)); // Log just the entities array
    // console.log("----------------------------");
    // --- End Removed Logs ---

    if (!dxf || !dxf.entities) {
      // Handle cases where the file might be valid DXF but has no ENTITIES section
      console.warn(
        `No entities found in fileId: ${fileId}. Marking as completed with 0 blocks.`
      );
      return []; // Return empty array, not an error
      // Or optionally: throw new Error("Invalid DXF structure or no entities found.");
    }

    const blocksToSave = [];
    dxf.entities.forEach((entity) => {
      // We are interested in INSERT entities which place block definitions
      if (entity.type === "INSERT") {
        // Basic validation
        if (entity.name && entity.position) {
          blocksToSave.push({
            fileId: fileId,
            name: entity.name,
            layer: entity.layer || null, // Use layer from insert if available
            coordinates: {
              // Store as JSON object
              x: entity.position.x ?? 0,
              y: entity.position.y ?? 0,
              z: entity.position.z ?? 0,
            },
          });
        } else {
          console.warn(
            `Skipping INSERT entity due to missing name or position: ${JSON.stringify(
              entity
            )}`
          );
        }
      }
    });

    if (blocksToSave.length === 0) {
      console.warn(`No block INSERT entities found in fileId: ${fileId}`);
      // This is not an error state, just no blocks to save.
    }

    return blocksToSave;
  } catch (err) {
    console.error(`DXF Parsing Error for fileId ${fileId}:`, err);
    // Rethrow a more specific error for the calling function to handle
    throw new Error(`DXF parsing failed: ${err.message}`);
  }
}

/**
 * Reads a DXF file, parses it, saves blocks, and updates file status.
 * This function is designed to be called asynchronously AFTER the initial file record is created.
 * @param {string} filePath - The path to the uploaded DXF file.
 * @param {number} fileId - The ID of the corresponding file record in the database.
 */
async function processDxfFile(filePath, fileId) {
  let fileContent;
  try {
    console.log(`Starting processing for fileId: ${fileId}, path: ${filePath}`);
    fileContent = await fs.readFile(filePath, "utf-8");

    // Call the internal parsing function
    const blocksData = await parseDxfContent(fileContent, fileId);

    // Use a transaction to save blocks and update file status atomically
    await db.sequelize.transaction(async (t) => {
      if (blocksData.length > 0) {
        // Only attempt bulkCreate if there's data
        await db.Block.bulkCreate(blocksData, { transaction: t });
        console.log(`Saved ${blocksData.length} blocks for fileId: ${fileId}`);
      } else {
        // Log even if no blocks were saved, but processing was successful
        console.log(
          `Processed fileId: ${fileId}, 0 block inserts found to save.`
        );
      }
      // Update file status to 'completed' regardless of whether blocks were found (if parsing didn't error)
      await db.File.update(
        { status: "completed" },
        { where: { id: fileId }, transaction: t }
      );
      console.log(`File status updated to 'completed' for fileId: ${fileId}`);
    });
  } catch (error) {
    // Catch errors from readFile OR parseDxfContent OR the transaction
    console.error(`Error processing fileId ${fileId}:`, error);
    // Update file status to 'failed' if anything goes wrong
    try {
      await db.File.update(
        { status: "failed" },
        { where: { id: fileId } } // No transaction needed here if the main one failed
      );
      console.log(`File status updated to 'failed' for fileId: ${fileId}`);
    } catch (updateError) {
      console.error(
        `Failed to update file status to 'failed' for fileId ${fileId}:`,
        updateError
      );
    }
    // Do NOT rethrow the error here, otherwise the finally block might not execute reliably
    // unless you have further upstream error handling. The status update is sufficient.
  } finally {
    // Optional: Clean up the uploaded file after processing, regardless of success/failure
    try {
      await fs.unlink(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    } catch (unlinkError) {
      // Log error but don't let it crash the process if file is already gone etc.
      if (unlinkError.code !== "ENOENT") {
        // Ignore "file not found" errors during cleanup
        console.error(
          `Failed to delete processed file ${filePath}:`,
          unlinkError
        );
      }
    }
  }
}

// Export both functions so parseDxfContent can be tested directly
module.exports = {
  processDxfFile,
  parseDxfContent, // Add this line
};
