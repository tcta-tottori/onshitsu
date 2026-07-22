// WMO weather_code → ラベル / lucide アイコン（主軸: Open-Meteo 用）
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react'

export interface WeatherInfo {
  label: string
  Icon: LucideIcon
}

const MAP: Record<number, WeatherInfo> = {
  0: { label: '快晴', Icon: Sun },
  1: { label: '晴れ時々曇り', Icon: CloudSun },
  2: { label: '晴れ時々曇り', Icon: CloudSun },
  3: { label: '曇り', Icon: Cloud },
  45: { label: '霧', Icon: CloudFog },
  48: { label: '霧', Icon: CloudFog },
  51: { label: '霧雨', Icon: CloudDrizzle },
  53: { label: '霧雨', Icon: CloudDrizzle },
  55: { label: '霧雨', Icon: CloudDrizzle },
  56: { label: '霧雨', Icon: CloudDrizzle },
  57: { label: '霧雨', Icon: CloudDrizzle },
  61: { label: '雨', Icon: CloudRain },
  63: { label: '雨', Icon: CloudRain },
  65: { label: '雨', Icon: CloudRain },
  66: { label: '雨', Icon: CloudRain },
  67: { label: '雨', Icon: CloudRain },
  71: { label: '雪', Icon: CloudSnow },
  73: { label: '雪', Icon: CloudSnow },
  75: { label: '雪', Icon: CloudSnow },
  77: { label: '雪', Icon: CloudSnow },
  80: { label: 'にわか雨', Icon: CloudRain },
  81: { label: 'にわか雨', Icon: CloudRain },
  82: { label: 'にわか雨', Icon: CloudRain },
  85: { label: '雪', Icon: CloudSnow },
  86: { label: '雪', Icon: CloudSnow },
  95: { label: '雷雨', Icon: CloudLightning },
  96: { label: '雷雨', Icon: CloudLightning },
  99: { label: '雷雨', Icon: CloudLightning },
}

const UNKNOWN: WeatherInfo = { label: '—', Icon: Cloud }

export function weatherFromCode(code: number | null | undefined): WeatherInfo {
  if (code === null || code === undefined) return UNKNOWN
  return MAP[code] ?? UNKNOWN
}

// --- 夜向けの分類・色・アイコン（アプリ全体で共通） ---

export type NightCat = 'clear' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'thunder'

/** weather_code を夜向けカテゴリに分類する。 */
export function nightCategory(code: number | null | undefined): NightCat {
  if (code === null || code === undefined) return 'cloud'
  if (code === 0) return 'clear'
  if (code === 1 || code === 2) return 'partly'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'thunder'
  return 'cloud'
}

/** 天気アイコンの色：月＝黄色 / 雲＝白 / 雨＝水色。 */
export const NIGHT_ICON_COLOR = {
  moon: '#ffd24a', // 月：黄色
  cloud: '#f4f7ff', // 雲：白
  rain: '#7fd3ef', // 雨：水色
} as const

/** weather_code に対応する天気アイコンの色を返す。 */
export function nightColor(code: number | null | undefined): string {
  const cat = nightCategory(code)
  if (cat === 'clear') return NIGHT_ICON_COLOR.moon
  if (cat === 'rain' || cat === 'thunder') return NIGHT_ICON_COLOR.rain
  return NIGHT_ICON_COLOR.cloud // partly / cloud / fog / snow
}

/** グラフ横軸などに使う静止アイコン（夜向け：月・雲・雨ベース）。 */
export function nightAxisIcon(code: number | null | undefined): LucideIcon {
  switch (nightCategory(code)) {
    case 'clear':
      return Moon
    case 'partly':
      return CloudMoon
    case 'fog':
      return CloudFog
    case 'rain':
      return CloudRain
    case 'snow':
      return CloudSnow
    case 'thunder':
      return CloudLightning
    default:
      return Cloud
  }
}
