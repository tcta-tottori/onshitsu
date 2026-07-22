// ① ヒーロー：今夜ウィンドウの気温・湿度の上下限を大きく表示。
import { Droplets, Thermometer } from 'lucide-react'
import type { NightSeries } from '../lib/derive'
import type { AmedasNow } from '../api/jma'

function fmtDateRange(startDate: string): string {
  // "2026-07-22" → "7月22日(火)"
  const [y, m, d] = startDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const dow = ['日', '月', '火', '水', '木', '金', '土'][dt.getDay()]
  return `${m}月${d}日(${dow})`
}

export default function NightSummary({
  series,
  locationName,
  now,
}: {
  series: NightSeries
  locationName: string
  now?: AmedasNow | null
}) {
  const t = series.temp
  const h = series.humidity

  return (
    <section className="hero" aria-label="今夜のサマリー">
      <div className="hero-head">
        <div>
          <div className="hero-eyebrow">{locationName}</div>
          <h1 className="hero-title">今夜の気温と湿度</h1>
        </div>
        <div className="hero-date">{fmtDateRange(series.window.startDate)}</div>
      </div>

      <div className="hero-metrics">
        <div className="metric temp">
          <div className="metric-head">
            <Thermometer size={16} strokeWidth={2.2} />
            気温
          </div>
          <div className="metric-pair">
            <div className="metric-col">
              <span className="metric-k">最低</span>
              <span className="metric-v">
                {t ? Math.round(t.min) : '—'}
                <small>°</small>
              </span>
            </div>
            <div className="metric-sep" aria-hidden="true" />
            <div className="metric-col">
              <span className="metric-k">最高</span>
              <span className="metric-v hi">
                {t ? Math.round(t.max) : '—'}
                <small>°</small>
              </span>
            </div>
          </div>
        </div>

        <div className="metric humid">
          <div className="metric-head">
            <Droplets size={16} strokeWidth={2.2} />
            湿度
          </div>
          <div className="metric-pair">
            <div className="metric-col">
              <span className="metric-k">最低</span>
              <span className="metric-v">
                {h ? Math.round(h.min) : '—'}
                <small>%</small>
              </span>
            </div>
            <div className="metric-sep" aria-hidden="true" />
            <div className="metric-col">
              <span className="metric-k">最高</span>
              <span className="metric-v hi">
                {h ? Math.round(h.max) : '—'}
                <small>%</small>
              </span>
            </div>
          </div>
        </div>
      </div>

      {now && (now.temp !== null || now.humidity !== null) && (
        <div className="hero-now">
          <span>
            現在の実況{' '}
            {now.temp !== null && (
              <>
                <b>{now.temp.toFixed(1)}°</b> ／{' '}
              </>
            )}
            {now.humidity !== null && <b>{Math.round(now.humidity)}%</b>}
          </span>
        </div>
      )}
    </section>
  )
}
