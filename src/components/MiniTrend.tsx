// その日の夜（19〜翌6時）の気温・湿度をコンパクトに描くミニ推移グラフ。
// アプリアイコン同様に、曲線の下へグラデーションのフェード塗り＋淡い発光を重ねる。

const W = 72
const H = 38
const PAD = 5

function build(vals: Array<number | null>): { line: string; area: string } | null {
  const arr = vals
    .map((v, i) => ({ i, v }))
    .filter((o): o is { i: number; v: number } => o.v !== null)
  if (arr.length < 2) return null
  const nums = arr.map((o) => o.v)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const span = max - min || 1
  const n = vals.length
  const coords = arr.map((o) => ({
    x: PAD + (o.i / (n - 1)) * (W - 2 * PAD),
    y: PAD + (1 - (o.v - min) / span) * (H - 2 * PAD),
  }))
  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const area =
    `M ${coords[0].x.toFixed(1)},${H} L ` +
    coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L ') +
    ` L ${coords[coords.length - 1].x.toFixed(1)},${H} Z`
  return { line, area }
}

export default function MiniTrend({
  temps,
  hums,
}: {
  temps: Array<number | null>
  hums: Array<number | null>
}) {
  const t = build(temps)
  const h = build(hums)
  return (
    <svg
      className="mini-trend"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mtTemp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6a83e" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f6a83e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mtHumid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7fd3ef" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#7fd3ef" stopOpacity="0" />
        </linearGradient>
        <filter id="mtGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {h && (
        <>
          <path d={h.area} fill="url(#mtHumid)" stroke="none" />
          <polyline
            points={h.line}
            fill="none"
            stroke="#7fd3ef"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#mtGlow)"
          />
        </>
      )}
      {t && (
        <>
          <path d={t.area} fill="url(#mtTemp)" stroke="none" />
          <polyline
            points={t.line}
            fill="none"
            stroke="#f6a83e"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#mtGlow)"
          />
        </>
      )}
    </svg>
  )
}
