// エアコンのおすすめ設定（冷房29℃固定）の算出。
//
// 前提：就寝ごろ（21時想定）に冷房29℃をタイマーでセットし、朝5時ごろまで
// 寝苦しくならずに眠りたい。エアコンが切れると室温は外気に向かって上がるため、
// 「外気の体感（不快指数 THI）が快適域まで下がる時刻」まで運転するのが目安。
//
// - 今夜が涼しければ（就寝〜5時の最大 THI が快適域）→ エアコン不要と案内。
// - 蒸し暑ければ → 快適域まで下がる時刻まで運転するタイマー時間を提案。
import type { NightPoint } from './derive'

/** 不快指数（THI）。日本の一般式。 */
function thi(t: number, h: number): number {
  return 0.81 * t + 0.01 * h * (0.99 * t - 14.3) + 46.3
}

const SET_HOUR = 21 // 就寝（セット）想定時刻
const WAKE_HOUR = 4 // 快適に眠りたい終了時刻（4時ごろまで快適ならOK）
const COMFORT_THI = 75 // これ未満なら寝苦しくない目安
const HOT_THI = 80 // これ以上はかなり蒸し暑い

// 電気代の目安：すでに21時までつけていて、そこから「継続運転」した分だけを見積もる。
// 室温は既に下がっている前提なので、立ち上げ（定格550W）ではなく室温維持の平均消費電力を使う。
// - 冷房：室温維持の目安 0.25kW。
// - 除湿：弱冷房除湿でさらに低め、目安 0.12kW。
const COOL_KW = 0.25
const DRY_KW = 0.12
const YEN_PER_KWH = 31 // 電気代の目安単価（円/kWh）
// 暑さ主体（気温が高い）なら冷房、湿気主体（気温はほどほどで蒸す）なら除湿。
const COOL_TEMP = 28 // この気温以上なら冷房向き

// 21,22,23,0,1,2,3,4 の並び
const WINDOW_HOURS = [21, 22, 23, 0, 1, 2, 3, 4]

export interface AirconAdvice {
  available: boolean
  /** 今夜エアコンをつけるべきか */
  shouldUse: boolean
  /** おすすめタイマー時間（時間）。shouldUse=false なら null */
  timerHours: number | null
  /** 運転を止める目安の時刻（時） */
  offHour: number | null
  setHour: number
  wakeHour: number
  /** 就寝〜5時の最大不快指数 */
  maxThi: number | null
  /** 蒸し暑さのラベル */
  comfortLabel: string
  /** おすすめ運転モード（'cool'=冷房 / 'dry'=除湿）。shouldUse=false なら null */
  mode: 'cool' | 'dry' | null
  modeLabel: string
  /** タイマー時間ぶんの電気代の目安（円）。shouldUse=false なら null */
  costCool: number | null
  costDry: number | null
  headline: string
  detail: string
}

export function adviseAircon(points: NightPoint[]): AirconAdvice {
  const base: AirconAdvice = {
    available: false,
    shouldUse: false,
    timerHours: null,
    offHour: null,
    setHour: SET_HOUR,
    wakeHour: WAKE_HOUR,
    maxThi: null,
    comfortLabel: '',
    mode: null,
    modeLabel: '',
    costCool: null,
    costDry: null,
    headline: '',
    detail: '',
  }

  const map = new Map<number, { temp: number; humidity: number; thi: number }>()
  for (const p of points) {
    if (p.temp === null || p.humidity === null) continue
    map.set(p.hour, { temp: p.temp, humidity: p.humidity, thi: thi(p.temp, p.humidity) })
  }
  const seq: Array<{ hour: number; temp: number; humidity: number; thi: number }> = []
  for (const h of WINDOW_HOURS) {
    const v = map.get(h)
    if (v !== undefined) seq.push({ hour: h, ...v })
  }
  if (seq.length < 3) return base

  const maxThi = Math.max(...seq.map((s) => s.thi))
  const comfortLabel =
    maxThi >= HOT_THI
      ? '蒸し暑い'
      : maxThi >= COMFORT_THI
        ? 'やや蒸し暑い'
        : maxThi >= 70
          ? 'おおむね快適'
          : '快適'

  // 涼しい夜：エアコン不要
  if (maxThi < COMFORT_THI) {
    return {
      ...base,
      available: true,
      shouldUse: false,
      maxThi,
      comfortLabel,
      headline: 'エアコンなしでも快適',
      detail: '就寝〜朝4時ごろの体感は快適な見込みです。窓開けや扇風機でも眠れそう。',
    }
  }

  // 蒸し暑い夜：外気の体感が快適域まで下がり、その後も戻らない最初の時刻まで運転
  let offIdx = -1
  for (let i = 1; i < seq.length; i++) {
    let ok = true
    for (let j = i; j < seq.length; j++) {
      if (seq[j].thi > COMFORT_THI) {
        ok = false
        break
      }
    }
    if (ok) {
      offIdx = i
      break
    }
  }
  const offHour = offIdx >= 0 ? seq[offIdx].hour : WAKE_HOUR
  let timerHours = (offHour + 24 - SET_HOUR) % 24
  if (timerHours === 0) timerHours = 7
  timerHours = Math.min(7, Math.max(1, timerHours))

  // 冷房 or 除湿：気温が高ければ冷房、気温はほどほどで蒸すなら除湿。
  const maxTemp = Math.max(...seq.map((s) => s.temp))
  const mode: 'cool' | 'dry' = maxTemp >= COOL_TEMP || maxThi >= HOT_THI ? 'cool' : 'dry'
  const modeLabel = mode === 'cool' ? '冷房' : '除湿'

  // 21時からタイマー切れまでを継続運転した「継続分」の電気代の目安（円）
  const costCool = Math.round(COOL_KW * timerHours * YEN_PER_KWH)
  const costDry = Math.round(DRY_KW * timerHours * YEN_PER_KWH)

  const headline = maxThi >= HOT_THI ? '蒸し暑い夜・エアコン推奨' : 'エアコン推奨'
  const detail =
    `今夜は${modeLabel}がおすすめ。${offHour}時ごろまで運転が目安で、` +
    `21時就寝なら約${timerHours}時間タイマーで朝4時ごろまで寝苦しくなりにくくなります。`

  return {
    ...base,
    available: true,
    shouldUse: true,
    timerHours,
    offHour,
    setHour: SET_HOUR,
    wakeHour: WAKE_HOUR,
    maxThi,
    comfortLabel,
    mode,
    modeLabel,
    costCool,
    costDry,
    headline,
    detail,
  }
}
