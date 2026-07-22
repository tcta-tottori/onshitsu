// WMO weather_code → ラベル / lucide アイコン（主軸: Open-Meteo 用）
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
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
