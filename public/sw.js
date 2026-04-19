// Service Worker minimal — installation/activation immédiate, pas de cache.
// Présent uniquement pour éviter les 404 sur /sw.js et permettre la PWA
// d'être détectée comme installable.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Pas d'interception fetch : on laisse le réseau gérer (évite les bugs
// de cache stale après mise à jour du site).
