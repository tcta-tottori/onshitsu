// ② 夜間グラフ：気温(左軸・暖色) × 湿度(右軸・寒色) の二軸。
// アプリアイコンの世界観に合わせ、発光する曲線＋下方向グラデーションの塗りで
// 洗練された見た目に。X軸のカスタム tick に各時刻の天気アイコンと降水確率を埋め込む。
import { Droplets, Thermometer } from 'lucide-react'
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

/** X軸カスタム tick：時刻＋天気アイコン＋降水確率。2時間ごと（偶数idx）のみ表示。 */
function WxTick(props: {
  x?: number
  y?: number
  payload?: { value: number }
  points: NightPoint[]
}) {
  const { x = 0, y = 0, payload, points } = props
  const p = payload ? points[payload.value] : undefined
  if (!p) return null
  // 横軸は2時間単位で表示（タップ時のツールチップは全時刻＝1時間単位）
  if (p.idx % 2 !== 0) return null
  const { Icon } = weatherFromCode(p.weatherCode)
  const showPop = p.pop !== null && p.pop >= 10 // 10%未満は省いてノイズを減らす

  return (
    <foreignObject x={x - 15} y={y + 4} width={30} height={40}>
      <div className="tick-wx">
        <span className="tick-hour">{p.hour}</span>
        <Icon size={14} strokeWidth={2} />
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

/** [lo, hi] を4目盛（3等分）に。両軸で同じ本数・同じ高さ位置に揃える。 */
function fourTicks(lo: number, hi: number): number[] {
  return [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3)
}

export default function NightChart({ series }: { series: NightSeries }) {
  const { points } = series
  const data = points

  // 軸レンジ（気温・湿度とも4目盛で高さ位置を揃える）
  const temps = points.map((p) => p.temp).filter((v): v is number => v !== null)
  const hums = points.map((p) => p.humidity).filter((v): v is number => v !== null)
  const tLo = temps.length ? Math.floor(Math.min(...temps) - 1) : 0
  const tHi = temps.length ? Math.ceil(Math.max(...temps) + 1) : 10
  const hLo = hums.length ? Math.max(0, Math.floor((Math.min(...hums) - 5) / 5) * 5) : 0
  const hHi = hums.length ? Math.min(100, Math.ceil((Math.max(...hums) + 5) / 5) * 5) : 100
  const tempTicks = fourTicks(tLo, tHi)
  const humTicks = fourTicks(hLo, hHi)

  return (
    <section className="card chart-card chart-rise" aria-label="今夜の気温・湿度の推移">
      <div className="chart-legend">
        <span className="lg temp">
          <Thermometer size={19} strokeWidth={2.2} />気温 ℃
        </span>
        <span className="lg humid">
          <Droplets size={19} strokeWidth={2.2} />湿度 %
        </span>
      </div>
      <ResponsiveContainer width="100%" height={236}>
        <ComposedChart data={data} margin={{ top: 10, right: 6, bottom: 26, left: 2 }}>
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

          <CartesianGrid stroke={GRID} vertical={false} syncWithTicks />
          <XAxis
            dataKey="idx"
            tickLine={false}
            axisLine={{ stroke: GRID }}
            interval={0}
            height={44}
            tick={(p) => <WxTick {...p} points={data} />}
          />
          {/* 左軸：気温（4目盛） */}
          <YAxis
            yAxisId="temp"
            orientation="left"
            domain={[tLo, tHi]}
            ticks={tempTicks}
            interval={0}
            tickFormatter={(v: number) => `${Math.round(v)}°`}
            tick={{ fill: TEMP, fontSize: 11, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            width={34}
          />
          {/* 右軸：湿度（気温と同じ4目盛・同じ高さ位置に揃える） */}
          <YAxis
            yAxisId="humid"
            orientation="right"
            domain={[hLo, hHi]}
            ticks={humTicks}
            interval={0}
            tickFormatter={(v: number) => `${Math.round(v)}%`}
            tick={{ fill: HUMID, fontSize: 11, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            width={38}
          />
          <Tooltip content={<WxTooltip />} cursor={{ stroke: AXIS_TXT, strokeDasharray: '3 3' }} />

          {/* 塗り（線は Line 側で描くので stroke なし）。下から立ち上がるように伸びる。 */}
          <Area
            yAxisId="humid"
            type="monotone"
            dataKey="humidity"
            stroke="none"
            fill="url(#humidFill)"
            isAnimationActive
            animationBegin={150}
            animationDuration={1000}
            animationEasing="ease-out"
            connectNulls
          />
          <Area
            yAxisId="temp"
            type="monotone"
            dataKey="temp"
            stroke="none"
            fill="url(#tempFill)"
            isAnimationActive
            animationBegin={150}
            animationDuration={1000}
            animationEasing="ease-out"
            connectNulls
          />

          {/* 発光する曲線（左から描かれる） */}
          <Line
            yAxisId="humid"
            type="monotone"
            dataKey="humidity"
            stroke={HUMID}
            strokeWidth={2.6}
            strokeLinecap="round"
            dot={false}
            activeDot={{ r: 4.5, fill: HUMID, stroke: '#0a1120', strokeWidth: 2 }}
            connectNulls
            isAnimationActive
            animationBegin={0}
            animationDuration={1150}
            animationEasing="ease-in-out"
            style={{ filter: 'url(#lineGlow)' }}
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temp"
            stroke={TEMP}
            strokeWidth={2.6}
            strokeLinecap="round"
            dot={false}
            activeDot={{ r: 4.5, fill: TEMP, stroke: '#0a1120', strokeWidth: 2 }}
            connectNulls
            isAnimationActive
            animationBegin={0}
            animationDuration={1150}
            animationEasing="ease-in-out"
            style={{ filter: 'url(#lineGlow)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  )
}
