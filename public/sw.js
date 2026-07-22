/* ONSHITSU 通知用の最小 Service Worker。
   キャッシュはせず、通知の表示（showNotification）とクリック時のフォーカスのみ担当する。
   （モバイル Chrome では new Notification() が使えず SW 経由が必須のため） */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/onshitsu/')
      return undefined
    }),
  )
})
