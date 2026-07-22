// 主軸データ(WeatherData)を各画面が使う形へ整形する。
import type { WeatherData } from '../api/weather'
import { getNightWindow, minMax, nightIndices, parseHourly, type NightWindow } from './night'

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

/** ③ テーブル用：翌日以降の「夜（19〜翌6時）」1行 */
export interface NightForecastRow {
  dateObj: Date
  weatherCode: number | null
  tempHigh: number | null
  tempLow: number | null
  humHigh: number | null
  humLow: number | null
}

/**
 * 翌夜以降の「夜（19〜翌6時）」の気温・湿度の上下限を count 日分作る。
 * 上下限・天気とも夜の期間の hourly のみから算出（日中は含めない）。
 * データ範囲外の夜はスキップ（自然に日数が制限される）。
 */
export function deriveNightForecast(
  data: WeatherData,
  now: Date = new Date(),
  count = 6,
): NightForecastRow[] {
  const base = getNightWindow(now)
  const rows: NightForecastRow[] = []
  for (let k = 1; k <= count; k++) {
    const startMs = base.start.getTime() + k * DAY_MS
    const endMs = base.end.getTime() + k * DAY_MS
    const cur = windowMinMax(data, startMs, endMs)
    if (!cur.temp && !cur.hum) continue // 範囲外＝データ無し
    rows.push({
      dateObj: new Date(startMs),
      weatherCode: windowWeatherCode(data, startMs, endMs),
      tempHigh: cur.temp?.max ?? null,
      tempLow: cur.temp?.min ?? null,
      humHigh: cur.hum?.max ?? null,
      humLow: cur.hum?.min ?? null,
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

/** ① ヒーロー用：ある夜（19〜翌6時）の気温・湿度の上下限と、前夜との差 */
export interface NightCard {
  /** 夜の開始日（＝その晩の日付） */
  dateObj: Date
  weatherCode: number | null
  tempHigh: number | null
  tempLow: number | null
  humHigh: number | null
  humLow: number | null
  /** 前夜との差（今夜 − 前夜、整数）。欠損時 null */
  tempHighDiff: number | null
  tempLowDiff: number | null
  humHighDiff: number | null
  humLowDiff: number | null
}

const DAY_MS = 86_400_000

/** hourly を [startMs, endMs] で絞り、気温・湿度の min/max を返す（夜の期間のみ集計） */
function windowMinMax(data: WeatherData, startMs: number, endMs: number) {
  const t: Array<number | null> = []
  const h: Array<number | null> = []
  const { time, temperature_2m, relative_humidity_2m } = data.hourly
  for (let i = 0; i < time.length; i++) {
    const ms = parseHourly(time[i]).getTime()
    if (ms >= startMs && ms <= endMs) {
      t.push(temperature_2m[i])
      h.push(relative_humidity_2m[i])
    }
  }
  return { temp: minMax(t), hum: minMax(h) }
}

// （日付キー生成は不要になったため削除）

/** [startMs, endMs] の hourly weather_code の代表値（最頻／同数なら重い方）。夜の天気を表す。 */
function windowWeatherCode(data: WeatherData, startMs: number, endMs: number): number | null {
  const counts = new Map<number, number>()
  const { time, weather_code } = data.hourly
  for (let i = 0; i < time.length; i++) {
    const ms = parseHourly(time[i]).getTime()
    if (ms >= startMs && ms <= endMs) {
      const c = weather_code[i]
      if (c === null || c === undefined) continue
      counts.set(c, (counts.get(c) ?? 0) + 1)
    }
  }
  let best: number | null = null
  let bestN = -1
  for (const [c, n] of counts) {
    if (n > bestN || (n === bestN && best !== null && c > best)) {
      best = c
      bestN = n
    }
  }
  return best
}

/**
 * 今夜を起点に count 日分の「夜（19〜翌6時）」サマリーを作る。
 * 上下限は夜の期間の hourly のみから算出（日中データは含めない）。
 * 差分は前夜（−24h）との比較。
 */
export function deriveNightCards(
  data: WeatherData,
  now: Date = new Date(),
  count = 3,
): NightCard[] {
  const base = getNightWindow(now)
  const diff = (a: number | null | undefined, b: number | null | undefined): number | null =>
    a === null || a === undefined || b === null || b === undefined
      ? null
      : Math.round(a) - Math.round(b)

  const cards: NightCard[] = []
  for (let k = 0; k < count; k++) {
    const startMs = base.start.getTime() + k * DAY_MS
    const endMs = base.end.getTime() + k * DAY_MS
    const cur = windowMinMax(data, startMs, endMs)
    const prev = windowMinMax(data, startMs - DAY_MS, endMs - DAY_MS)
    const startDate = new Date(startMs)
    cards.push({
      dateObj: startDate,
      weatherCode: windowWeatherCode(data, startMs, endMs),
      tempHigh: cur.temp?.max ?? null,
      tempLow: cur.temp?.min ?? null,
      humHigh: cur.hum?.max ?? null,
      humLow: cur.hum?.min ?? null,
      tempHighDiff: diff(cur.temp?.max, prev.temp?.max),
      tempLowDiff: diff(cur.temp?.min, prev.temp?.min),
      humHighDiff: diff(cur.hum?.max, prev.hum?.max),
      humLowDiff: diff(cur.hum?.min, prev.hum?.min),
    })
  }
  return cards
}
