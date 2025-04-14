import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import FileUpload from "./components/FileUpload";
import BlockList from "./components/BlockList";
import BlockDetail from "./components/BlockDetail";
import { getFileStatusApi } from "./api/services";

// Main component to manage file selection and polling
function FileProcessor() {
  const [currentFile, setCurrentFile] = useState(null); // Store {id, status, originalName}
  const [isPolling, setIsPolling] = useState(false);
  const navigate = useNavigate();

  const handleUploadSuccess = (uploadedFile) => {
    setCurrentFile(uploadedFile);
    setIsPolling(true); // Start polling for status
    navigate(`/files/${uploadedFile.id}`); // Navigate to the block list page for this file
  };

  // Poll for file processing status
  useEffect(() => {
    let intervalId;
    if (isPolling && currentFile && currentFile.status === "processing") {
      intervalId = setInterval(async () => {
        try {
          const response = await getFileStatusApi(currentFile.id);
          const updatedFile = response.data;
          setCurrentFile(updatedFile); // Update local state
          if (
            updatedFile.status === "completed" ||
            updatedFile.status === "failed"
          ) {
            setIsPolling(false); // Stop polling once done
            console.log(
              `Polling stopped. File ${currentFile.id} status: ${updatedFile.status}`
            );
            // Optional: refresh block list if needed, though BlockList re-fetches on fileId change anyway
          }
        } catch (error) {
          console.error("Polling error:", error);
          setIsPolling(false); // Stop polling on error
        }
      }, 3000); // Poll every 3 seconds (adjust interval as needed)
    }

    // Cleanup interval on component unmount or when polling stops
    return () => clearInterval(intervalId);
  }, [isPolling, currentFile]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-700">
        CAD Block Viewer
      </h1>
      <FileUpload onUploadSuccess={handleUploadSuccess} />

      {currentFile && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p>
            <strong>Selected File:</strong> {currentFile.originalName} (ID:{" "}
            {currentFile.id})
          </p>
          <p>
            <strong>Status:</strong>
            <span
              className={`ml-2 font-semibold ${
                currentFile.status === "completed"
                  ? "text-green-600"
                  : currentFile.status === "failed"
                  ? "text-red-600"
                  : "text-yellow-600 animate-pulse" // Processing pulse
              }`}
            >
              {currentFile.status.toUpperCase()}
            </span>
          </p>
        </div>
      )}
      {/* The BlockList component will be rendered by the Route below */}
    </div>
  );
}

// Component to extract fileId from URL and pass to BlockList
function FileBlocksPage() {
  const { fileId } = useParams(); // Get fileId from route params
  const fileIdNum = parseInt(fileId, 10);

  if (isNaN(fileIdNum)) {
    return <p className="text-center text-red-500">Invalid File ID.</p>;
  }
  // We might want to fetch the file details here too to show name/status
  // but for now, just pass the ID to BlockList
  return <BlockList fileId={fileIdNum} />;
}

// Main App with Router Setup
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FileProcessor />} />
        <Route
          path="/files/:fileId"
          element={
            <>
              <FileProcessor /> {/* Keep uploader visible */}
              <div className="container mx-auto p-4 mt-[-2rem]">
                {" "}
                {/* Adjust layout */}
                <FileBlocksPage />
              </div>
            </>
          }
        />
        <Route path="/blocks/:blockId" element={<BlockDetail />} />
        {/* Add other routes as needed, e.g., a file list page */}
        <Route
          path="*"
          element={<p className="text-center p-5">Page Not Found</p>}
        />
      </Routes>
    </Router>
  );
}

export default App;
