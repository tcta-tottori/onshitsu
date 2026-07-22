// ① ヒーロー：横スワイプで今日/明日/明後日の「夜（19〜翌6時）」サマリー。
// 各カード：バッジ・日付/曜日・大きい天気アイコン＋重ねた天気ラベル、
// 気温/湿度の high(大)/low(小)＋前夜との差。
import { useRef, useState } from 'react'
import { Droplets, Thermometer } from 'lucide-react'
import { weatherFromCode } from '../lib/weatherCode'
import type { NightCard } from '../lib/derive'

const DOW = ['日', '月', '火', '水', '木', '金', '土']
const BADGES = ['TODAY', '明日', '明後日']

function round(v: number | null): string {
  return v === null ? '—' : String(Math.round(v))
}
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
      <span className="metric-sep" aria-hidden="true" />
      <div className="mcol lo">
        <span className="mk">low</span>
        <span className="mv lo">
          {round(lo)}
          <small>{unit}</small>
        </span>
        <DiffTag v={loDiff} unit={unit} />
      </div>
    </div>
  )
}

function HeroCard({ card, rel }: { card: NightCard; rel: number }) {
  const { Icon, label } = weatherFromCode(card.weatherCode)
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
          <Icon size={60} strokeWidth={1.5} aria-hidden="true" />
          <span className="wx-label">{label}</span>
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
            hi={card.tempHigh}
            lo={card.tempLow}
            hiDiff={card.tempHighDiff}
            loDiff={card.tempLowDiff}
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
            hi={card.humHigh}
            lo={card.humLow}
            hiDiff={card.humHighDiff}
            loDiff={card.humLowDiff}
            unit="%"
          />
        </div>
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
