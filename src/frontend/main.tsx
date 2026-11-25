import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";
import "./estilos.css";

const raiz = document.getElementById("raiz");
if (raiz === null) {
  throw new Error("Elemento #raiz não encontrado.");
}

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
