// useNotifications.ts — Browser notification system
import { useCallback, useEffect, useState } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )

  const request = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  const notify = useCallback((title: string, body: string, icon = '/icon-192.png') => {
    if (permission !== 'granted') return
    try {
      new Notification(title, { body, icon, badge: '/icon-192.png' })
    } catch (e) {
      console.warn('Notification failed:', e)
    }
  }, [permission])

  // Schedule a notification at a specific time
  const scheduleAt = useCallback((title: string, body: string, date: Date) => {
    const ms = date.getTime() - Date.now()
    if (ms <= 0) return
    const tid = setTimeout(() => notify(title, body), ms)
    return () => clearTimeout(tid)
  }, [notify])

  return { permission, request, notify, scheduleAt }
}
