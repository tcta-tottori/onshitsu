// ① ヒーロー：横スワイプで今日/明日/明後日の「夜（19〜翌6時）」サマリー。
// high/low は色付きバッジ（センター合わせ）＋数字はカウントアップ、前夜との差を下に。
import { useRef, useState, type ReactNode } from 'react'
import { Droplets, Thermometer } from 'lucide-react'
import { weatherFromCode } from '../lib/weatherCode'
import type { NightCard } from '../lib/derive'
import CountUp from './CountUp'
import WeatherIcon from './WeatherIcon'
import NightChart from './NightChart'

const DOW = ['日', '月', '火', '水', '木', '金', '土']
const BADGES = ['今日', '明日', '明後日']

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

function Col({
  label,
  value,
  diff,
  unit,
}: {
  label: string
  value: number | null
  diff: number | null
  unit: string
}) {
  return (
    <div className="mcol">
      <span className="mk">{label}</span>
      <span className="mv">
        <CountUp value={value} />
        <small>{unit}</small>
      </span>
      <DiffTag v={diff} unit={unit} />
    </div>
  )
}

// 枠全体をカラー表示（気温=暖色 / 湿度=寒色）。中は high | 区切り線 | low。
function Metric({
  kind,
  hi,
  lo,
  hiDiff,
  loDiff,
  unit,
  head,
}: {
  kind: 'temp' | 'humid'
  hi: number | null
  lo: number | null
  hiDiff: number | null
  loDiff: number | null
  unit: string
  head: ReactNode
}) {
  return (
    <div className={`metric ${kind}`}>
      <div className="metric-head">{head}</div>
      <div className="metric-pair">
        <Col label="HIGH" value={hi} diff={hiDiff} unit={unit} />
        <span className="metric-sep" aria-hidden="true" />
        <Col label="LOW" value={lo} diff={loDiff} unit={unit} />
      </div>
    </div>
  )
}

function HeroCard({ card, rel }: { card: NightCard; rel: number }) {
  const { label } = weatherFromCode(card.weatherCode)
  const dow = card.dateObj.getDay()
  return (
    <section className="hero" aria-label={`${BADGES[rel] ?? ''}のサマリー`}>
      <div className="hero-head">
        <div className="hero-tl">
          <span className="today-badge">{BADGES[rel] ?? `+${rel}`}</span>
          <div className="hero-date2">
            <span className="hd-date">
              {card.dateObj.getMonth() + 1}月{card.dateObj.getDate()}日
            </span>
            <span className="hd-dow">{DOW[dow]}曜日</span>
          </div>
        </div>
        <div className="hero-wx" title={label}>
          <WeatherIcon code={card.weatherCode} size={58} strokeWidth={1.5} />
          <span className="wx-label">{label}</span>
        </div>
      </div>

      <div className="hero-metrics">
        <Metric
          kind="temp"
          hi={card.tempHigh}
          lo={card.tempLow}
          hiDiff={card.tempHighDiff}
          loDiff={card.tempLowDiff}
          unit="°"
          head={
            <>
              <Thermometer size={21} strokeWidth={2.2} />
              気温
            </>
          }
        />
        <Metric
          kind="humid"
          hi={card.humHigh}
          lo={card.humLow}
          hiDiff={card.humHighDiff}
          loDiff={card.humLowDiff}
          unit="%"
          head={
            <>
              <Droplets size={21} strokeWidth={2.2} />
              湿度
            </>
          }
        />
      </div>

      <div className="hero-chart">
        <div className="hero-chart-head">夜の推移</div>
        <NightChart series={card.series} compact />
      </div>
    </section>
  )
}

export default function NightSummary({ cards }: { cards: NightCard[] }) {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  function onScroll() {
    const el = trackRef.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== active) setActive(i)
  }

  return (
    <div className="hero-swipe">
      <div className="hero-track" ref={trackRef} onScroll={onScroll}>
        {cards.map((c, i) => (
          <HeroCard key={i} card={c} rel={i} />
        ))}
      </div>
      {cards.length > 1 && (
        <div className="hero-dots" aria-hidden="true">
          {cards.map((_, i) => (
            <span key={i} className={`hd-dot${i === active ? ' on' : ''}`} />
          ))}
        </div>
      )}
    </div>
  )
}
