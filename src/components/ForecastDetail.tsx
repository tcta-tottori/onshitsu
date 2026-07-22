// 明日以降の1日をタップしたときの詳細ポップアップ。
// その夜（19〜翌6時）の推移グラフと、毎時（気温・湿度・降水確率・天気）を表示する。
import { useEffect } from 'react'
import { Droplets, Thermometer, Umbrella, X } from 'lucide-react'
import { weatherFromCode } from '../lib/weatherCode'
import type { NightForecastRow } from '../lib/derive'
import NightChart from './NightChart'
import WeatherIcon from './WeatherIcon'

const DOW = ['日', '月', '火', '水', '木', '金', '土']

function round(v: number | null): string {
  return v === null ? '—' : String(Math.round(v))
}

export default function ForecastDetail({
  row,
  onClose,
}: {
  row: NightForecastRow
  onClose: () => void
}) {
  // Esc で閉じる
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const dow = row.dateObj.getDay()
  const { label } = weatherFromCode(row.weatherCode)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${row.dateObj.getMonth() + 1}月${row.dateObj.getDate()}日の夜の詳細`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title">
            <span className="modal-date">
              {row.dateObj.getMonth() + 1}月{row.dateObj.getDate()}日（{DOW[dow]}）
            </span>
            <span className="modal-sub">夜 19時〜翌6時・{label}</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="閉じる">
            <X size={20} strokeWidth={2.4} />
          </button>
        </div>

        <div className="modal-summary">
          <div className="ms-item temp">
            <Thermometer size={16} strokeWidth={2.2} />
            <span className="ms-hi">{round(row.tempHigh)}°</span>
            <span className="ms-slash">/</span>
            <span className="ms-lo">{round(row.tempLow)}°</span>
          </div>
          <div className="ms-item humid">
            <Droplets size={16} strokeWidth={2.2} />
            <span className="ms-hi">{round(row.humHigh)}%</span>
            <span className="ms-slash">/</span>
            <span className="ms-lo">{round(row.humLow)}%</span>
          </div>
        </div>

        <NightChart series={row.series} compact />

        <div className="modal-hours">
          <div className="mh-row mh-head">
            <span className="mh-time">時刻</span>
            <span className="mh-wx">天気</span>
            <span className="mh-t">気温</span>
            <span className="mh-h">湿度</span>
            <span className="mh-p">降水</span>
          </div>
          {row.series.points.map((p) => (
            <div className="mh-row" key={p.idx}>
              <span className="mh-time">{p.hour}時</span>
              <span className="mh-wx">
                <WeatherIcon code={p.weatherCode} size={20} strokeWidth={1.8} />
              </span>
              <span className="mh-t">{p.temp === null ? '—' : `${p.temp.toFixed(1)}°`}</span>
              <span className="mh-h">{p.humidity === null ? '—' : `${Math.round(p.humidity)}%`}</span>
              <span className="mh-p">
                {p.pop === null ? (
                  '—'
                ) : (
                  <>
                    <Umbrella size={11} strokeWidth={2.2} />
                    {Math.round(p.pop)}%
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
