import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import reportWebVitals from "./reportWebVitals";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./styles/theme.css";

// =====================================
// THEME CONTEXT
// =====================================

import { ThemeProvider } from "./context/ThemeContext";

// =====================================
// ROOT
// =====================================

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// =====================================
// REPORT WEB VITALS
// =====================================

reportWebVitals();

// =====================================
// SERVICE WORKER - PWA
// =====================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "✅ Service Worker registrado:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error(
          "❌ Error registrando Service Worker:",
          error
        );
      });
  });
}