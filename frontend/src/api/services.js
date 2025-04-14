import apiClient from "./axiosConfig";

export const uploadFileApi = (formData, onUploadProgress) => {
  return apiClient.post("/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress, // Pass progress callback
  });
};

export const getFileStatusApi = (fileId) => {
  return apiClient.get(`/files/${fileId}/status`);
};

export const fetchBlocksApi = (fileId, page = 1, limit = 10) => {
  return apiClient.get("/blocks", {
    params: { fileId, page, limit },
  });
};

export const searchBlocksApi = (fileId, query) => {
  // Ensure query is not empty before sending
  if (!query || query.trim() === "") {
    // If search is cleared, fetch the first page instead
    return fetchBlocksApi(fileId, 1);
  }
  return apiClient.get("/blocks/search", {
    params: { fileId, q: query },
  });
};

export const fetchBlockDetailsApi = (blockId) => {
  return apiClient.get(`/blocks/${blockId}`);
};

// Optional: Fetch list of files
export const fetchFilesApi = () => {
  return apiClient.get("/files");
};
