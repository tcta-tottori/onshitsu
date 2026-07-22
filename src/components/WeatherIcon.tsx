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

type Cat = 'clear' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'thunder'

function categorize(code: number | null): Cat {
  if (code === null) return 'cloud'
  if (code === 0) return 'clear'
  if (code === 1 || code === 2) return 'partly'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'thunder'
  return 'cloud'
}

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
  const cat = categorize(code)
  const common = { size, strokeWidth, 'aria-hidden': true as const }

  if (cat === 'clear')
    return (
      <span className={`wxi ${className}`}>
        <Moon {...common} />
      </span>
    )
  if (cat === 'partly')
    return (
      <span className={`wxi wxi-float ${className}`}>
        <CloudMoon {...common} />
      </span>
    )
  if (cat === 'fog')
    return (
      <span className={`wxi ${className}`}>
        <CloudFog {...common} />
      </span>
    )
  if (cat === 'snow')
    return (
      <span className={`wxi wxi-float ${className}`}>
        <CloudSnow {...common} />
      </span>
    )
  if (cat === 'thunder')
    return (
      <span className={`wxi wxi-flash ${className}`}>
        <CloudLightning {...common} />
      </span>
    )
  if (cat === 'rain')
    return (
      <span
        className={`wxi wxi-rain ${className}`}
        style={{ width: size, height: size }}
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
    <span className={`wxi wxi-float ${className}`}>
      <Cloud {...common} />
    </span>
  )
}
