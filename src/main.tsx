import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

// Import police Cormorant Garamond
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap";
document.head.appendChild(link);

// Reset CSS minimal
const style = document.createElement("style");
style.textContent = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body { background: #faf7f2; -webkit-font-smoothing: antialiased; } input, select, textarea, button { font-family: inherit; } input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; } a { text-decoration: none; }`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
