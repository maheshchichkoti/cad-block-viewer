import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchBlockDetailsApi } from "../api/services";

function BlockDetail() {
  const { blockId } = useParams(); // Get blockId from URL
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBlockDetails = async () => {
      if (!blockId) return;
      setLoading(true);
      setError("");
      try {
        const response = await fetchBlockDetailsApi(blockId);
        setBlock(response.data);
      } catch (err) {
        console.error("Failed to load block details:", err);
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to load block details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadBlockDetails();
  }, [blockId]); // Reload if blockId changes

  if (loading) {
    return <p className="text-center p-4">Loading block details...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600 p-4">Error: {error}</p>;
  }

  if (!block) {
    return <p className="text-center p-4">Block not found.</p>;
  }

  // Function to safely render coordinates
  const renderCoordinates = (coords) => {
    if (!coords) return "N/A";
    return `X: ${coords.x?.toFixed(3) ?? "N/A"}, Y: ${
      coords.y?.toFixed(3) ?? "N/A"
    }, Z: ${coords.z?.toFixed(3) ?? "N/A"}`;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded shadow-md mt-6">
      <h1 className="text-2xl font-bold mb-4">Block Details</h1>
      <div className="space-y-3">
        <p>
          <strong>ID:</strong> {block.id}
        </p>
        <p>
          <strong>Name:</strong> {block.name}
        </p>
        <p>
          <strong>Layer:</strong>{" "}
          {block.layer || <span className="text-gray-500 italic">None</span>}
        </p>
        <p>
          <strong>Coordinates:</strong> {renderCoordinates(block.coordinates)}
        </p>
        <p>
          <strong>Source File:</strong>{" "}
          {block.file
            ? `${block.file.originalName} (ID: ${block.file.id})`
            : "N/A"}
        </p>
        <p>
          <strong>Created At:</strong>{" "}
          {new Date(block.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Updated At:</strong>{" "}
          {new Date(block.updatedAt).toLocaleString()}
        </p>
      </div>
      <div className="mt-6">
        <Link
          to={block.file ? `/files/${block.file.id}` : "/"} // Link back to the file's block list or home
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Block List
        </Link>
      </div>
    </div>
  );
}

export default BlockDetail;
