import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "@/lib/theme";
import { FormConfigProvider } from "@/lib/formConfigProvider";
import "./style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <FormConfigProvider>
          <App />
        </FormConfigProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
