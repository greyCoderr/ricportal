import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/providers";
import "./styles/index.css";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Missing #root element in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
