// 自宅（SwitchBot 温湿度計）の現在値カード。タップで履歴ポップアップを開く。
import { useState } from 'react'
import { ChevronRight, Droplets, Home, Thermometer } from 'lucide-react'
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

export default function IndoorCard({ readings }: { readings: SwitchbotReading[] }) {
  const [open, setOpen] = useState(false)
  if (readings.length === 0) return null

  const latest = readings[readings.length - 1]
  const nowSec = Math.floor(Date.now() / 1000)

  return (
    <>
      <button
        className="card indoor"
        onClick={() => setOpen(true)}
        aria-label="自宅の気温・湿度。タップで履歴を表示"
      >
        <div className="indoor-head">
          <span className="indoor-ic">
            <Home size={16} strokeWidth={2.2} />
          </span>
          <span className="indoor-title">自宅の今</span>
          <span className="indoor-ago">{ago(latest.t, nowSec)}</span>
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

        <div className="indoor-foot">タップで過去の推移を見る</div>
      </button>

      {open && <IndoorDetail readings={readings} onClose={() => setOpen(false)} />}
    </>
  )
}
