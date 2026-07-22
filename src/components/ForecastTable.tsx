// ③ 明日以降テーブル：日付／気温・湿度（横並び・最高大・最低小）／天気アイコン(右)。
// 降水確率は廃止。
import { weatherFromCode } from '../lib/weatherCode'
import type { DailyRow } from '../lib/derive'

const DOW = ['日', '月', '火', '水', '木', '金', '土']

function round(v: number | null): string {
  return v === null ? '—' : String(Math.round(v))
}

/** 最高(大)/最低(小) の縦積み */
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
        {round(hi)}
        <small>{unit}</small>
      </span>
      <span className="fg-lo">
        {round(lo)}
        {unit}
      </span>
    </div>
  )
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
              <span className={`frow-dow${dow === 6 ? ' sat' : dow === 0 ? ' sun' : ''}`}>
                {DOW[dow]}
              </span>
            </div>

            <div className="frow-metrics2">
              <Metric kind="temp" hi={r.tempMax} lo={r.tempMin} unit="°" />
              <Metric kind="humid" hi={r.humidityMax} lo={r.humidityMin} unit="%" />
            </div>

            <div className="frow-wx" title={label}>
              <Icon size={30} strokeWidth={1.7} aria-hidden="true" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
