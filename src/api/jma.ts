// 補完データ源（任意）: 気象庁 公式予報JSON / AMeDAS
//
// - 公式予報JSON: 明日以降の降水確率(pop)・天気を気象庁公式値で拾う。
//   非公式・仕様変更リスクあり、政府標準利用規約準拠、問い合わせ不可。
// - AMeDAS: 「現在の気温・湿度」の実況（予報ではなく観測）。
//
// 主軸(Open-Meteo JMAモデル)だけでも全画面は成立する。ここは上乗せ用で、
// 失敗しても主軸表示は壊さない設計にする（呼び出し側で握りつぶす）。

/** 鳥取県の地域コード */
export const TOTTORI_AREA_CODE = '310000'

/** 鳥取市中心部の AMeDAS 観測所ID */
export const TOTTORI_AMEDAS_ID = '69122'

// --- 公式予報JSON: 降水確率 ---

export interface JmaPop {
  /** ISO時刻（時間帯ブロックの開始） */
  time: string
  /** 降水確率(%) 文字列（'--' の場合あり） */
  pop: string
}

/**
 * 公式予報JSONから、時間帯ブロックごとの降水確率を取り出す。
 * 代表地点・時間帯ブロック単位（毎時ではない）なので、あくまで添え物として使う。
 */
export async function fetchJmaPops(
  areaCode: string = TOTTORI_AREA_CODE,
  signal?: AbortSignal,
): Promise<JmaPop[]> {
  const url = `https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`気象庁公式JSONの取得に失敗（HTTP ${res.status}）`)
  const json = await res.json()

  // json[0].timeSeries の中に pops を持つ要素がある
  const series = json?.[0]?.timeSeries
  if (!Array.isArray(series)) return []
  const popSeries = series.find(
    (s: { areas?: Array<{ pops?: string[] }> }) => s.areas?.[0]?.pops,
  )
  if (!popSeries) return []

  const times: string[] = popSeries.timeDefines ?? []
  const pops: string[] = popSeries.areas?.[0]?.pops ?? []
  return times.map((time, i) => ({ time, pop: pops[i] ?? '--' }))
}

// --- AMeDAS: 現在の実況 ---

export interface AmedasNow {
  /** 気温(℃) */
  temp: number | null
  /** 相対湿度(%) */
  humidity: number | null
  /** 観測時刻 */
  time: Date
}

/**
 * AMeDAS の最新実況（当日・直近の毎時JSON）を取得する。
 * ファイル名は yyyyMMdd_HH0000.json（3時間ごとにまとめられた最新を参照）。
 */
export async function fetchAmedasNow(
  now: Date = new Date(),
  pointId: string = TOTTORI_AMEDAS_ID,
  signal?: AbortSignal,
): Promise<AmedasNow | null> {
  // AMeDAS の最新ファイルは3時間区切り（00,03,…,21）。直近の区切り時刻を使う。
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const block = String(Math.floor(now.getHours() / 3) * 3).padStart(2, '0')
  const url = `https://www.jma.go.jp/bosai/amedas/data/point/${pointId}/${y}${m}${d}_${block}.json`

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`AMeDASの取得に失敗（HTTP ${res.status}）`)
  const json: Record<string, { temp?: [number, number]; humidity?: [number, number] }> =
    await res.json()

  // キーは "yyyyMMddHHmmss"。最新（最大キー）を採用。
  const keys = Object.keys(json).sort()
  const latestKey = keys[keys.length - 1]
  if (!latestKey) return null
  const rec = json[latestKey]

  // 値は [値, 品質フラグ] の配列。品質フラグ0=正常。
  const temp = rec.temp && rec.temp[1] === 0 ? rec.temp[0] : null
  const humidity = rec.humidity && rec.humidity[1] === 0 ? rec.humidity[0] : null

  // latestKey → Date
  const t = new Date(
    Number(latestKey.slice(0, 4)),
    Number(latestKey.slice(4, 6)) - 1,
    Number(latestKey.slice(6, 8)),
    Number(latestKey.slice(8, 10)),
    Number(latestKey.slice(10, 12)),
  )
  return { temp, humidity, time: t }
}
