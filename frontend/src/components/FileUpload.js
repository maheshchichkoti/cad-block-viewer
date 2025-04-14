import React, { useState, useCallback } from "react";
import { uploadFileApi } from "../api/services";

function FileUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setError(""); // Clear previous errors
    setProgress(0);
  };

  const handleUpload = useCallback(
    async (event) => {
      event.preventDefault(); // Prevent default form submission if inside a form
      if (!selectedFile) {
        setError("Please select a DXF file first.");
        return;
      }

      setUploading(true);
      setError("");
      setProgress(0);

      const formData = new FormData();
      formData.append("file", selectedFile); // 'file' must match backend multer field name

      try {
        const response = await uploadFileApi(formData, (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        });

        // Backend returns 202 Accepted, response.data contains initial file record
        if (response.status === 202 && response.data.file) {
          console.log(
            "Upload accepted, processing started:",
            response.data.file
          );
          // Pass the file ID or the whole file object up
          if (onUploadSuccess) onUploadSuccess(response.data.file);
        } else {
          // Should not happen with 202, but handle defensively
          throw new Error("Unexpected response after upload acceptance.");
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError(
          err.response?.data?.error || err.message || "File upload failed."
        );
        setProgress(0);
      } finally {
        setUploading(false);
        // Don't clear selected file here, user might want to see it
      }
    },
    [selectedFile, onUploadSuccess]
  );

  return (
    <div className="p-4 mb-6 bg-white rounded shadow-md">
      <h2 className="text-xl font-semibold mb-3">Upload DXF File</h2>
      <div className="mb-4">
        <input
          type="file"
          accept=".dxf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          disabled={uploading}
        />
        {selectedFile && (
          <p className="text-sm text-gray-600 mt-1">
            Selected: {selectedFile.name}
          </p>
        )}
      </div>

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
          <p className="text-center text-sm">{progress}%</p>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {uploading ? "Uploading..." : "Upload & Process"}
      </button>
    </div>
  );
}

export default FileUpload;
