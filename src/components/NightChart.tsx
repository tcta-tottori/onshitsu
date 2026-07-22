// ② 夜間グラフ：気温(左軸・暖色) × 湿度(右軸・寒色) の二軸折れ線。
// X軸のカスタム tick に各時刻の天気アイコン(小)と降水確率(小)を埋め込み、
// 本数とアイコンのズレを防ぐ。
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'
import { weatherFromCode } from '../lib/weatherCode'
import type { NightPoint, NightSeries } from '../lib/derive'

// CSS変数を直接 recharts に渡せないので、描画色は定数化（index.css と対応）
const TEMP_DARK = '#f59e0b'
const HUMID_DARK = '#22d3ee'
const GRID = 'rgba(255,255,255,0.06)'
const AXIS_TXT = '#9aa3c4'

/** X軸カスタム tick：時刻＋天気アイコン＋降水確率 */
function WxTick(props: {
  x?: number
  y?: number
  payload?: { value: number }
  points: NightPoint[]
}) {
  const { x = 0, y = 0, payload, points } = props
  const p = payload ? points[payload.value] : undefined
  if (!p) return null
  const { Icon } = weatherFromCode(p.weatherCode)
  const showPop = p.pop !== null && p.pop >= 10 // 10%未満は省略してノイズを減らす

  return (
    <foreignObject x={x - 14} y={y + 2} width={28} height={40}>
      <div className="tick-wx">
        <span className="tick-hour">{p.hour}</span>
        <Icon size={13} strokeWidth={2} />
        <span className="tick-pop">{showPop ? `${Math.round(p.pop as number)}%` : ''}</span>
      </div>
    </foreignObject>
  )
}

function WxTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload as NightPoint
  return (
    <div className="wx-tooltip">
      <div className="tt-time">{p.hour}時</div>
      <div className="tt-row temp">
        気温 {p.temp !== null ? `${p.temp.toFixed(1)}°` : '—'}
      </div>
      <div className="tt-row humid">
        湿度 {p.humidity !== null ? `${Math.round(p.humidity)}%` : '—'}
      </div>
      {p.pop !== null && <div className="tt-row humid">降水 {Math.round(p.pop)}%</div>}
    </div>
  )
}

export default function NightChart({ series }: { series: NightSeries }) {
  const { points } = series

  return (
    <section className="card chart-card" aria-label="今夜の気温・湿度の推移">
      <div className="chart-legend">
        <span className="lg temp">
          <span className="dot temp" />気温 ℃
        </span>
        <span className="lg humid">
          <span className="dot humid" />湿度 %
        </span>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={points} margin={{ top: 8, right: 4, bottom: 26, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="idx"
            tickLine={false}
            axisLine={{ stroke: GRID }}
            interval={0}
            height={44}
            tick={(p) => <WxTick {...p} points={points} />}
          />
          {/* 左軸：気温 */}
          <YAxis
            yAxisId="temp"
            orientation="left"
            domain={[
              (min: number) => Math.floor(min - 2),
              (max: number) => Math.ceil(max + 2),
            ]}
            allowDecimals={false}
            tickCount={5}
            tick={{ fill: TEMP_DARK, fontSize: 11, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            width={38}
            unit="°"
          />
          {/* 右軸：湿度 */}
          <YAxis
            yAxisId="humid"
            orientation="right"
            domain={[0, 100]}
            tick={{ fill: HUMID_DARK, fontSize: 11, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            width={34}
            unit="%"
          />
          <Tooltip content={<WxTooltip />} cursor={{ stroke: AXIS_TXT, strokeDasharray: '3 3' }} />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temp"
            stroke={TEMP_DARK}
            strokeWidth={2.6}
            dot={{ r: 2.5, fill: TEMP_DARK, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            yAxisId="humid"
            type="monotone"
            dataKey="humidity"
            stroke={HUMID_DARK}
            strokeWidth={2.6}
            dot={{ r: 2.5, fill: HUMID_DARK, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}
