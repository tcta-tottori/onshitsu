// 主軸データ源: Open-Meteo 気象庁MSM/GSMモデル（models=jma_seamless）
// 毎時の気温・湿度・降水・天気コードと、日別の気温上下限・天気を取得する。
// APIキー不要・CORS対応。

export interface Location {
  id: string
  name: string
  lat: number
  lon: number
}

export interface HourlyData {
  time: string[]
  temperature_2m: Array<number | null>
  relative_humidity_2m: Array<number | null>
  precipitation: Array<number | null>
  precipitation_probability: Array<number | null>
  weather_code: Array<number | null>
}

export interface DailyData {
  time: string[]
  temperature_2m_max: Array<number | null>
  temperature_2m_min: Array<number | null>
  weather_code: Array<number | null>
  precipitation_probability_max: Array<number | null>
}

export interface WeatherData {
  latitude: number
  longitude: number
  timezone: string
  hourly: HourlyData
  daily: DailyData
  /** 取得時刻 */
  fetchedAt: Date
}

const BASE = 'https://api.open-meteo.com/v1/forecast'

/**
 * 主軸データを取得する。models=jma_seamless（気象庁MSM/GSMシームレス）を指定し
 * forecast_days=7 で7日分を得る。
 */
export async function fetchWeather(loc: Location, signal?: AbortSignal): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    hourly:
      'temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max',
    models: 'jma_seamless',
    timezone: 'Asia/Tokyo',
    forecast_days: '7',
    // 深夜〜早朝（6時前）は今夜ウィンドウが前日19時始まりになる。
    // 前日分を含めておかないと夜の前半(17〜23時)が欠けるため past_days=1 を付与。
    past_days: '1',
  })

  const res = await fetch(`${BASE}?${params.toString()}`, { signal })
  if (!res.ok) {
    throw new Error(`気象データの取得に失敗しました（HTTP ${res.status}）。時間をおいて再取得してください。`)
  }
  const json = await res.json()

  if (!json.hourly || !json.daily) {
    throw new Error('気象データの形式が想定と異なります。再取得してください。')
  }

  return {
    latitude: json.latitude,
    longitude: json.longitude,
    timezone: json.timezone,
    hourly: {
      time: json.hourly.time ?? [],
      temperature_2m: json.hourly.temperature_2m ?? [],
      relative_humidity_2m: json.hourly.relative_humidity_2m ?? [],
      precipitation: json.hourly.precipitation ?? [],
      precipitation_probability: json.hourly.precipitation_probability ?? [],
      weather_code: json.hourly.weather_code ?? [],
    },
    daily: {
      time: json.daily.time ?? [],
      temperature_2m_max: json.daily.temperature_2m_max ?? [],
      temperature_2m_min: json.daily.temperature_2m_min ?? [],
      weather_code: json.daily.weather_code ?? [],
      precipitation_probability_max: json.daily.precipitation_probability_max ?? [],
    },
    fetchedAt: new Date(),
  }
}
