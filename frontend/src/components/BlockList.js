import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchBlocksApi, searchBlocksApi } from "../api/services";
import { Link } from "react-router-dom"; // Import Link for details navigation

const DEBOUNCE_DELAY = 300; // ms

function BlockList({ fileId }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [limit] = useState(15); // Items per page

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, DEBOUNCE_DELAY);

    // Cleanup function
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const loadBlocks = useCallback(
    async (pageToLoad) => {
      if (!fileId) return;

      setLoading(true);
      setError("");
      try {
        let response;
        if (debouncedSearchTerm.trim()) {
          // Search doesn't typically support pagination in this backend setup
          // Fetch all matching search results
          response = await searchBlocksApi(fileId, debouncedSearchTerm);
          setBlocks(response.data);
          setTotalBlocks(response.data.length);
          setTotalPages(1); // Assume search fits on one page for simplicity
          setCurrentPage(1);
        } else {
          // Fetch paginated list
          response = await fetchBlocksApi(fileId, pageToLoad, limit);
          setBlocks(response.data.data);
          setTotalBlocks(response.data.total);
          setTotalPages(response.data.totalPages);
          setCurrentPage(response.data.page);
        }
      } catch (err) {
        console.error("Failed to load blocks:", err);
        setError(
          err.response?.data?.error || err.message || "Failed to load blocks."
        );
        setBlocks([]); // Clear blocks on error
        setTotalPages(1);
        setTotalBlocks(0);
      } finally {
        setLoading(false);
      }
    },
    [fileId, debouncedSearchTerm, limit]
  );

  // Load blocks on initial mount, fileId change, page change, or debounced search term change
  useEffect(() => {
    loadBlocks(currentPage);
  }, [fileId, currentPage, debouncedSearchTerm, loadBlocks]); // Include loadBlocks in dependency array

  // Wrap these functions in useCallback to prevent them from being recreated on every render
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Memoize pagination controls to prevent unnecessary re-renders
  const paginationControls = useMemo(
    () => (
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-600">
          Total Blocks: {totalBlocks}
        </span>
        {!debouncedSearchTerm.trim() &&
          totalPages > 1 && ( // Only show pagination if not searching (or if search is paginated)
            <div className="flex items-center">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 mr-2 border rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-1 ml-2 border rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
      </div>
    ),
    [
      totalBlocks,
      currentPage,
      totalPages,
      loading,
      handlePreviousPage,
      handleNextPage,
      debouncedSearchTerm,
    ]
  );

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-semibold mb-3">Blocks in File</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search blocks by name..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {loading && (
        <p className="text-center text-gray-600">Loading blocks...</p>
      )}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {!loading && !error && blocks.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          {debouncedSearchTerm
            ? "No blocks found matching your search."
            : "No blocks found in this file."}
        </p>
      )}

      {!loading && !error && blocks.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Layer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Coordinates (X, Y)
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blocks.map((block) => (
                  <tr key={block.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {block.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {block.layer || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {block.coordinates
                        ? `(${block.coordinates.x?.toFixed(
                            2
                          )}, ${block.coordinates.y?.toFixed(2)})`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/blocks/${block.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginationControls}
        </>
      )}
    </div>
  );
}

export default BlockList;
