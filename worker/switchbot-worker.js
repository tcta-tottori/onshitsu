// SwitchBot 中継 Worker（Cloudflare Workers）
//
// ブラウザ（公開サイト）からは SwitchBot API を直接叩けない：
//  - CORS 未対応
//  - TOKEN / SECRET を公開サイトに置けない（機器を第三者に操作されてしまう）
//  - 公式APIに履歴取得が無い（現在値のみ）
// そこで鍵を安全に持つこの Worker を1つ挟み、アプリ→Worker→SwitchBot と取得する。
// 取得値は Workers KV に蓄積し、履歴として返す。GitHub の cron に依存しない。
//
// 必要な設定（Cloudflare 側）:
//  - KV Namespace を作り、Variable 名 `HISTORY` でバインド
//  - Secrets: SWITCHBOT_TOKEN / SWITCHBOT_SECRET / SWITCHBOT_DEVICE_ID
//
// エンドポイント:
//  - GET /history … 蓄積済みの履歴だけを返す（SwitchBot は叩かない・高速）
//  - GET /poll    … 現在値を取得して追記し、更新後の履歴を返す（「更新」ボタン／起動時）
//  - GET /        … /poll と同じ

const KV_KEY = 'history'
const MAX_POINTS = 3000 // 15分間隔で約31日分
const MIN_INTERVAL = 120 // 秒。これ未満での連続取得は追記しない（多重リロード対策）

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS })
    }

    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/'

    if (path === '/history') {
      return json(await readHistory(env))
    }

    if (path === '/' || path === '/poll') {
      let history = await readHistory(env)
      const now = Math.floor(Date.now() / 1000)
      const last = history[history.length - 1]

      // 直近取得から MIN_INTERVAL 未満なら SwitchBot を叩かずそのまま返す。
      if (last && now - last.t < MIN_INTERVAL) {
        return json(history)
      }

      try {
        const body = await getStatus(env)
        const temp = typeof body.temperature === 'number' ? body.temperature : null
        const hum = typeof body.humidity === 'number' ? body.humidity : null
        if (temp !== null || hum !== null) {
          history.push({ t: now, temp, hum })
          history.sort((a, b) => a.t - b.t)
          history = history.slice(-MAX_POINTS)
          await env.HISTORY.put(KV_KEY, JSON.stringify(history))
        }
      } catch (e) {
        // 取得失敗時は既存履歴を返す（アプリ側は壊さない）。
        return json(history)
      }
      return json(history)
    }

    return new Response('Not found', { status: 404, headers: CORS })
  },
}

async function readHistory(env) {
  try {
    const raw = await env.HISTORY.get(KV_KEY)
    const arr = JSON.parse(raw || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { ...CORS, 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

// SwitchBot API v1.1 の現在ステータスを取得（HMAC-SHA256 署名）。
async function getStatus(env) {
  const token = env.SWITCHBOT_TOKEN
  const secret = env.SWITCHBOT_SECRET
  const deviceId = env.SWITCHBOT_DEVICE_ID
  if (!token || !secret || !deviceId) {
    throw new Error('SWITCHBOT_TOKEN / SWITCHBOT_SECRET / SWITCHBOT_DEVICE_ID を設定してください。')
  }

  const t = Date.now().toString()
  const nonce = crypto.randomUUID()
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(token + t + nonce))
  const sign = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))

  const res = await fetch(`https://api.switch-bot.com/v1.1/devices/${deviceId}/status`, {
    headers: {
      Authorization: token,
      sign,
      nonce,
      t,
      'Content-Type': 'application/json',
    },
  })
  const j = await res.json().catch(() => null)
  if (!j || j.statusCode !== 100) {
    throw new Error(`SwitchBot APIエラー: statusCode=${j ? j.statusCode : 'なし'}`)
  }
  return j.body || {}
}
