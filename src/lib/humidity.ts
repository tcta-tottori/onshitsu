// hourly.relative_humidity_2m を日付ごとに集計して日別 min/max を得る。
// daily に湿度が無いため、この関数で補う。
import { parseHourly } from './night'

export interface DailyHumidity {
  min: number
  max: number
}

/** YYYY-MM-DD 文字列を返す（ローカル日付） */
function dateKey(iso: string): string {
  // "2026-07-22T17:00" → "2026-07-22"
  return iso.split('T')[0]
}

/**
 * hourly の time[] と relative_humidity_2m[] から、
 * 日付(YYYY-MM-DD) → {min, max} のマップを作る。
 */
export function dailyHumidityMap(
  times: string[],
  humidity: Array<number | null>,
): Map<string, DailyHumidity> {
  const acc = new Map<string, { min: number; max: number }>()
  for (let i = 0; i < times.length; i++) {
    const h = humidity[i]
    if (h === null || h === undefined || Number.isNaN(h)) continue
    // parseHourly を通しても日付キーは変わらないが、ISO 先頭を使うのが軽量
    const key = dateKey(times[i])
    const cur = acc.get(key)
    if (!cur) {
      acc.set(key, { min: h, max: h })
    } else {
      if (h < cur.min) cur.min = h
      if (h > cur.max) cur.max = h
    }
  }
  return acc
}

/** parseHourly を使う版（ローカル日付境界を厳密にしたい場合用・現状は未使用のエクスポート） */
export function dailyHumidityMapStrict(
  times: string[],
  humidity: Array<number | null>,
): Map<string, DailyHumidity> {
  const acc = new Map<string, { min: number; max: number }>()
  for (let i = 0; i < times.length; i++) {
    const h = humidity[i]
    if (h === null || h === undefined || Number.isNaN(h)) continue
    const d = parseHourly(times[i])
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`
    const cur = acc.get(key)
    if (!cur) acc.set(key, { min: h, max: h })
    else {
      if (h < cur.min) cur.min = h
      if (h > cur.max) cur.max = h
    }
  }
  return acc
}
