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

// 21,22,23,0,1,2,3,4 の並び
const WINDOW_HOURS = [21, 22, 23, 0, 1, 2, 3, 4]

// 料金・エアコン使用時シミュレーションの前提
const AC_SET_TEMP = 29 // 冷房設定温度（固定）
const AC_KWH_PER_HOUR = 0.5 // 冷房の1時間あたり消費電力量の目安(kWh)
const YEN_PER_KWH = 31 // 電気料金の目安単価(円/kWh)
const AC_HUMIDITY = 58 // 冷房・除湿運転時の室内湿度の目安(%)
const TAU_TEMP = 2.5 // 消灯後、室温が外気へ戻る時定数(h)
const TAU_HUM = 1.8 // 消灯後、湿度が外気へ戻る時定数(h)

export interface AirconAdvice {
  available: boolean
  /** 今夜エアコンをつけるべきか */
  shouldUse: boolean
  /** おすすめタイマー時間（時間）。shouldUse=false なら null */
  timerHours: number | null
  /** 運転を止める目安の時刻（時） */
  offHour: number | null
  /** 21時〜offまでの目安電気料金(円)。shouldUse=false なら null */
  costYen: number | null
  setHour: number
  wakeHour: number
  /** 就寝〜5時の最大不快指数 */
  maxThi: number | null
  /** 蒸し暑さのラベル */
  comfortLabel: string
  headline: string
  detail: string
}

export function adviseAircon(points: NightPoint[]): AirconAdvice {
  const base: AirconAdvice = {
    available: false,
    shouldUse: false,
    timerHours: null,
    offHour: null,
    costYen: null,
    setHour: SET_HOUR,
    wakeHour: WAKE_HOUR,
    maxThi: null,
    comfortLabel: '',
    headline: '',
    detail: '',
  }

  const map = new Map<number, number>()
  for (const p of points) {
    if (p.temp === null || p.humidity === null) continue
    map.set(p.hour, thi(p.temp, p.humidity))
  }
  const seq: Array<{ hour: number; thi: number }> = []
  for (const h of WINDOW_HOURS) {
    const v = map.get(h)
    if (v !== undefined) seq.push({ hour: h, thi: v })
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

  const costYen = Math.round(AC_KWH_PER_HOUR * timerHours * YEN_PER_KWH)

  const headline = maxThi >= HOT_THI ? '蒸し暑い夜・エアコン推奨' : 'エアコン推奨'
  const detail =
    `${offHour}時ごろまで運転するのが目安。` +
    `21時就寝なら約${timerHours}時間タイマーで、朝4時ごろまで寝苦しくなりにくくなります。`

  return {
    ...base,
    available: true,
    shouldUse: true,
    timerHours,
    offHour,
    costYen,
    setHour: SET_HOUR,
    wakeHour: WAKE_HOUR,
    maxThi,
    comfortLabel,
    headline,
    detail,
  }
}

/**
 * 「エアコン使用時」の室内の気温・湿度シミュレーション（今夜の推移グラフ用）。
 * 21時〜off の間は冷房29℃（湿度は除湿で下がる）、off 以降は外気へ徐々に戻る。
 * shouldUse でない場合は元の予報をそのまま返す。
 */
export function simulateAcNight(points: NightPoint[], advice: AirconAdvice): NightPoint[] {
  if (!advice.shouldUse || advice.offHour === null) return points
  const posSet = points.findIndex((p) => p.hour === SET_HOUR)
  const posOff = points.findIndex((p) => p.hour === advice.offHour)
  if (posSet < 0 || posOff < 0) return points

  const outTOff = points[posOff].temp
  const outHOff = points[posOff].humidity
  const indoorTOff = outTOff !== null ? Math.min(outTOff, AC_SET_TEMP) : AC_SET_TEMP
  const indoorHOff = outHOff !== null ? Math.min(outHOff, AC_HUMIDITY) : AC_HUMIDITY

  return points.map((p, i) => {
    let t = p.temp
    let h = p.humidity
    if (i >= posSet && i < posOff) {
      // 冷房運転中：外気と設定温度の低い方（除湿で湿度も低下）
      if (p.temp !== null) t = Math.min(p.temp, AC_SET_TEMP)
      if (p.humidity !== null) h = Math.min(p.humidity, AC_HUMIDITY)
    } else if (i >= posOff) {
      // 消灯後：外気に向かって指数的に戻る
      const dt = i - posOff
      if (p.temp !== null) t = p.temp + (indoorTOff - p.temp) * Math.exp(-dt / TAU_TEMP)
      if (p.humidity !== null) h = p.humidity + (indoorHOff - p.humidity) * Math.exp(-dt / TAU_HUM)
    }
    return {
      ...p,
      temp: t === null ? null : Math.round(t * 10) / 10,
      humidity: h === null ? null : Math.round(h),
    }
  })
}
