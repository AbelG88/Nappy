export const notificationsSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window;

export const notificationPermission = (): NotificationPermission | 'unsupported' =>
  notificationsSupported() ? Notification.permission : 'unsupported';

/** Pide permiso (hay que llamarlo desde un toque del usuario). */
export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
};

const asset = (name: string) => new URL(name, document.baseURI).href;

/**
 * Muestra una notificación. En Android Chrome `new Notification()` no está permitido,
 * así que se usa el service worker; si no hay, se intenta el constructor clásico.
 */
export const notify = async (title: string, body: string, tag?: string): Promise<void> => {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const options: NotificationOptions = { body, icon: asset('icon-192.png'), badge: asset('icon-192.png'), tag };
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
    new Notification(title, options);
  } catch (err) {
    console.warn('No se pudo mostrar la notificación', err);
  }
};
