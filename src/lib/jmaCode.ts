// 気象庁 天気コード(telops) → ラベル / lucide アイコン（補完: 公式JSON用）
//
// 気象庁の天気コードは3桁で、100番台=晴れ / 200番台=曇り / 300番台=雨 / 400番台=雪。
// 公式JSON(forecast/310000.json)の weathers/weatherCodes に対応する。
// ここでは主要コードを大分類でマッピングし、未知コードは先頭桁で近似する。
import {
  Cloud,
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

// 先頭桁による大分類フォールバック
function byLeadingDigit(code: number): WeatherInfo {
  const head = Math.floor(code / 100)
  switch (head) {
    case 1:
      return { label: '晴れ', Icon: Sun }
    case 2:
      return { label: '曇り', Icon: Cloud }
    case 3:
      return { label: '雨', Icon: CloudRain }
    case 4:
      return { label: '雪', Icon: CloudSnow }
    default:
      return { label: '—', Icon: Cloud }
  }
}

// よく出る代表コードの明示マッピング
const MAP: Record<number, WeatherInfo> = {
  100: { label: '晴れ', Icon: Sun },
  101: { label: '晴れ時々曇り', Icon: CloudSun },
  102: { label: '晴れ一時雨', Icon: CloudRain },
  110: { label: '晴れ後曇り', Icon: CloudSun },
  111: { label: '晴れ後曇り', Icon: CloudSun },
  112: { label: '晴れ後雨', Icon: CloudRain },
  200: { label: '曇り', Icon: Cloud },
  201: { label: '曇り時々晴れ', Icon: CloudSun },
  202: { label: '曇り一時雨', Icon: CloudRain },
  210: { label: '曇り後晴れ', Icon: CloudSun },
  211: { label: '曇り後晴れ', Icon: CloudSun },
  212: { label: '曇り後雨', Icon: CloudRain },
  270: { label: '雪時々曇り', Icon: CloudSnow },
  300: { label: '雨', Icon: CloudRain },
  301: { label: '雨時々晴れ', Icon: CloudRain },
  302: { label: '雨時々止む', Icon: CloudRain },
  308: { label: '雨で暴風', Icon: CloudLightning },
  311: { label: '雨後晴れ', Icon: CloudSun },
  313: { label: '雨後曇り', Icon: Cloud },
  400: { label: '雪', Icon: CloudSnow },
  401: { label: '雪時々晴れ', Icon: CloudSnow },
  402: { label: '雪時々止む', Icon: CloudSnow },
  411: { label: '雪後晴れ', Icon: CloudSun },
  413: { label: '雪後曇り', Icon: Cloud },
}

export function weatherFromJmaCode(code: number | string | null | undefined): WeatherInfo {
  if (code === null || code === undefined) return { label: '—', Icon: Cloud }
  const n = typeof code === 'string' ? parseInt(code, 10) : code
  if (Number.isNaN(n)) return { label: '—', Icon: Cloud }
  return MAP[n] ?? byLeadingDigit(n)
}
