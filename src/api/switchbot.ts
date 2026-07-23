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

// ① 中継 Worker（Cloudflare Workers）のベースURL。
//    ここを設定すると、アプリ起動時や「更新」ボタンでその場で SwitchBot から取得・記録する。
//    空文字のままなら、②の GitHub 蓄積JSON（従来方式）を読む。
//    デプロイ手順は worker/README.md を参照。
const SWITCHBOT_API: string = '' // 例: 'https://onshitsu-switchbot.xxxx.workers.dev'

// ② GitHub Actions が蓄積した JSON（Worker 未設定時のフォールバック）。
const OWNER = 'tcta-tottori'
const REPO = 'onshitsu'
const DATA_BRANCH = 'switchbot-data'
const DATA_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${DATA_BRANCH}/switchbot.json`

/** 中継 Worker が設定済みか。 */
export function hasSwitchbotApi(): boolean {
  return SWITCHBOT_API !== ''
}

function num(v: unknown): number | null {
  return typeof v === 'number' && !Number.isNaN(v) ? v : null
}

function normalize(json: unknown): SwitchbotReading[] {
  if (!Array.isArray(json)) return []
  return json
    .filter((r): r is { t: number } => r && typeof r.t === 'number')
    .map((r) => ({ t: r.t, temp: num((r as SwitchbotReading).temp), hum: num((r as SwitchbotReading).hum) }))
    .sort((a, b) => a.t - b.t)
}

/**
 * 蓄積された温湿度の時系列を取得する（時刻昇順）。
 * - Worker 設定時: poll=true なら現在値を取得して追記（起動時・更新ボタン）、false なら履歴のみ。
 * - Worker 未設定時: GitHub 蓄積JSON を読む。
 * 未設定・取得失敗時は空配列を返す（呼び出し側で握りつぶし、カード非表示にする）。
 */
export async function fetchSwitchbotHistory(
  signal?: AbortSignal,
  poll = false,
): Promise<SwitchbotReading[]> {
  const url = SWITCHBOT_API
    ? `${SWITCHBOT_API.replace(/\/+$/, '')}/${poll ? 'poll' : 'history'}`
    : DATA_URL
  const res = await fetch(url, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`SwitchBotデータの取得に失敗（HTTP ${res.status}）`)
  return normalize(await res.json())
}

/**
 * 「更新」ボタン用：中継 Worker に現在値を取得・記録させ、更新後の履歴を返す。
 * Worker 未設定時は従来JSONの再取得にフォールバック（新しい点は増えない）。
 */
export function pollSwitchbot(signal?: AbortSignal): Promise<SwitchbotReading[]> {
  return fetchSwitchbotHistory(signal, true)
}
