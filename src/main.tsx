import { createRoot } from "react-dom/client";
import "./lib/safeStoragePatch";
import { initGlobalErrorCapture } from "./services/errorLogService";
import { initSecurityMonitor } from "./services/securityMonitorService";
import App from "./App.tsx";
import "./index.css";

// Start capturing errors immediately
initGlobalErrorCapture();

// Start security monitoring (XSS, SQLi, brute force, DDoS detection)
initSecurityMonitor();

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker asynchronously to avoid render-blocking
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
