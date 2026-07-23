// SwitchBot に登録済みのデバイス一覧を表示するヘルパー。
// デバイスID（deviceId）を調べて Secrets の SWITCHBOT_DEVICE_ID に設定するために使う。
//
// 使い方: SWITCHBOT_TOKEN=... SWITCHBOT_SECRET=... node scripts/switchbot-devices.mjs
import crypto from 'node:crypto'

const token = process.env.SWITCHBOT_TOKEN
const secret = process.env.SWITCHBOT_SECRET

if (!token || !secret) {
  console.error('SWITCHBOT_TOKEN / SWITCHBOT_SECRET を環境変数に設定してください。')
  process.exit(1)
}

function authHeaders() {
  const t = Date.now().toString()
  const nonce = crypto.randomUUID()
  const data = token + t + nonce
  const sign = crypto.createHmac('sha256', secret).update(Buffer.from(data, 'utf-8')).digest('base64')
  return { Authorization: token, sign, nonce, t, 'Content-Type': 'application/json' }
}

const res = await fetch('https://api.switch-bot.com/v1.1/devices', { headers: authHeaders() })
const json = await res.json().catch(() => null)
if (!json || json.statusCode !== 100) {
  console.error(`取得失敗: statusCode=${json?.statusCode} message=${json?.message ?? ''}`)
  process.exit(1)
}

const devices = json.body?.deviceList ?? []
if (devices.length === 0) {
  console.log('デバイスが見つかりませんでした。')
} else {
  console.log('deviceId\t\tdeviceType\tdeviceName')
  for (const d of devices) {
    console.log(`${d.deviceId}\t${d.deviceType}\t${d.deviceName}`)
  }
}
