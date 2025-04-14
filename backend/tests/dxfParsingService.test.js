// backend/tests/dxfParsingService.test.js

const { parseDxfContent } = require("../src/services/dxfParsingService"); // Correct import

// --- CORRECTED SAMPLE DXF STRINGS ---

// Minimal valid DXF string containing one block definition and one insert
// Ensure exact formatting and EOF. Includes minimal required sections.
const sampleDxfContent = `  0
SECTION
  2
HEADER
  9
$ACADVER
  1
AC1009
  9
$INSUNITS
 70
     1
  0
ENDSEC
  0
SECTION
  2
TABLES
  0
TABLE
  2
BLOCK_RECORD
 70
     1
  0
BLOCK_RECORD
  2
MY_BLOCK
  0
ENDTAB
  0
ENDSEC
  0
SECTION
  2
BLOCKS
  0
BLOCK
  8
0
  2
MY_BLOCK
 70
     0
 10
0.0
 20
0.0
 30
0.0
  0
CIRCLE
  8
0
 10
1.0
 20
1.0
 30
0.0
 40
5.0
  0
ENDBLK
  0
ENDSEC
  0
SECTION
  2
ENTITIES
  0
INSERT
  8
LAYER_A
  2
MY_BLOCK
 10
100.5
 20
200.75
 30
10.0
  0
ENDSEC
  0
EOF`; // Ensure NO characters/newlines after this line

// Minimal valid DXF with entities but NO INSERT entities
const noInsertDxf = `  0
SECTION
  2
HEADER
  9
$ACADVER
  1
AC1009
  0
ENDSEC
  0
SECTION
  2
ENTITIES
  0
CIRCLE
  8
0
 10
1.0
 20
1.0
 30
0.0
 40
5.0
  0
ENDSEC
  0
EOF`; // Ensure NO characters/newlines after this line

// Invalid content for testing error handling
const invalidDxfContent = `THIS IS INVALID DATA 123 !@#`;

// --- END CORRECTED SAMPLES ---

describe("DXF Parsing Service", () => {
  // Test case 1: Parsing a valid DXF with one INSERT entity
  test("should parse valid DXF content and extract INSERT entity data", async () => {
    const fileId = 1; // Example file ID for context
    const blocks = await parseDxfContent(sampleDxfContent, fileId);

    // Assertions:
    expect(blocks).toBeInstanceOf(Array); // Should return an array
    expect(blocks.length).toBe(1); // Should find exactly one block INSERT

    // Check the content of the found block
    const block = blocks[0];
    expect(block).toHaveProperty("fileId", fileId);
    expect(block).toHaveProperty("name", "MY_BLOCK");
    expect(block).toHaveProperty("layer", "LAYER_A"); // Layer comes from INSERT entity (group code 8)
    expect(block).toHaveProperty("coordinates");
    expect(block.coordinates).toHaveProperty("x", 100.5);
    expect(block.coordinates).toHaveProperty("y", 200.75);
    expect(block.coordinates).toHaveProperty("z", 10.0);
  });

  // Test case 2: Parsing a valid DXF but with no INSERT entities
  test("should return an empty array if no INSERT entities are found", async () => {
    const fileId = 2; // Example file ID
    const blocks = await parseDxfContent(noInsertDxf, fileId);

    // Assertions:
    // It should parse successfully but find no INSERTs to extract
    expect(blocks).toBeInstanceOf(Array);
    expect(blocks).toEqual([]); // The result array should be empty
  });

  // Test case 3: Parsing completely invalid data
  test("should throw an error for invalid DXF content", async () => {
    const fileId = 3; // Example file ID
    // Use rejects.toThrow to check that the promise returned by parseDxfContent rejects with an error
    // Check that the error message matches the one thrown by our wrapper function
    await expect(parseDxfContent(invalidDxfContent, fileId)).rejects.toThrow(
      /^DXF parsing failed:/
    ); // Matches "DXF parsing failed: ..."
  });
});
