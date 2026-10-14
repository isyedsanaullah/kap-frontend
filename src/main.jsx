// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// ── Apply stored dark-mode preference BEFORE React renders ──
// Prevents flash of wrong theme on page load.
const _theme = localStorage.getItem("theme");
if (
  _theme === "dark" ||
  (!_theme && window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);