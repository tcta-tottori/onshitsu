// ③ 明日以降テーブル：各行は 日付 ／ 気温・湿度(アイコン付き2行) ／ ミニ推移グラフ ／
// 天気アイコン(右端)。タップでその夜の詳細ポップアップを開く。
import { useState } from 'react'
import { Droplets, Thermometer } from 'lucide-react'
import { weatherFromCode } from '../lib/weatherCode'
import type { NightForecastRow } from '../lib/derive'
import CountUp from './CountUp'
import WeatherIcon from './WeatherIcon'
import MiniTrend from './MiniTrend'
import Reveal from './Reveal'
import ForecastDetail from './ForecastDetail'

const DOW = ['日', '月', '火', '水', '木', '金', '土']

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

              <div className="frow-lines">
                <span className="fl-ic temp">
                  <Thermometer size={15} strokeWidth={2.2} />
                </span>
                <span className="fl-hi temp">
                  <CountUp value={r.tempHigh} />
                  <small>°</small>
                </span>
                <span className="fl-sep" aria-hidden="true" />
                <span className="fl-lo">
                  <CountUp value={r.tempLow} />
                  <small>°</small>
                </span>

                <span className="fl-ic humid">
                  <Droplets size={15} strokeWidth={2.2} />
                </span>
                <span className="fl-hi humid">
                  <CountUp value={r.humHigh} />
                  <small>%</small>
                </span>
                <span className="fl-sep" aria-hidden="true" />
                <span className="fl-lo">
                  <CountUp value={r.humLow} />
                  <small>%</small>
                </span>
              </div>

              <div className="frow-mini" aria-hidden="true">
                <MiniTrend temps={r.temps} hums={r.hums} />
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
