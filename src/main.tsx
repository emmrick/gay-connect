import { createRoot } from "react-dom/client";
import "./lib/safeStoragePatch";
import { initGlobalErrorCapture } from "./services/errorLogService";
import { initSecurityMonitor } from "./services/securityMonitorService";
import App from "./App.tsx";
import "./index.css";

// Apply persisted visual preferences (accent color, text size, density, chat bg) before React mounts
try {
  const root = document.documentElement;
  const accent = localStorage.getItem('theme_accent');
  const textSize = localStorage.getItem('theme_text_size');
  const density = localStorage.getItem('theme_density');
  const chatBg = localStorage.getItem('theme_chat_bg');
  if (accent) root.setAttribute('data-accent', accent);
  if (textSize) root.setAttribute('data-text-size', textSize);
  if (density) root.setAttribute('data-density', density);
  if (chatBg) root.setAttribute('data-chat-bg', chatBg);
} catch {}

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
