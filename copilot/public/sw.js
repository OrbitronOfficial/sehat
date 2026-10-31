/* Sehat Copilot service worker: only used to show dose reminders with action buttons
   (Taken / In 15 min / In 1 hour). It caches nothing and never touches the network. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {}, act = e.action || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const c = list.find(x => /\/app/.test(x.url)) || list[0];
    if (c) {
      if (act) c.postMessage({ sehat: 'dose-action', action: act, pid: d.pid, key: d.key });
      return c.focus();
    }
    // no open tab: open the app and hand the action over in the URL; reminders.js applies it on load
    const q = act ? '?rm_act=' + encodeURIComponent(act) + '&rm_p=' + encodeURIComponent(d.pid || 'self') + '&rm_k=' + encodeURIComponent(d.key || '') : '';
    return self.clients.openWindow('/app' + q);
  }));
});
