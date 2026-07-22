// その日の夜（19〜翌6時）の気温・湿度をコンパクトに描くミニ推移グラフ（スパークライン）。
// 気温・湿度はそれぞれ自身の min/max で正規化して小さな枠に収める。

const W = 66
const H = 34
const PAD = 4

function toPoints(vals: Array<number | null>): string {
  const pts = vals
    .map((v, i) => ({ i, v }))
    .filter((o): o is { i: number; v: number } => o.v !== null)
  if (pts.length < 2) return ''
  const nums = pts.map((o) => o.v)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const span = max - min || 1
  const n = vals.length
  return pts
    .map((o) => {
      const x = PAD + (o.i / (n - 1)) * (W - 2 * PAD)
      const y = PAD + (1 - (o.v - min) / span) * (H - 2 * PAD)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export default function MiniTrend({
  temps,
  hums,
}: {
  temps: Array<number | null>
  hums: Array<number | null>
}) {
  const t = toPoints(temps)
  const h = toPoints(hums)
  return (
    <svg
      className="mini-trend"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {h && (
        <polyline
          points={h}
          fill="none"
          stroke="#7fd3ef"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {t && (
        <polyline
          points={t}
          fill="none"
          stroke="#f6a83e"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
