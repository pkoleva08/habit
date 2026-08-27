const POLL_INTERVAL = 10000;

let notificationInterval = null;
let knownNotificationIds = new Set();

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();

  return permission === 'granted';
}

export function showBrowserNotification(title, message) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification(title, {
    body: message,
    icon: '/favicon.ico',
    tag: 'habitly-notification',
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

async function fetchNotifications(userId) {
  try {
    const response = await fetch(
      `/api/notifications/${userId}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch notifications: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

async function checkForNewNotifications(userId) {
  if (!userId) {
    return;
  }

  const notifications = await fetchNotifications(userId);

  if (!Array.isArray(notifications)) {
    return;
  }

  const unreadNotifications = notifications.filter(
    (notification) => !notification.is_read
  );

  for (const notification of unreadNotifications) {
    if (!knownNotificationIds.has(notification.id)) {
      showBrowserNotification(
        'Habitly',
        notification.message
      );

      knownNotificationIds.add(notification.id);
    }
  }
}

export async function startBrowserNotifications(userId) {
  if (!userId) {
    console.warn('No user ID provided.');
    return;
  }

  const permissionGranted =
    await requestNotificationPermission();

  if (!permissionGranted) {
    console.warn('Browser notification permission was not granted.');
    return;
  }

  const initialNotifications =
    await fetchNotifications(userId);

  if (Array.isArray(initialNotifications)) {
    initialNotifications.forEach((notification) => {
      knownNotificationIds.add(notification.id);
    });
  }

  await checkForNewNotifications(userId);

  if (notificationInterval) {
    clearInterval(notificationInterval);
  }

  notificationInterval = setInterval(() => {
    checkForNewNotifications(userId);
  }, POLL_INTERVAL);
}

export function stopBrowserNotifications() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }

  knownNotificationIds.clear();
}