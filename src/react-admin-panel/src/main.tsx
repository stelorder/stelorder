import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./i18n.ts";
import { ErrorBoundaryWithNavigate } from "./components/ErrorBoundary/ErrorBoundary.tsx";
import { integrationsTheme, AppThemeProvider } from "@stelsolutions/stelorder-catalog";
import { IntegrationProvider } from "./context/integration/IntegrationContext.tsx";
import { StyleSheetManager } from "styled-components"; // 1. Importar el gestor de estilos de styled-components

import App from "./App.tsx";

// 2. Importamos los estilos globales que queremos dentro del Shadow DOM
// La sintaxis "?inline" es específica de Vite.
import indexCss from "./index.css?inline";
import appCss from "./App.css?inline";
import { RootProvider } from "./context/RootContext/RootContext.tsx";
import {createObserveFontFaceRules} from "./observers/CSSFontFaceObserver.ts";

// 3. Obtenemos el contenedor host donde montaremos el Shadow DOM
const hostElement = document.getElementById("root");

if (hostElement) {
  // 4. Creamos el Shadow Root
  const shadowRoot = hostElement.attachShadow({ mode: "open" });

  // 5. Creamos el elemento <style> que contendrá los estilos globales
  const globalStyles = document.createElement("style");
  globalStyles.textContent = indexCss + appCss;
  shadowRoot.appendChild(globalStyles);

  // 6.Creamos el contenedor interno para React dentro del Shadow DOM
  const reactRootContainer = document.createElement("div");
  reactRootContainer.id = "react-shadow-root";
  shadowRoot.appendChild(reactRootContainer);

  createObserveFontFaceRules({
    document: shadowRoot,
    styleElemId: "shadow-font-face-styles"
  });

  // 7. Creamos el root de React apuntando al contenedor dentro del Shadow DOM
  const root = createRoot(reactRootContainer);

  // 7.1 Modificamos la función addEventListener de body para que los eventos se propaguen correctamente dentro del Shadow DOM
  document.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    reactRootContainer.addEventListener(type, listener, options);
  };

  console.log("Vite enviroment: ", import.meta.env.VITE_MODE || "not developtment");

  // 8. Renderizamos la aplicación
  root.render(
    <StrictMode>
      {/*
       * 9. Indicamos a StyleSheetManager que inyecte los estilos dentro del Shadow Root en lugar del <head> del documento principal.
       */}
      <StyleSheetManager target={shadowRoot}>
        <RootProvider root={reactRootContainer}>
          <HashRouter>
            <ErrorBoundaryWithNavigate>
              <AppThemeProvider theme={integrationsTheme}>
                <IntegrationProvider>
                  <App />
                </IntegrationProvider>
              </AppThemeProvider>
            </ErrorBoundaryWithNavigate>
          </HashRouter>
        </RootProvider>
      </StyleSheetManager>
    </StrictMode>
  );
} else {
  console.error(
    "No se pudo encontrar el elemento #root para montar la aplicación."
  );
}
