// 自宅（SwitchBot）の温湿度の履歴グラフ。気温(左軸・暖色) × 湿度(右軸・寒色)。
// 夜間グラフ（NightChart）と配色を合わせつつ、横軸は「時刻の経過」なので time 軸で描く。
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'
import type { SwitchbotReading } from '../api/switchbot'

const TEMP = '#f6a83e'
const HUMID = '#7fd3ef'
const GRID = 'rgba(255,255,255,0.05)'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 経過時間の長さに応じて横軸ラベルの粒度を変える。 */
function makeTickFmt(spanSec: number): (t: number) => string {
  const hours = spanSec / 3600
  return (t: number) => {
    const d = new Date(t * 1000)
    if (hours <= 36) return `${d.getHours()}時`
    return `${d.getMonth() + 1}/${d.getDate()}`
  }
}

function niceTicks(readings: SwitchbotReading[], count = 5): number[] {
  if (readings.length === 0) return []
  const first = readings[0].t
  const last = readings[readings.length - 1].t
  if (last === first) return [first]
  return Array.from({ length: count }, (_, i) => first + ((last - first) * i) / (count - 1))
}

function fourTicks(lo: number, hi: number): number[] {
  return [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3)
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload as SwitchbotReading
  const d = new Date(p.t * 1000)
  return (
    <div className="wx-tooltip">
      <div className="tt-time">
        {d.getMonth() + 1}/{d.getDate()} {d.getHours()}:{pad(d.getMinutes())}
      </div>
      <div className="tt-row temp">気温 {p.temp !== null ? `${p.temp.toFixed(1)}°` : '—'}</div>
      <div className="tt-row humid">湿度 {p.hum !== null ? `${Math.round(p.hum)}%` : '—'}</div>
    </div>
  )
}

export default function IndoorHistoryChart({ readings }: { readings: SwitchbotReading[] }) {
  if (readings.length < 2) {
    return <div className="indoor-chart-empty">この範囲の記録がまだありません</div>
  }

  const temps = readings.map((r) => r.temp).filter((v): v is number => v !== null)
  const hums = readings.map((r) => r.hum).filter((v): v is number => v !== null)
  const tLo = temps.length ? Math.floor(Math.min(...temps) - 1) : 0
  const tHi = temps.length ? Math.ceil(Math.max(...temps) + 1) : 10
  const hLo = hums.length ? Math.max(0, Math.floor((Math.min(...hums) - 5) / 5) * 5) : 0
  const hHi = hums.length ? Math.min(100, Math.ceil((Math.max(...hums) + 5) / 5) * 5) : 100

  const first = readings[0].t
  const last = readings[readings.length - 1].t
  const tickFmt = makeTickFmt(last - first)
  const xTicks = niceTicks(readings)

  return (
    <section className="nchart nchart-compact" aria-label="自宅の気温・湿度の履歴">
      <ResponsiveContainer width="100%" height={188}>
        <ComposedChart data={readings} margin={{ top: 8, right: 4, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="inTempFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEMP} stopOpacity={0.32} />
              <stop offset="100%" stopColor={TEMP} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="inHumidFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={HUMID} stopOpacity={0.26} />
              <stop offset="100%" stopColor={HUMID} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={GRID} vertical={false} syncWithTicks />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            ticks={xTicks}
            tickFormatter={tickFmt}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            tick={{ fill: '#93a1bd', fontSize: 11, fontWeight: 700 }}
            height={22}
          />
          <YAxis
            yAxisId="temp"
            orientation="left"
            domain={[tLo, tHi]}
            ticks={fourTicks(tLo, tHi)}
            interval={0}
            tickFormatter={(v: number) => `${Math.round(v)}°`}
            tick={{ fill: TEMP, fontSize: 11, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            width={34}
          />
          <YAxis
            yAxisId="humid"
            orientation="right"
            domain={[hLo, hHi]}
            ticks={fourTicks(hLo, hHi)}
            interval={0}
            tickFormatter={(v: number) => `${Math.round(v)}%`}
            tick={{ fill: HUMID, fontSize: 11, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            width={38}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#93a1bd', strokeDasharray: '3 3' }} />

          <Area
            yAxisId="humid"
            type="monotone"
            dataKey="hum"
            stroke="none"
            fill="url(#inHumidFill)"
            isAnimationActive={false}
            connectNulls
          />
          <Area
            yAxisId="temp"
            type="monotone"
            dataKey="temp"
            stroke="none"
            fill="url(#inTempFill)"
            isAnimationActive={false}
            connectNulls
          />
          <Line
            yAxisId="humid"
            type="monotone"
            dataKey="hum"
            stroke={HUMID}
            strokeWidth={2.4}
            strokeLinecap="round"
            dot={false}
            activeDot={{ r: 4, fill: HUMID, stroke: '#0a1120', strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temp"
            stroke={TEMP}
            strokeWidth={2.4}
            strokeLinecap="round"
            dot={false}
            activeDot={{ r: 4, fill: TEMP, stroke: '#0a1120', strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  )
}
