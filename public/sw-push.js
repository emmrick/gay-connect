// Service Worker for Push Notifications
// This file handles push notifications when the app is in background or closed

// Install event - activate immediately
self.addEventListener('install', function(event) {
  console.log('[SW-Push] Installing...');
  self.skipWaiting();
});

// Activate event - claim clients immediately
self.addEventListener('activate', function(event) {
  console.log('[SW-Push] Activating...');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', function(event) {
  console.log('[SW-Push] Push notification received', event);
  
  let data = {
    title: 'GayConnect',
    body: 'Nouvelle notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'default',
    data: { url: '/' }
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      console.log('[SW-Push] Payload:', payload);
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || Date.now().toString(),
        data: { url: payload.url || '/' }
      };
    }
  } catch (e) {
    console.error('[SW-Push] Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    renotify: true,
    requireInteraction: true, // Keep notification visible until user interacts
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ],
    // Silent push should still show notification
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('[SW-Push] Notification shown successfully'))
      .catch(err => console.error('[SW-Push] Error showing notification:', err))
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[SW-Push] Notification click received', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        console.log('[SW-Push] Found', clientList.length, 'windows');
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('[SW-Push] Focusing existing window');
            client.focus();
            if (urlToOpen !== '/') {
              client.navigate(urlToOpen);
            }
            return;
          }
        }
        // Open new window if none exists
        console.log('[SW-Push] Opening new window:', urlToOpen);
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle subscription change (e.g., expired subscription)
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[SW-Push] Push subscription changed', event);
  // The subscription expired, would need to resubscribe here
});
