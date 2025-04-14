import axios from "axios";

// Use environment variable for API URL if needed, otherwise default
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    // Add other headers like Authorization if needed later
  },
});

export default apiClient;
