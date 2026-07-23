// 自宅（SwitchBot 温湿度計）の現在値カード。タップで履歴ポップアップを開く。
// 「更新」ボタンで、その場で最新値を取得・記録する（中継 Worker 経由）。
import { type MouseEvent, useState } from 'react'
import { ChevronRight, Droplets, Home, RefreshCw, Thermometer } from 'lucide-react'
import type { SwitchbotReading } from '../api/switchbot'
import IndoorDetail from './IndoorDetail'

/** 経過時間を「◯分前 / ◯時間前」などに。 */
function ago(t: number, now: number): string {
  const s = Math.max(0, now - t)
  if (s < 90) return 'たった今'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}分前`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}時間前`
  return `${Math.round(h / 24)}日前`
}

export default function IndoorCard({
  readings,
  onRefresh,
}: {
  readings: SwitchbotReading[]
  onRefresh?: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  if (readings.length === 0) return null

  const latest = readings[readings.length - 1]
  const nowSec = Math.floor(Date.now() / 1000)

  async function handleRefresh(e: MouseEvent) {
    e.stopPropagation()
    if (refreshing || !onRefresh) return
    setRefreshing(true)
    try {
      await onRefresh()
    } catch {
      /* 取得失敗時は無視（表示は保持） */
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      <div
        className="card indoor"
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        aria-label="リビングの気温・湿度。タップで履歴を表示"
      >
        <img
          className="indoor-brand"
          src={`${import.meta.env.BASE_URL}switchbot.png`}
          alt="SwitchBot"
          aria-hidden="true"
        />

        <div className="indoor-head">
          <span className="indoor-ic">
            <Home size={16} strokeWidth={2.2} />
          </span>
          <span className="indoor-title">リビング</span>
          <span className="indoor-ago">{ago(latest.t, nowSec)}</span>
          {onRefresh && (
            <button
              type="button"
              className="indoor-refresh"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="最新の値に更新"
            >
              <RefreshCw
                size={13}
                strokeWidth={2.6}
                className={refreshing ? 'spin' : undefined}
              />
              更新
            </button>
          )}
          <ChevronRight className="indoor-chev" size={18} strokeWidth={2.4} />
        </div>

        <div className="indoor-metrics">
          <div className="indoor-metric temp">
            <Thermometer size={20} strokeWidth={2.2} />
            <span className="indoor-v">
              {latest.temp === null ? '—' : latest.temp.toFixed(1)}
              <small>°C</small>
            </span>
          </div>
          <span className="indoor-sep" aria-hidden="true" />
          <div className="indoor-metric humid">
            <Droplets size={20} strokeWidth={2.2} />
            <span className="indoor-v">
              {latest.hum === null ? '—' : Math.round(latest.hum)}
              <small>%</small>
            </span>
          </div>
        </div>
      </div>

      {open && <IndoorDetail readings={readings} onClose={() => setOpen(false)} />}
    </>
  )
}
