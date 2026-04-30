import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('loading')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
      if (!reg) { setState('unsubscribed'); return }
      reg.pushManager.getSubscription().then(sub => {
        setState(sub ? 'subscribed' : 'unsubscribed')
      })
    })
  }, [])

  const subscribe = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) return false
    setState('loading')
    try {
      // Register SW
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      // Get VAPID public key
      const res = await fetch(`${API}/api/push/vapid-key`)
      const { publicKey } = await res.json()

      // Subscribe
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // Save to backend
      const token = localStorage.getItem('treedoo_token')
      await fetch(`${API}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(sub.toJSON()),
      })

      setState('subscribed')
      return true
    } catch (e) {
      console.error('Push subscribe error:', e)
      setState(Notification.permission === 'denied' ? 'denied' : 'unsubscribed')
      return false
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js')
    if (!reg) return false
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return false
    const endpoint = sub.endpoint
    await sub.unsubscribe()
    const token = localStorage.getItem('treedoo_token')
    await fetch(`${API}/api/push/subscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {})
    setState('unsubscribed')
    return true
  }

  return { state, subscribe, unsubscribe }
}
