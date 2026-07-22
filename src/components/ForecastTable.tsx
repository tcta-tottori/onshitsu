// ③ 明日以降テーブル：各行は「夜（19〜翌6時）」の気温・湿度（同サイズ＋区切り線）と
// 天気アイコン（右）。スクロールで浮かび上がり（Reveal）、数字はカウントアップ。
import { weatherFromCode } from '../lib/weatherCode'
import type { NightForecastRow } from '../lib/derive'
import CountUp from './CountUp'
import WeatherIcon from './WeatherIcon'
import Reveal from './Reveal'

const DOW = ['日', '月', '火', '水', '木', '金', '土']

function Metric({
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
    <div className={`fg ${kind}`}>
      <span className="fg-hi">
        <CountUp value={hi} />
        <small>{unit}</small>
      </span>
      <span className="fg-sep" aria-hidden="true" />
      <span className="fg-lo">
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

              <div className="frow-metrics2">
                <Metric kind="temp" hi={r.tempHigh} lo={r.tempLow} unit="°" />
                <Metric kind="humid" hi={r.humHigh} lo={r.humLow} unit="%" />
              </div>

              <div className="frow-wx" title={label}>
                <WeatherIcon code={r.weatherCode} size={30} strokeWidth={1.7} />
              </div>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}
