-- Drop tables if they exist to start fresh (optional, for development)
DROP TABLE IF EXISTS blocks;
DROP TABLE IF EXISTS files;

-- Create the files table
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  "originalName" VARCHAR(255) NOT NULL,
  "storedFileName" VARCHAR(255) UNIQUE NOT NULL, -- Store the name multer gives
  status VARCHAR(50) NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the blocks table
CREATE TABLE blocks (
  id SERIAL PRIMARY KEY,
  "fileId" INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE, -- Cascade delete blocks if file is deleted
  name VARCHAR(255) NOT NULL,
  layer VARCHAR(255),
  coordinates JSONB NOT NULL, -- Store {x, y, z}
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for faster lookups
CREATE INDEX idx_blocks_file_id ON blocks("fileId");
CREATE INDEX idx_blocks_name ON blocks(name);

-- Optional: Index for status on files if you query by it often
CREATE INDEX idx_files_status ON files(status);