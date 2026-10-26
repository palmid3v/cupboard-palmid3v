import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import AuthGate from "./components/AuthGate.jsx";
import { ThemeProvider } from "./theme-engine";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider storageKey="cupboard-theme" defaultTheme="cupboard">
      <AuthGate>
        <App />
      </AuthGate>
    </ThemeProvider>
  </StrictMode>,
);
