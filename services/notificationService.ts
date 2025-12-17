
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn("Este navegador não suporta notificações.");
    return 'denied';
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    const permission = await Notification.requestPermission();
    console.log("Permissão para notificações:", permission);
    return permission;
  } catch (error) {
    console.error("Erro ao solicitar permissão de notificação:", error);
    return 'denied';
  }
};

interface ShowNotificationOptions {
  body: string;
  icon?: string;
  url?: string; // URL to navigate to when clicked
  tag?: string; // A unique ID for the notification to replace previous ones
}

export const showNotification = (title: string, options: ShowNotificationOptions) => {
  if (Notification.permission === 'granted') {
    // Fix: The `vibrate` property is not a standard option for the Notification constructor.
    // It is supported by ServiceWorkerRegistration.showNotification(), but not Notification directly.
    const notificationOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/icon-192x192.png', // Default icon, assuming it exists in public/
      badge: '/badge-72x72.png', // Optional badge, assuming it exists in public/
      tag: options.tag,
      data: {
        url: options.url || '/',
      }
    };
    const notification = new Notification(title, notificationOptions);

    // Handle click in the main thread for directly created notifications
    // (Service Worker handles clicks for actual push messages)
    notification.onclick = (event) => {
      event.preventDefault(); // Prevent default browser behavior
      if (options.url) {
        // Bring the browser window to front if possible
        window.focus();
        // Navigate within the existing window or open a new one
        window.location.href = options.url;
      }
      notification.close();
    };
  } else {
    console.warn("Permissão de notificação não concedida.");
  }
};