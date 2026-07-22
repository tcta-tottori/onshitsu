// 17時に「今夜の気温・湿度・天気」を通知する機能。
// バックエンドの無い静的PWAのため、アプリを開いている間だけ動作する best-effort 実装。
// 毎分チェックし、17時台で当日未通知なら通知する。モバイル対応のため Service Worker
// の showNotification を優先し、無ければ new Notification() にフォールバックする。

const ICON = `${import.meta.env.BASE_URL}pwa-192.png`
const LAST_KEY = 'os-notify-last' // 最後に通知した日付（重複防止）
const ON_KEY = 'os-notify-on' // ユーザーのON/OFF設定

export type Perm = 'default' | 'granted' | 'denied' | 'unsupported'

export function notifySupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getPermission(): Perm {
  if (!notifySupported()) return 'unsupported'
  return Notification.permission as Perm
}

export async function requestPermission(): Promise<Perm> {
  if (!notifySupported()) return 'unsupported'
  try {
    return (await Notification.requestPermission()) as Perm
  } catch {
    return getPermission()
  }
}

export function isNotifyEnabled(): boolean {
  try {
    return localStorage.getItem(ON_KEY) === '1' && getPermission() === 'granted'
  } catch {
    return false
  }
}

export function setNotifyEnabled(on: boolean): void {
  try {
    localStorage.setItem(ON_KEY, on ? '1' : '0')
  } catch {
    /* localStorage 不可環境は無視 */
  }
}

export interface NightNotifyData {
  locationName: string
  tempHigh: number | null
  tempLow: number | null
  humHigh: number | null
  humLow: number | null
  weatherLabel: string
}

function r(v: number | null): string {
  return v === null ? '—' : String(Math.round(v))
}

export function formatNightBody(d: NightNotifyData): string {
  const parts: string[] = []
  if (d.weatherLabel && d.weatherLabel !== '—') parts.push(d.weatherLabel)
  if (d.tempLow !== null || d.tempHigh !== null) parts.push(`気温 ${r(d.tempLow)}〜${r(d.tempHigh)}°`)
  if (d.humLow !== null || d.humHigh !== null) parts.push(`湿度 ${r(d.humLow)}〜${r(d.humHigh)}%`)
  return `${d.locationName}の今夜　${parts.join(' / ')}`
}

/** 通知を表示（SW 優先・失敗時は new Notification）。権限が無ければ何もしない。 */
export async function showNotification(title: string, body: string): Promise<void> {
  if (getPermission() !== 'granted') return
  const opts: NotificationOptions = {
    body,
    icon: ICON,
    badge: ICON,
    tag: 'onshitsu-night',
  }
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, opts)
        return
      }
    }
    new Notification(title, opts)
  } catch {
    /* new Notification 非対応＆SW無しの環境では通知不可 */
  }
}

function todayKey(now = new Date()): string {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

/**
 * 毎分チェックし、17時台で当日未通知なら今夜の予報を通知する。
 * getData は最新の今夜サマリーを返す（データ未取得なら null）。
 * 返り値でスケジュールを停止できる。
 */
export function scheduleNightNotify(getData: () => NightNotifyData | null): () => void {
  function tick() {
    try {
      const now = new Date()
      if (now.getHours() !== 17) return
      if (getPermission() !== 'granted') return
      const key = todayKey(now)
      if (localStorage.getItem(LAST_KEY) === key) return
      const d = getData()
      if (!d) return
      localStorage.setItem(LAST_KEY, key)
      void showNotification('🌙 今夜の気温・湿度', formatNightBody(d))
    } catch {
      /* ignore */
    }
  }
  const iv = window.setInterval(tick, 60_000)
  tick() // 開いた直後（17時台なら即通知）
  return () => window.clearInterval(iv)
}
