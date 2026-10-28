// Service worker mínimo de Nappy.
// No cachea nada (así no quedan versiones viejas de la app): sirve para poder mostrar
// notificaciones en Android, donde `new Notification()` no funciona, y para instalar la app.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Pasa todo a la red tal cual; algunas versiones de Chrome lo piden para ofrecer "Instalar".
self.addEventListener('fetch', () => {});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if ('focus' in w) return w.focus();
      }
      return self.clients.openWindow(self.registration.scope);
    })
  );
});
