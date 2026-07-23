// SwitchBot 温湿度計の時系列データ源。
//
// ブラウザからは SwitchBot API（api.switch-bot.com）を直接呼べない：
//  - CORS 未対応（プリフライトが通らない）
//  - トークン/シークレットをブラウザに置けない
//  - 公式APIに履歴取得が無い（現在値のみ）
// そこで GitHub Actions が15分ごとに取得し、switchbot-data ブランチの
// switchbot.json に蓄積している。ここではそれを raw 経由で読む
//（raw.githubusercontent.com は Access-Control-Allow-Origin: * を返すため CORS 可）。

/** 蓄積データの1点。t は epoch 秒。 */
export interface SwitchbotReading {
  t: number
  temp: number | null
  hum: number | null
}

// リポジトリ／データブランチを変える場合はここを合わせる。
const OWNER = 'tcta-tottori'
const REPO = 'onshitsu'
const DATA_BRANCH = 'switchbot-data'
const DATA_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${DATA_BRANCH}/switchbot.json`

function num(v: unknown): number | null {
  return typeof v === 'number' && !Number.isNaN(v) ? v : null
}

/**
 * 蓄積された温湿度の時系列を取得する（時刻昇順）。
 * 未設定・取得失敗時は空配列を返す（呼び出し側で握りつぶし、カード非表示にする）。
 */
export async function fetchSwitchbotHistory(signal?: AbortSignal): Promise<SwitchbotReading[]> {
  const res = await fetch(DATA_URL, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`SwitchBotデータの取得に失敗（HTTP ${res.status}）`)
  const json = await res.json()
  if (!Array.isArray(json)) return []
  return json
    .filter((r): r is { t: number } => r && typeof r.t === 'number')
    .map((r) => ({ t: r.t, temp: num((r as SwitchbotReading).temp), hum: num((r as SwitchbotReading).hum) }))
    .sort((a, b) => a.t - b.t)
}
