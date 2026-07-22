// SwitchBot 温湿度計の現在値を取得し、時系列JSONへ追記するポーラー。
// GitHub Actions（.github/workflows/switchbot.yml）から15分ごとに実行される想定。
//
// ブラウザからは api.switch-bot.com を直接叩けない（CORS未対応・鍵の秘匿・履歴API無し）ため、
// サーバー側（Actions）で取得し、蓄積したJSONを静的サイトが読む構成にしている。
//
// 使い方: node scripts/switchbot-poll.mjs <出力JSONパス>
// 環境変数: SWITCHBOT_TOKEN / SWITCHBOT_SECRET / SWITCHBOT_DEVICE_ID
import crypto from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const token = process.env.SWITCHBOT_TOKEN
const secret = process.env.SWITCHBOT_SECRET
const deviceId = process.env.SWITCHBOT_DEVICE_ID
const outPath = process.argv[2] || 'switchbot.json'

// 保持する最大点数。15分間隔なら 1日=96点、約31日分。
const MAX_POINTS = 3000

if (!token || !secret || !deviceId) {
  console.error(
    'SWITCHBOT_TOKEN / SWITCHBOT_SECRET / SWITCHBOT_DEVICE_ID を環境変数に設定してください。',
  )
  process.exit(1)
}

/** SwitchBot API v1.1 の署名ヘッダを作る（HMAC-SHA256）。 */
function authHeaders() {
  const t = Date.now().toString()
  const nonce = crypto.randomUUID()
  const data = token + t + nonce
  const sign = crypto.createHmac('sha256', secret).update(Buffer.from(data, 'utf-8')).digest('base64')
  return {
    Authorization: token,
    sign,
    nonce,
    t,
    'Content-Type': 'application/json',
  }
}

/** デバイスの現在ステータス（body）を取得。 */
async function getStatus() {
  const res = await fetch(`https://api.switch-bot.com/v1.1/devices/${deviceId}/status`, {
    headers: authHeaders(),
  })
  const json = await res.json().catch(() => null)
  if (!json) throw new Error(`SwitchBot応答の解析に失敗（HTTP ${res.status}）`)
  if (json.statusCode !== 100) {
    throw new Error(
      `SwitchBot APIエラー: statusCode=${json.statusCode} message=${json.message ?? ''}`,
    )
  }
  return json.body ?? {}
}

/** 既存の時系列JSONを読み込む（壊れていれば空配列）。 */
function readExisting() {
  try {
    const arr = JSON.parse(readFileSync(outPath, 'utf-8'))
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const body = await getStatus()
const temp = typeof body.temperature === 'number' ? body.temperature : null
const hum = typeof body.humidity === 'number' ? body.humidity : null

if (temp === null && hum === null) {
  console.error(
    '取得したステータスに temperature / humidity が含まれていません。' +
      'デバイスIDが温湿度計（Meter系 / Hub 2 など）か確認してください。body=' +
      JSON.stringify(body),
  )
  process.exit(1)
}

const history = readExisting()
const nowSec = Math.floor(Date.now() / 1000)
history.push({ t: nowSec, temp, hum })
history.sort((a, b) => (a?.t ?? 0) - (b?.t ?? 0))
const trimmed = history.slice(-MAX_POINTS)
writeFileSync(outPath, JSON.stringify(trimmed))

console.log(`記録: ${temp ?? '—'}℃ / ${hum ?? '—'}%（合計 ${trimmed.length} 点）`)
