# ONSHITSU（夜の気温 × 湿度）

当日19時〜翌朝7時の「今夜」に絞って、**気温と湿度**を一目で把握するための天気予報アプリ。
日中や週間の情報は補助的で、夜の冷え込みと湿り具合にフォーカスします。デフォルト地点は鳥取市。

UI は同組織の [study-deck](https://github.com/tcta-tottori/study-deck)（StudyDrill）の構成を踏襲し、
CSS 変数によるライト/ダークテーマ、モバイルファーストの単一カラム、フィンテック風のヒーローカードで統一しています。

## 画面

1. **ヒーロー（今夜サマリー）** — 今夜の気温・湿度の上下限を大きく表示
2. **夜間グラフ** — 気温（左軸・暖色）× 湿度（右軸・寒色）の二軸折れ線。各時刻に天気アイコンと降水確率を小さく表示
3. **明日以降テーブル** — 気温上下限・湿度上下限・天候・降水確率を1日1行で

## データ源

気象庁データを主軸にしたハイブリッド構成（いずれも API キー不要・CORS 対応）。

- **主軸: [Open-Meteo](https://open-meteo.com/) 気象庁MSM/GSMモデル（`models=jma_seamless`）**
  毎時の気温・湿度・降水・天気コード（WMO）と日別の気温上下限を取得。
  湿度の日別上下限は `hourly.relative_humidity_2m` を日付ごとに集計（daily に湿度は無いため）。
- **補完: 気象庁 公式予報JSON（鳥取県 = `310000`）** — 降水確率・天気の公式値（任意）
- **任意: 気象庁 AMeDAS** — 現在の気温・湿度の実況（鳥取市のときヒーローに添える）

出典表記（気象庁 / Open-Meteo）は画面下部に明記しています。

## 「今夜」ウィンドウのロジック

- 現在が **7時以降** → 今夜 = 当日19:00 〜 翌日07:00
- 現在が **7時より前**（深夜〜早朝）→ 進行中の夜 = 前日19:00 〜 当日07:00

時刻の並びは 19, 20, …, 23, 0, 1, …, 7。この範囲で毎時データを絞り込み、気温・湿度の min/max を算出します。

進行中の夜（今夜カード）で、現在時刻がこの範囲内にあるときは、その時刻の点を
自動でハイライトし、タップしたときと同じツールチップ（気温・湿度・降水確率）を表示します。

## ローカル起動

```bash
npm install
npm run dev
```

ビルド：

```bash
npm run build      # dist/ に出力
npm run preview    # ビルド結果をローカル確認
```

## 地点の追加方法

`src/lib/locations.ts` の `LOCATIONS` 配列に `{ id, name, lat, lon }` を追加するだけです。

```ts
export const LOCATIONS: Location[] = [
  { id: 'tottori', name: '鳥取市', lat: 35.5011, lon: 134.2351 },
  { id: 'yonago', name: '米子市', lat: 35.4281, lon: 133.3311 },
  { id: 'kurayoshi', name: '倉吉市', lat: 35.43, lon: 133.82 },
  // 例：新しい地点を追加
  // { id: 'iwami', name: '岩美町', lat: 35.5722, lon: 134.4331 },
]
```

`id` が `tottori` の地点でのみ AMeDAS 実況を表示します（鳥取市の観測所ID固定のため）。
他地点でも実況を出す場合は `src/api/jma.ts` の観測所IDを地点ごとに切り替えてください。

## デプロイ（GitHub Pages）

`main` への push で GitHub Actions が build → Pages へデプロイします（`.github/workflows/deploy.yml`）。
`vite.config.ts` の `base` はリポジトリ名 `/onshitsu/` に設定済みです。リポジトリ名を変える場合は合わせて変更してください。

リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。

## 技術スタック

Vite + React + TypeScript / Recharts（グラフ）/ lucide-react（アイコン）/ プレーンCSS（CSS変数によるテーマ）
