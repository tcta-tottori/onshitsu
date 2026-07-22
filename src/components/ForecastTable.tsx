// ③ 明日以降テーブル：各行は 日付＋天気アイコン ／ 気温・湿度を2行（アイコン付き）／
// 右側にその夜のミニ推移グラフ。数値はカウントアップ、スクロールで浮かび上がる。
import { Droplets, Thermometer } from 'lucide-react'
import { weatherFromCode } from '../lib/weatherCode'
import type { NightForecastRow } from '../lib/derive'
import CountUp from './CountUp'
import WeatherIcon from './WeatherIcon'
import MiniTrend from './MiniTrend'
import Reveal from './Reveal'

const DOW = ['日', '月', '火', '水', '木', '金', '土']

/** アイコン付き1行（気温 or 湿度）：high | 区切り線 | low */
function Line({
  kind,
  hi,
  lo,
  unit,
}: {
  kind: 'temp' | 'humid'
  hi: number | null
  lo: number | null
  unit: string
}) {
  return (
    <div className={`fline ${kind}`}>
      <span className="fl-ic">
        {kind === 'temp' ? (
          <Thermometer size={15} strokeWidth={2.2} />
        ) : (
          <Droplets size={15} strokeWidth={2.2} />
        )}
      </span>
      <span className="fl-hi">
        <CountUp value={hi} />
        <small>{unit}</small>
      </span>
      <span className="fl-sep" aria-hidden="true" />
      <span className="fl-lo">
        <CountUp value={lo} />
        <small>{unit}</small>
      </span>
    </div>
  )
}

export default function ForecastTable({ rows }: { rows: NightForecastRow[] }) {
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
      {rows.map((r, i) => {
        const dow = r.dateObj.getDay()
        const { label } = weatherFromCode(r.weatherCode)
        return (
          <Reveal key={i} delay={Math.min(i, 4) * 60}>
            <div className="frow">
              <div className="frow-date">
                <span className="frow-day">{r.dateObj.getDate()}</span>
                <span className={`frow-dow${dow === 6 ? ' sat' : dow === 0 ? ' sun' : ''}`}>
                  {DOW[dow]}
                </span>
              </div>

              <div className="frow-wx" title={label}>
                <WeatherIcon code={r.weatherCode} size={28} strokeWidth={1.7} />
              </div>

              <div className="frow-lines">
                <Line kind="temp" hi={r.tempHigh} lo={r.tempLow} unit="°" />
                <Line kind="humid" hi={r.humHigh} lo={r.humLow} unit="%" />
              </div>

              <div className="frow-mini" aria-hidden="true">
                <MiniTrend temps={r.temps} hums={r.hums} />
              </div>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}
