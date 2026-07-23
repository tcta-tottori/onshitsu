# SwitchBot 連携（自宅の気温・湿度）

自宅の SwitchBot 温湿度計（Meter 系 / Hub 2 など）の**現在値**をトップに表示し、
カードを**タップすると過去の推移**（24時間 / 3日 / 7日 / 全期間）を確認できます。

## しくみ

ブラウザから SwitchBot API（`api.switch-bot.com`）は直接呼べません。理由は3つ：

- **CORS 未対応** — ブラウザの `fetch` がプリフライトで弾かれる
- **鍵の秘匿** — トークン/シークレットをブラウザ（＝公開されるJS）に置けない
- **履歴APIが無い** — 公式APIは「現在値」しか返さない（過去データは自前で蓄積が必要）

そこで **GitHub Actions が15分ごとにサーバー側で取得**し、`switchbot-data` ブランチの
`switchbot.json` に時系列で蓄積します。静的サイトはこの JSON を
`raw.githubusercontent.com`（CORS 許可あり）から読んで表示します。

```
GitHub Actions (15分ごと)
  └─ scripts/switchbot-poll.mjs  … SwitchBot API から現在値を取得
       └─ switchbot-data ブランチ / switchbot.json に追記（最大3000点＝約31日分）
サイト（GitHub Pages）
  └─ src/api/switchbot.ts        … raw から switchbot.json を取得
       └─ 「自宅の今」カード＋タップで履歴グラフ
```

> ⚠️ `onshitsu` は**公開リポジトリ**です。`switchbot.json`（室温・湿度の時系列）は
> 誰でも閲覧できる状態になります（在宅パターンが推測され得る点にご注意ください）。

## セットアップ手順

### 1. トークンとシークレットを取得

SwitchBot アプリ → **プロフィール → 設定 → 開発者向けオプション**
（「アプリバージョン」を10回タップすると開発者メニューが出ます）で
**トークン**と**シークレット**を取得します。

### 2. デバイスID（deviceId）を調べる

ローカルに Node があれば：

```bash
SWITCHBOT_TOKEN=xxxx SWITCHBOT_SECRET=yyyy node scripts/switchbot-devices.mjs
```

一覧から温湿度計（`deviceType` が `Meter` / `MeterPlus` / `WoIOSensor` / `Hub 2` など）の
`deviceId` を控えます。※手元に Node が無い場合は、先に手順3の Secrets のうち
TOKEN/SECRET だけ登録して手順5で一度ワークフローを回し、ログのエラーメッセージから
判断する方法もありますが、`devices` スクリプトを使うのが確実です。

### 3. リポジトリの Secrets を登録

GitHub リポジトリ → **Settings → Secrets and variables → Actions → New repository secret**
で以下の3つを登録します。

| 名前 | 値 |
| --- | --- |
| `SWITCHBOT_TOKEN` | 手順1のトークン |
| `SWITCHBOT_SECRET` | 手順1のシークレット |
| `SWITCHBOT_DEVICE_ID` | 手順2のデバイスID |

### 4. ワークフローをデフォルトブランチへ

`schedule` / `workflow_dispatch` は**デフォルトブランチ上のワークフローのみ**実行されます。
`.github/workflows/switchbot.yml` とスクリプトをデフォルトブランチにマージしてください。

### 5. 初回実行

**Actions → SwitchBot poll → Run workflow** で手動実行（または cron を待つ）。
成功すると `switchbot-data` ブランチに `switchbot.json` が作成され、
数分後にサイトへ「自宅の今」カードが表示されます。

## カスタマイズ

- **取得間隔**：`.github/workflows/switchbot.yml` の `cron`（既定 `*/15 * * * *`）を変更。
  ※GitHub の cron は混雑時に数分遅れることがあります。
- **保持点数**：`scripts/switchbot-poll.mjs` の `MAX_POINTS`（既定 3000）。
- **データの参照先**：`src/api/switchbot.ts` の `OWNER` / `REPO` / `DATA_BRANCH`。
  フォークやリポジトリ名変更時はここを合わせます。

## うまく表示されないとき

- カードが出ない → `switchbot-data` ブランチに `switchbot.json` があるか、
  Actions のログが成功しているかを確認。
- `statusCode` エラー → トークン/シークレット/デバイスIDの取り違え、または
  デバイスIDが温湿度計以外を指している可能性。
- 反映が遅い → `raw.githubusercontent.com` は数分キャッシュされます。
