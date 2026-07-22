// ③ 明日以降テーブル：各行は 日付 ／ 気温・湿度(アイコン付き1行) ／ 天気アイコン(右端)。
// タップでその夜の詳細ポップアップを開く。
import { useState } from 'react'
import { Droplets, Thermometer } from 'lucide-react'
import { weatherFromCode } from '../lib/weatherCode'
import type { NightForecastRow } from '../lib/derive'
import CountUp from './CountUp'
import WeatherIcon from './WeatherIcon'
import Reveal from './Reveal'
import ForecastDetail from './ForecastDetail'

const DOW = ['日', '月', '火', '水', '木', '金', '土']

/** 気温 or 湿度の high/low（アイコン付き・1グループ） */
function Group({
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
    <span className={`fg ${kind}`}>
      <span className="fg-ic">
        {kind === 'temp' ? (
          <Thermometer size={15} strokeWidth={2.2} />
        ) : (
          <Droplets size={15} strokeWidth={2.2} />
        )}
      </span>
      <span className="fg-hi">
        <CountUp value={hi} />
        <small>{unit}</small>
      </span>
      <span className="fg-sep" aria-hidden="true" />
      <span className="fg-lo">
        <CountUp value={lo} />
        <small>{unit}</small>
      </span>
    </span>
  )
}

export default function ForecastTable({ rows }: { rows: NightForecastRow[] }) {
  const [selected, setSelected] = useState<NightForecastRow | null>(null)

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
            <button
              className="frow"
              onClick={() => setSelected(r)}
              aria-label={`${r.dateObj.getMonth() + 1}月${r.dateObj.getDate()}日の夜の詳細を見る`}
            >
              <div className="frow-date">
                <span className="frow-day">{r.dateObj.getDate()}</span>
                <span className={`frow-dow${dow === 6 ? ' sat' : dow === 0 ? ' sun' : ''}`}>
                  {DOW[dow]}
                </span>
              </div>

              <div className="frow-metrics">
                <Group kind="temp" hi={r.tempHigh} lo={r.tempLow} unit="°" />
                <Group kind="humid" hi={r.humHigh} lo={r.humLow} unit="%" />
              </div>

              <div className="frow-wx" title={label}>
                <WeatherIcon code={r.weatherCode} size={30} strokeWidth={1.7} />
              </div>
            </button>
          </Reveal>
        )
      })}
      {selected && <ForecastDetail row={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
