# CAD Block Viewer Technical Assignment

This application allows users to upload DXF files, extracts block information (name, layer, insertion coordinates), stores it in a PostgreSQL database, and displays it via a web interface.

## Features

- DXF File Upload (.dxf only)
- Asynchronous background processing of files with status updates (processing, completed, failed).
- Extraction of block names, layers, and coordinates from `INSERT` entities within DXF files.
- PostgreSQL storage using Sequelize ORM and managed via migrations.
- RESTful API endpoints for:
  - File upload and status checking.
  - Listing blocks with pagination and filtering by source file.
  - Searching blocks by name with optional file filtering.
  - Retrieving detailed information for a single block.
- React frontend built with Tailwind CSS for:
  - File upload interface including upload progress indication.
  - Dynamic block list display featuring pagination and live search.
  - Detailed view page for individual blocks.
  - Automatic polling to update file processing status in the UI.

## Project Structure

```
cad-block-viewer/
├── backend/        # Node.js/Express/Sequelize API`
├── frontend/       # React/Tailwind UI
└── README.md       # This file
```

## Technology Stack

- **Backend:** Node.js, Express, Sequelize, PostgreSQL, `dxf-parser`, `multer`, `cors`, `dotenv`
- **Frontend:** React, Tailwind CSS, Axios, React Router DOM
- **Database:** PostgreSQL
- **Testing:** Jest (Backend unit tests)

## Setup Instructions

**Prerequisites:**

- Node.js (v16 or later recommended)
- npm (or yarn)
- PostgreSQL Server (running locally or accessible)
- Git (for cloning)

**Backend Setup:**

1.  Clone the repository: `git clone <your-repo-url>`
2.  Navigate to the `backend` directory: `cd cad-block-viewer/backend`
3.  Install dependencies: `npm install`
4.  Create a PostgreSQL database (e.g., `cad_viewer_db`). You can use the command `createdb cad_viewer_db` if you have Postgres command-line tools installed and configured.
5.  Create a `.env` file by copying `.env.example`: `cp .env.example .env`
6.  **Edit the `.env` file** with your correct PostgreSQL `DATABASE_URL` (e.g., `postgres://YOUR_USER:YOUR_PASSWORD@localhost:5432/cad_viewer_db`) and desired `PORT` (e.g., `5001`). Ensure the `UPLOAD_DIR` path (e.g., `./uploads`) is writable by the application.
7.  **Apply database migrations:** `npx sequelize-cli db:migrate`
    - This command executes the migration files located in `backend/migrations/` to create the `files` and `blocks` tables with the correct schema in your database.
8.  Start the backend server (development mode with Nodemon for auto-restarts): `npm run dev`
    - Look for console output confirming "Database connection has been established successfully" and "Server is running on http://localhost:PORT".
    - For production: `npm start`

**Frontend Setup:**

1.  Navigate to the `frontend` directory: `cd ../frontend` (from the project root)
2.  Install dependencies: `npm install`
3.  Start the frontend development server: `npm start`
4.  The application should open automatically in your browser, typically at `http://localhost:3000`. If that port is busy, React scripts might suggest another port.

## API Documentation

**Files API (`/api/files`)**

- **`POST /upload`**
  - Description: Uploads a DXF file (`.dxf` only) for processing. Expects `multipart/form-data` with a field named `file`. Initiates asynchronous processing.
  - Request Body: FormData containing the `.dxf` file under the key `file`.
  - Success Response (202 Accepted): `{ message: "File upload accepted, processing started.", file: { id, originalName, storedFileName, status, createdAt, updatedAt } }` - Returns the initial file record.
  - Error Responses: 400 (No file uploaded, invalid file type, file size exceeded limit), 500 (Server error during initial record creation or file system access).
- **`GET /`**
  - Description: Lists all previously uploaded file records.
  - Success Response (200 OK): `[ { id, originalName, storedFileName, status, createdAt, updatedAt }, ... ]`
- **`GET /:id/status`**
  - Description: Gets the current processing status (`processing`, `completed`, `failed`) of a specific file by its ID. Used by the frontend for polling.
  - Path Params: `id` (integer, required).
  - Success Response (200 OK): `{ id, status, originalName }`
  - Error Responses: 404 (File not found).

**Blocks API (`/api/blocks`)**

- **`GET /`**
  - Description: Retrieves a paginated list of extracted blocks, optionally filtered by the source `fileId`.
  - Query Params:
    - `fileId` (integer, optional): Filter blocks belonging only to this file ID.
    - `page` (integer, optional, default: 1): The page number for pagination.
    - `limit` (integer, optional, default: 10): The number of blocks per page.
  - Success Response (200 OK): `{ total: number, page: number, limit: number, totalPages: number, data: [ { id, name, layer, coordinates, fileId, createdAt, updatedAt, file: { id, originalName } }, ... ] }`
  - Error Responses: 400 (Invalid query parameter values like non-integer page/limit).
- **`GET /search`**
  - Description: Searches for blocks by name (case-insensitive, partial match), optionally filtered by the source `fileId`. Does not support pagination directly; returns all matches.
  - Query Params:
    - `q` (string, required): The search term for the block name.
    * `fileId` (integer, optional): Filter search results to blocks belonging only to this file ID.
  - Success Response (200 OK): `[ { id, name, layer, coordinates, fileId, createdAt, updatedAt, file: { id, originalName } }, ... ]` (Returns a flat array of matching blocks)
  - Error Responses: 400 (Missing or empty `q` parameter, invalid `fileId`).
- **`GET /:id`**
  - Description: Retrieves the full details for a specific block by its ID.
  - Path Params: `id` (integer, required): The ID of the block to retrieve.
  - Success Response (200 OK): `{ id, name, layer, coordinates, fileId, createdAt, updatedAt, file: { id, originalName } }` (Includes associated file info)
  - Error Responses: 400 (Invalid block ID format), 404 (Block with the specified ID not found).

## Database Schema

(Explanation based on the Sequelize migrations and models)

- **`files` Table:** Stores metadata about uploaded DXF files. Created via migration.
  - `id`: Primary Key (Serial Integer).
  - `originalName`: (String) Original name of the uploaded file.
  - `storedFileName`: (String) Unique name assigned by multer upon storage on the server.
  - `status`: (String) Processing status, defaults to 'processing'. Can be 'processing', 'completed', or 'failed'.
  - `createdAt`, `updatedAt`: (Timestamps with Time Zone) Automatically managed by Sequelize.
- **`blocks` Table:** Stores data for each extracted block instance found within a file. Created via migration.
  - `id`: Primary Key (Serial Integer).
  * `fileId`: (Integer) Foreign Key referencing `files.id`. Configured with `ON DELETE CASCADE`.
  * `name`: (String) Name of the referenced block definition (from the DXF `INSERT` entity).
  * `layer`: (String) Layer the block instance resides on (nullable, from DXF `INSERT` entity).
  * `coordinates`: (JSONB) Insertion point coordinates stored as a JSON object (e.g., `{ "x": 10.5, "y": 20.0, "z": 0.0 }`).
  * `createdAt`, `updatedAt`: (Timestamps with Time Zone) Automatically managed by Sequelize.
- **Relationships:** One-to-Many defined between `files` and `blocks` (one file can have many block instances). The `onDelete: 'CASCADE'` ensures that deleting a file record automatically deletes all associated block records.
- **Indexes:** Database indexes are created via migrations on `blocks.fileId`, `blocks.name`, and `files.status` to improve query performance for filtering and searching.

## Reasoning Behind Library Choices

- **Node.js/Express:** Standard, efficient, and widely supported choice for building backend REST APIs in the JavaScript ecosystem. Excellent for I/O-bound tasks like handling web requests and file processing.
- **PostgreSQL:** Powerful, reliable open-source relational database. Its strong support for the `JSONB` data type is ideal for storing semi-structured coordinate data efficiently while still allowing querying.
- **Sequelize:** Mature and feature-rich Object-Relational Mapper (ORM) for Node.js. Simplifies database interactions, manages connections, handles data validation, supports transactions, and provides a robust migration system (Sequelize CLI) for schema management.
- **`dxf-parser`:** Specific library recommended for parsing DXF files in JavaScript. Chosen as it focuses on extracting the data structure rather than rendering, fitting the assignment's requirements.
- **`multer`:** De facto standard Express middleware for handling `multipart/form-data`, essential for robust file uploads.
- **React:** Leading library for building interactive and component-based user interfaces. Enables efficient state management and UI updates.
- **Tailwind CSS:** Utility-first CSS framework that allows for rapid development and styling directly within the HTML/JSX structure, minimizing the need for separate CSS files for component styling.
- **Axios:** Popular, promise-based HTTP client for making API requests from the frontend (React) to the backend (Express). Simplifies handling requests and responses.
- **React Router DOM:** Standard library for implementing client-side routing within a React Single Page Application (SPA), enabling navigation between different views (like the main upload/list page and the block detail page).

## Challenges Faced & Solutions

- **Challenge:** DXF File Complexity & Parsing Reliability.
  - **Solution:** Focused the `dxf-parser` implementation on extracting data only from common `INSERT` entities, acknowledging that complex DXF features (XREFs, advanced entities) are out of scope. Implemented robust `try...catch` blocks around the parsing logic in the service layer. Ensured that parsing errors gracefully update the corresponding file record's status to 'failed' in the database, providing clear feedback to the user via status polling. Tested with various DXF files (including intentionally invalid ones) to confirm error handling.
- **Challenge:** Handling Asynchronous File Processing Without Blocking Requests.
  - **Solution:** Designed the file upload controller endpoint (`POST /api/files/upload`) to perform minimal synchronous work: save the file using `multer`, create an initial `File` record in the database with status 'processing', and immediately respond to the client with `202 Accepted`. The computationally intensive DXF parsing (`processDxfFile` service function) is called asynchronously _after_ the response is sent (fire-and-forget approach suitable for this assignment scale). This keeps the API responsive. Status updates ('completed'/'failed') are handled within the asynchronous `processDxfFile` function upon completion or error.
- **Challenge:** Providing UI Feedback for Background Processing.
  - **Solution:** Implemented a polling mechanism in the React frontend (`App.js`). After a file upload is accepted (202 response), the frontend periodically calls the `GET /api/files/:id/status` endpoint to check the file's status. The UI displays the current status and stops polling once the status changes to 'completed' or 'failed'.
- **Challenge:** Storing Coordinate Data Efficiently.
  - **Solution:** Leveraged PostgreSQL's `JSONB` data type for the `coordinates` column in the `blocks` table. This allows storing the `{x, y, z}` data flexibly while offering efficient storage and the potential for JSON-specific querying if needed later. Added basic object structure validation in the Sequelize model.
- **Challenge:** Ensuring Data Integrity During Processing.
  - **Solution:** Utilized Sequelize transactions (`db.sequelize.transaction`) within the `processDxfFile` service. The bulk creation of `Block` records and the final update of the `File` status to 'completed' happen within the same atomic transaction. This ensures that if block creation fails for some reason, the file status is not incorrectly marked as completed.
- **Challenge:** Unit Testing Asynchronous Service Logic.
  - **Solution:** Ensured service functions (`parseDxfContent`) were exported correctly for testing. Used `async/await` with Jest tests to handle the promises returned by the parsing function. Corrected issues with sample DXF string formatting within tests to ensure the parser received valid input, isolating the function logic being tested.

## AI Coding Assistant Usage

(Example - Please customize based on your actual usage)

Used an AI coding assistant (like ChatGPT or GitHub Copilot) throughout the development process for various tasks:

- **Boilerplate Generation:** Generated initial code skeletons for Express routes, controllers, Sequelize models, and React components based on the requirements, saving time on repetitive setup.
- **Syntax & Examples:** Provided correct syntax and usage examples for libraries like Sequelize (e.g., `findAndCountAll` for pagination, transaction handling), `multer` (storage configuration, file filtering), `dxf-parser`, and React hooks (`useState`, `useEffect`, `useCallback`).
- **Debugging Assistance:** Helped identify and resolve specific errors encountered during development. For instance, assisted in debugging a `TypeError` in Jest tests related to function exports (`TypeError: parseDxfContent is not a function`) by explaining `module.exports` behavior. Also helped diagnose issues related to incorrect DXF string formatting within unit tests.
- **Concept Explanation:** Clarified concepts like asynchronous processing in Node.js, the importance of database transactions, and best practices for error handling.
- **Code Refinement:** Suggested improvements for code structure, clarity, and error handling patterns (e.g., refining the `try...catch...finally` block in `processDxfFile`).
- **Documentation Drafts:** Generated initial drafts for sections of this README file, such as the API documentation format and library descriptions.

## Demo Video

[https://www.awesomescreenshot.com/video/38775997?key=de44c56363da8a7b39271b293673198d](https://www.awesomescreenshot.com/video/38775997?key=de44c56363da8a7b39271b293673198d)

---
