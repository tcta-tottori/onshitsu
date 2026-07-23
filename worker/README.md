# SwitchBot 中継 Worker（Cloudflare Workers）

アプリ（ブラウザ）から SwitchBot の現在値をその場で取得・記録するための、無料の中継サーバーです。
鍵（TOKEN/SECRET）はこの Worker 内にだけ置き、公開サイトには出しません。

- `GET /poll` … 現在値を取得して履歴に追記し、更新後の履歴（配列）を返す ← アプリの「更新」ボタン／起動時
- `GET /history` … 蓄積済みの履歴だけ返す

---

## セットアップ（ダッシュボードで作る・推奨 / 10〜15分）

### 1. Worker を作成
1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**
2. 名前を `onshitsu-switchbot` などにして **Deploy**
3. **Edit code** を開き、[`switchbot-worker.js`](./switchbot-worker.js) の中身を全部貼り付け → **Deploy**

### 2. KV（履歴の保存先）を作ってバインド
1. 左メニュー **Storage & Databases** → **KV** → **Create namespace**（名前は `onshitsu-history` など）
2. Worker の **Settings** → **Bindings** → **Add binding** → **KV namespace**
   - Variable name: `HISTORY`
   - KV namespace: いま作ったもの
   - **Save**

### 3. Secrets（SwitchBot の鍵）を登録
Worker の **Settings** → **Variables and Secrets** → **Add** で、種別を **Secret** にして3つ登録:

| 名前 | 値 |
|---|---|
| `SWITCHBOT_TOKEN` | SwitchBot アプリで発行したトークン |
| `SWITCHBOT_SECRET` | 同シークレット |
| `SWITCHBOT_DEVICE_ID` | 温湿度計のデバイスID（GitHub の Secrets と同じ値でOK） |

> 値は既に GitHub Actions の Secrets に入れているものと同じです。

### 4. 動作確認
ブラウザで `https://onshitsu-switchbot.<あなたのサブドメイン>.workers.dev/poll` を開く。
`[{"t":...,"temp":...,"hum":...}]` のような JSON が返れば成功です。

### 5. URL を共有
表示された Worker の URL（`https://onshitsu-switchbot.xxxx.workers.dev`）を教えてください。
アプリ側（`src/api/switchbot.ts` の `SWITCHBOT_API`）に設定してデプロイします。

---

## セットアップ（wrangler CLI で作る場合）

```bash
cd worker
npx wrangler kv namespace create HISTORY   # 出力された id を wrangler.toml に貼る
npx wrangler secret put SWITCHBOT_TOKEN
npx wrangler secret put SWITCHBOT_SECRET
npx wrangler secret put SWITCHBOT_DEVICE_ID
npx wrangler deploy
```
