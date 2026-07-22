// ① ヒーロー：TODAYバッジ・今日の日付/曜日・天気アイコンと、
// 気温・湿度の high(大)/low(小)＋昨日との差を表示。
import { Droplets, Thermometer } from 'lucide-react'
import { weatherFromCode } from '../lib/weatherCode'
import type { TodaySummary } from '../lib/derive'

const DOW = ['日', '月', '火', '水', '木', '金', '土']

function round(v: number | null): string {
  return v === null ? '—' : String(Math.round(v))
}

/** 昨日差を符号付きで（+2 / -1 / ±0） */
function fmtDiff(v: number | null, unit: string): string | null {
  if (v === null) return null
  if (v > 0) return `+${v}${unit}`
  if (v < 0) return `${v}${unit}`
  return `±0${unit}`
}

function DiffTag({ v, unit }: { v: number | null; unit: string }) {
  const t = fmtDiff(v, unit)
  if (t === null) return null
  const cls = v! > 0 ? 'up' : v! < 0 ? 'down' : 'flat'
  return <span className={`mdiff ${cls}`}>{t}</span>
}

/** high(左・大) / low(右・小) の対 */
function Pair({
  kind,
  hi,
  lo,
  hiDiff,
  loDiff,
  unit,
}: {
  kind: 'temp' | 'humid'
  hi: number | null
  lo: number | null
  hiDiff: number | null
  loDiff: number | null
  unit: string
}) {
  return (
    <div className="metric-pair">
      <div className="mcol hi">
        <span className="mk">high</span>
        <span className={`mv ${kind}`}>
          {round(hi)}
          <small>{unit}</small>
        </span>
        <DiffTag v={hiDiff} unit={unit} />
      </div>
      <div className="mcol lo">
        <span className="mk">low</span>
        <span className="mv">
          {round(lo)}
          <small>{unit}</small>
        </span>
        <DiffTag v={loDiff} unit={unit} />
      </div>
    </div>
  )
}

export default function NightSummary({ today }: { today: TodaySummary }) {
  const { Icon, label } = weatherFromCode(today.weatherCode)
  const dow = today.dateObj.getDay()

  return (
    <section className="hero" aria-label="今日のサマリー">
      <div className="hero-head">
        <div className="hero-tl">
          <span className="today-badge">TODAY</span>
          <div className="hero-date2">
            <span className="hd-date">
              {today.dateObj.getMonth() + 1}月{today.dateObj.getDate()}日
            </span>
            <span className="hd-dow">{DOW[dow]}曜日</span>
          </div>
        </div>
        <div className="hero-wx" title={label}>
          <Icon size={46} strokeWidth={1.6} aria-hidden="true" />
        </div>
      </div>

      <div className="hero-metrics">
        <div className="metric temp">
          <div className="metric-head">
            <Thermometer size={15} strokeWidth={2.2} />
            気温
          </div>
          <Pair
            kind="temp"
            hi={today.tempHigh}
            lo={today.tempLow}
            hiDiff={today.tempHighDiff}
            loDiff={today.tempLowDiff}
            unit="°"
          />
        </div>

        <div className="metric humid">
          <div className="metric-head">
            <Droplets size={15} strokeWidth={2.2} />
            湿度
          </div>
          <Pair
            kind="humid"
            hi={today.humHigh}
            lo={today.humLow}
            hiDiff={today.humHighDiff}
            loDiff={today.humLowDiff}
            unit="%"
          />
        </div>
      </div>
    </section>
  )
}
