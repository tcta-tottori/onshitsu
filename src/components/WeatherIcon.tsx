// 天気アイコン（夜向け）。現状の lucide アイコンを活かしつつ、天気ごとにアニメーション。
// - 晴れ（快晴）: 月（静止）
// - 曇り/晴れ時々曇り: 雲が上下に揺れる
// - 雨/霧雨/にわか雨: 雲＋雨の線が上から下へ流れる
// - 雪: 雲が揺れる / 雷: 明滅
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudSnow,
  Moon,
} from 'lucide-react'
import { nightCategory, nightColor } from '../lib/weatherCode'

export default function WeatherIcon({
  code,
  size = 28,
  strokeWidth = 1.7,
  className = '',
}: {
  code: number | null
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const cat = nightCategory(code)
  const color = nightColor(code)
  // 色は span に載せる（SVG も雨の線も currentColor で色が付く）
  const common = { size, strokeWidth, 'aria-hidden': true as const }

  if (cat === 'clear')
    return (
      <span className={`wxi ${className}`} style={{ color }}>
        <Moon {...common} />
      </span>
    )
  if (cat === 'partly')
    return (
      <span className={`wxi wxi-float ${className}`} style={{ color }}>
        <CloudMoon {...common} />
      </span>
    )
  if (cat === 'fog')
    return (
      <span className={`wxi ${className}`} style={{ color }}>
        <CloudFog {...common} />
      </span>
    )
  if (cat === 'snow')
    return (
      <span className={`wxi wxi-float ${className}`} style={{ color }}>
        <CloudSnow {...common} />
      </span>
    )
  if (cat === 'thunder')
    return (
      <span className={`wxi wxi-flash ${className}`} style={{ color }}>
        <CloudLightning {...common} />
      </span>
    )
  if (cat === 'rain')
    return (
      <span
        className={`wxi wxi-rain ${className}`}
        style={{ width: size, height: size, color }}
      >
        <Cloud {...common} />
        <span className="wxi-drops" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </span>
    )
  // cloud
  return (
    <span className={`wxi wxi-float ${className}`} style={{ color }}>
      <Cloud {...common} />
    </span>
  )
}
