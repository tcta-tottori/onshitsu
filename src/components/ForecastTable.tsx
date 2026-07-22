// ③ 明日以降テーブル：daily を 1日1行で。気温上下限・湿度上下限（hourly集計）・
// 天候・降水確率を並べる。
import { Droplets, Thermometer, Umbrella } from 'lucide-react'
import { weatherFromCode } from '../lib/weatherCode'
import type { DailyRow } from '../lib/derive'

const DOW = ['日', '月', '火', '水', '木', '金', '土']

function round(v: number | null): string {
  return v === null ? '—' : String(Math.round(v))
}

export default function ForecastTable({ rows }: { rows: DailyRow[] }) {
  if (!rows.length) {
    return (
      <div className="card">
        <p className="muted" style={{ margin: 0, textAlign: 'center' }}>
          明日以降の予報がありません。
        </p>
      </div>
    )
  }

  return (
    <div className="forecast-list">
      {rows.map((r) => {
        const dow = r.dateObj.getDay()
        const { Icon, label } = weatherFromCode(r.weatherCode)
        return (
          <div className="frow" key={r.date}>
            <div className="frow-date">
              <span className="frow-day">{r.dateObj.getDate()}</span>
              <span
                className={`frow-dow${dow === 6 ? ' sat' : dow === 0 ? ' sun' : ''}`}
              >
                {DOW[dow]}
              </span>
            </div>

            <div className="frow-wx" title={label}>
              <Icon size={26} strokeWidth={1.8} aria-hidden="true" />
              <span className="wx-label">{label}</span>
            </div>

            <div className="frow-metrics">
              <div className="mrow temp">
                <span className="mk">
                  <Thermometer size={13} strokeWidth={2.2} />
                </span>
                <span className="mv-lo">{round(r.tempMin)}°</span>
                <span className="dash">/</span>
                <span className="mv-hi">{round(r.tempMax)}°</span>
              </div>
              <div className="mrow humid">
                <span className="mk">
                  <Droplets size={13} strokeWidth={2.2} />
                </span>
                <span className="mv-lo">{round(r.humidityMin)}%</span>
                <span className="dash">/</span>
                <span className="mv-hi">{round(r.humidityMax)}%</span>
              </div>
            </div>

            <div className="frow-pop" title="降水確率">
              <Umbrella size={13} strokeWidth={2.2} aria-hidden="true" />
              <span className="pop-v">{r.pop === null ? '—' : `${Math.round(r.pop)}`}</span>
              <span className="pop-k">%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
