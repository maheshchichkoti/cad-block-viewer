import React from "react";
import { createRoot } from "react-dom/client"; // Correct import
import "./index.css"; // Tailwind styles
import App from "./App";

const rootElement = document.getElementById("root"); // Assuming you have a <div id="root"> in your index.html
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
