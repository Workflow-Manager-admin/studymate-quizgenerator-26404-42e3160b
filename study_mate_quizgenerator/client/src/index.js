import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Minimal base styles for body/dark mode
const style = document.createElement("style");
style.innerHTML = `
  body {
    margin: 0;
    background: #181A1B;
    color: #EAEAEA;
  }
  ::selection { background: #40916c44; }
  input, button { font-family: inherit; }
`;
document.head.appendChild(style);

const container = document.getElementById("root");
createRoot(container).render(<App />);
