// 主軸データ(WeatherData)を各画面が使う形へ整形する。
import type { WeatherData } from '../api/weather'
import { getNightWindow, minMax, nightIndices, parseHourly, type NightWindow } from './night'
import { dailyHumidityMap } from './humidity'

/** ② グラフ／ヒーロー用：今夜ウィンドウの各時刻の値 */
export interface NightPoint {
  /** 時刻ラベル（0-23 の時） */
  hour: number
  /** ソート＆ツールチップ用の連番（17→6を0..13） */
  idx: number
  temp: number | null
  humidity: number | null
  /** 降水確率(%)。hourly優先、無ければ null */
  pop: number | null
  weatherCode: number | null
}

export interface NightSeries {
  window: NightWindow
  points: NightPoint[]
  temp: { min: number; max: number } | null
  humidity: { min: number; max: number } | null
}

/**
 * 今夜ウィンドウの毎時系列と、気温・湿度の上下限を算出する。
 * hourly に precipitation_probability が無い構成のため pop は null 埋め
 *（別途 JMA/日別から補完する）。ここでは precipitation(mm) は使わず、
 * pop は呼び出し側で hourlyPop があれば差し込める設計にする。
 */
export function deriveNight(
  data: WeatherData,
  now: Date = new Date(),
  hourlyPop?: Array<number | null>,
): NightSeries {
  const win = getNightWindow(now)
  const { time, temperature_2m, relative_humidity_2m, weather_code } = data.hourly
  const idxs = nightIndices(time, win)

  const points: NightPoint[] = idxs.map((i, order) => ({
    hour: parseHourly(time[i]).getHours(),
    idx: order,
    temp: temperature_2m[i] ?? null,
    humidity: relative_humidity_2m[i] ?? null,
    pop: hourlyPop ? (hourlyPop[i] ?? null) : null,
    weatherCode: weather_code[i] ?? null,
  }))

  return {
    window: win,
    points,
    temp: minMax(points.map((p) => p.temp)),
    humidity: minMax(points.map((p) => p.humidity)),
  }
}

/** ③ テーブル用：翌日以降の1日1行 */
export interface DailyRow {
  /** YYYY-MM-DD */
  date: string
  dateObj: Date
  weatherCode: number | null
  tempMax: number | null
  tempMin: number | null
  humidityMax: number | null
  humidityMin: number | null
  pop: number | null
}

/**
 * daily を翌日以降の行に整形する。湿度は hourly から日別集計して添える。
 * @param todayStr 今日の YYYY-MM-DD（この日は除外して「明日以降」を返す）
 */
export function deriveDaily(data: WeatherData, todayStr: string): DailyRow[] {
  const humMap = dailyHumidityMap(data.hourly.time, data.hourly.relative_humidity_2m)
  const d = data.daily
  const rows: DailyRow[] = []
  for (let i = 0; i < d.time.length; i++) {
    const date = d.time[i]
    if (date <= todayStr) continue // 今日以前は除外
    const hum = humMap.get(date)
    const [y, mo, da] = date.split('-').map(Number)
    rows.push({
      date,
      dateObj: new Date(y, mo - 1, da),
      weatherCode: d.weather_code[i] ?? null,
      tempMax: d.temperature_2m_max[i] ?? null,
      tempMin: d.temperature_2m_min[i] ?? null,
      humidityMax: hum?.max ?? null,
      humidityMin: hum?.min ?? null,
      pop: d.precipitation_probability_max[i] ?? null,
    })
  }
  return rows
}

/** 今日の YYYY-MM-DD（ローカル） */
export function todayStr(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
