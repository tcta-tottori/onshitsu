// 自宅（SwitchBot）カードをタップしたときの履歴ポップアップ。
// 期間（24時間 / 3日 / 7日 / 全期間）を切り替えて、気温・湿度の推移グラフと
// その期間の最高/最低、直近の記録一覧を表示する。
import { useEffect, useMemo, useState } from 'react'
import { Droplets, Thermometer, X } from 'lucide-react'
import type { SwitchbotReading } from '../api/switchbot'
import IndoorHistoryChart from './IndoorHistoryChart'

type RangeKey = '24h' | '3d' | '7d' | 'all'
const RANGES: Array<{ key: RangeKey; label: string; sec: number | null }> = [
  { key: '24h', label: '24時間', sec: 24 * 3600 },
  { key: '3d', label: '3日', sec: 3 * 86400 },
  { key: '7d', label: '7日', sec: 7 * 86400 },
  { key: 'all', label: '全期間', sec: null },
]

function minMax(vals: Array<number | null>): { min: number; max: number } | null {
  const xs = vals.filter((v): v is number => v !== null)
  if (xs.length === 0) return null
  return { min: Math.min(...xs), max: Math.max(...xs) }
}

function fmtClock(t: number): string {
  const d = new Date(t * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${p(d.getMinutes())}`
}

export default function IndoorDetail({
  readings,
  onClose,
}: {
  readings: SwitchbotReading[]
  onClose: () => void
}) {
  const [range, setRange] = useState<RangeKey>('24h')

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const latest = readings[readings.length - 1]

  const filtered = useMemo(() => {
    const r = RANGES.find((x) => x.key === range)
    if (!r || r.sec === null || readings.length === 0) return readings
    const from = latest.t - r.sec
    return readings.filter((x) => x.t >= from)
  }, [readings, range, latest])

  const tMM = minMax(filtered.map((r) => r.temp))
  const hMM = minMax(filtered.map((r) => r.hum))
  const recent = filtered.slice(-12).reverse()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="自宅の気温・湿度の履歴"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title">
            <span className="modal-date">自宅の記録</span>
            <span className="modal-sub">
              最新 {fmtClock(latest.t)}・SwitchBot
            </span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="閉じる">
            <X size={20} strokeWidth={2.4} />
          </button>
        </div>

        <div className="range-tabs" role="tablist" aria-label="期間">
          {RANGES.map((r) => (
            <button
              key={r.key}
              role="tab"
              aria-selected={range === r.key}
              className={`range-tab${range === r.key ? ' on' : ''}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="modal-summary">
          <div className="ms-item temp">
            <Thermometer size={16} strokeWidth={2.2} />
            <span className="ms-hi">{tMM ? Math.round(tMM.max) : '—'}°</span>
            <span className="ms-slash">/</span>
            <span className="ms-lo">{tMM ? Math.round(tMM.min) : '—'}°</span>
          </div>
          <div className="ms-item humid">
            <Droplets size={16} strokeWidth={2.2} />
            <span className="ms-hi">{hMM ? Math.round(hMM.max) : '—'}%</span>
            <span className="ms-slash">/</span>
            <span className="ms-lo">{hMM ? Math.round(hMM.min) : '—'}%</span>
          </div>
        </div>

        <IndoorHistoryChart readings={filtered} />

        <div className="modal-hours">
          <div className="mh-row mh-head in-row">
            <span className="mh-time">時刻</span>
            <span className="mh-t">気温</span>
            <span className="mh-h">湿度</span>
          </div>
          {recent.map((p) => (
            <div className="mh-row in-row" key={p.t}>
              <span className="mh-time">{fmtClock(p.t)}</span>
              <span className="mh-t">{p.temp === null ? '—' : `${p.temp.toFixed(1)}°`}</span>
              <span className="mh-h">{p.hum === null ? '—' : `${Math.round(p.hum)}%`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
