// ② 夜間グラフ：気温(左軸・暖色) × 湿度(右軸・寒色) の二軸。
// アプリアイコンの世界観に合わせ、発光する曲線＋下方向グラデーションの塗りで
// 洗練された見た目に。X軸のカスタム tick に各時刻の天気アイコンと降水確率を埋め込む。
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
import { weatherFromCode } from '../lib/weatherCode'
import type { NightPoint, NightSeries } from '../lib/derive'

// CSS変数を直接 recharts に渡せないので、描画色は定数化（アイコンの配色に合わせる）
const TEMP = '#f6a83e'
const HUMID = '#7fd3ef'
const GRID = 'rgba(255,255,255,0.05)'
const AXIS_TXT = '#93a1bd'

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
  const showPop = p.pop !== null && p.pop >= 10 // 10%未満は省いてノイズを減らす

  return (
    <foreignObject x={x - 14} y={y + 4} width={28} height={40}>
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
      <div className="tt-row temp">気温 {p.temp !== null ? `${p.temp.toFixed(1)}°` : '—'}</div>
      <div className="tt-row humid">
        湿度 {p.humidity !== null ? `${Math.round(p.humidity)}%` : '—'}
      </div>
      {p.pop !== null && <div className="tt-row humid">降水 {Math.round(p.pop)}%</div>}
    </div>
  )
}

/** 湿度軸の範囲：0固定ではなく、データに5%刻みで余白を付けて 0–100 にクランプ */
const humidLow = (min: number) => Math.max(0, Math.floor((min - 8) / 5) * 5)
const humidHigh = (max: number) => Math.min(100, Math.ceil((max + 8) / 5) * 5)

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
      <ResponsiveContainer width="100%" height={236}>
        <ComposedChart data={points} margin={{ top: 10, right: 6, bottom: 26, left: 2 }}>
          <defs>
            {/* 曲線の下に敷く縦グラデーション（アイコンの塗りに合わせる） */}
            <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEMP} stopOpacity={0.32} />
              <stop offset="100%" stopColor={TEMP} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="humidFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={HUMID} stopOpacity={0.26} />
              <stop offset="100%" stopColor={HUMID} stopOpacity={0} />
            </linearGradient>
            {/* 線の発光 */}
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

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
            domain={[(min: number) => Math.floor(min - 2), (max: number) => Math.ceil(max + 2)]}
            allowDecimals={false}
            tickCount={5}
            tick={{ fill: TEMP, fontSize: 11, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            width={34}
            unit="°"
          />
          {/* 右軸：湿度（0固定にせずデータに合わせる） */}
          <YAxis
            yAxisId="humid"
            orientation="right"
            domain={[humidLow, humidHigh]}
            allowDecimals={false}
            tickCount={5}
            tick={{ fill: HUMID, fontSize: 11, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            width={38}
            unit="%"
          />
          <Tooltip content={<WxTooltip />} cursor={{ stroke: AXIS_TXT, strokeDasharray: '3 3' }} />

          {/* 塗り（線は Line 側で描くので stroke なし） */}
          <Area
            yAxisId="humid"
            type="monotone"
            dataKey="humidity"
            stroke="none"
            fill="url(#humidFill)"
            isAnimationActive={false}
            connectNulls
          />
          <Area
            yAxisId="temp"
            type="monotone"
            dataKey="temp"
            stroke="none"
            fill="url(#tempFill)"
            isAnimationActive={false}
            connectNulls
          />

          {/* 発光する曲線 */}
          <Line
            yAxisId="humid"
            type="monotone"
            dataKey="humidity"
            stroke={HUMID}
            strokeWidth={2.6}
            strokeLinecap="round"
            dot={{ r: 2, fill: HUMID, strokeWidth: 0 }}
            activeDot={{ r: 4.5, stroke: '#0a1120', strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
            style={{ filter: 'url(#lineGlow)' }}
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temp"
            stroke={TEMP}
            strokeWidth={2.6}
            strokeLinecap="round"
            dot={{ r: 2, fill: TEMP, strokeWidth: 0 }}
            activeDot={{ r: 4.5, stroke: '#0a1120', strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
            style={{ filter: 'url(#lineGlow)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  )
}
