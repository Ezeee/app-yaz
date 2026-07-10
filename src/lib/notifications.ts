const APP_NAME = "BiMO";

export function hasNotificationSupport(): boolean {
  return "Notification" in window;
}

export function getPermission(): NotificationPermission {
  if (!hasNotificationSupport()) return "denied";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!hasNotificationSupport()) return "denied";
  return await Notification.requestPermission();
}

export function sendNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (getPermission() !== "granted") return;

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(`${APP_NAME} - ${title}`, {
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        vibrate: [200, 100, 200],
        ...options,
      });
    });
  } else {
    new Notification(`${APP_NAME} - ${title}`, {
      icon: "/favicon.svg",
      ...options,
    });
  }
}

export function scheduleNotification(
  delayMs: number,
  title: string,
  options?: NotificationOptions
): number {
  return window.setTimeout(() => {
    sendNotification(title, options);
  }, delayMs);
}

export function cancelScheduled(id: number): void {
  clearTimeout(id);
}
