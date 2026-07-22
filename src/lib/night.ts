// 「今夜」ウィンドウ算出ロジック
//
// - 現在が 7時以降        → 今夜 = 当日19:00 〜 翌日07:00
// - 現在が 7時より前(0-6時) → 進行中の夜 = 前日19:00 〜 当日07:00
//
// hourly の ISO 文字列（"2026-07-22T19:00" のような Asia/Tokyo ローカル時刻）を
// この範囲で絞り込み、19,20,…,23,0,1,…,7 の順に並べる。

export interface NightWindow {
  /** 夜の開始日（19時が属する日）YYYY-MM-DD */
  startDate: string
  /** 夜の終了日（07時が属する日）YYYY-MM-DD */
  endDate: string
  /** 開始時刻 Date */
  start: Date
  /** 終了時刻 Date */
  end: Date
}

/** YYYY-MM-DD 文字列を返す（ローカル日付） */
function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** ローカル日付＋時でDateを作る */
function atHour(base: Date, dayOffset: number, hour: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, hour, 0, 0, 0)
  return d
}

/**
 * 今夜（または進行中の夜）のウィンドウを算出する。
 * @param now 判定基準の現在時刻（省略時は new Date()）
 */
export function getNightWindow(now: Date = new Date()): NightWindow {
  const hour = now.getHours()

  let start: Date
  let end: Date
  if (hour < 7) {
    // 深夜〜早朝：進行中の夜 = 前日19時 〜 当日7時
    start = atHour(now, -1, 19)
    end = atHour(now, 0, 7)
  } else {
    // 7時以降：今夜 = 当日19時 〜 翌日7時
    start = atHour(now, 0, 19)
    end = atHour(now, 1, 7)
  }

  return {
    startDate: toDateStr(start),
    endDate: toDateStr(end),
    start,
    end,
  }
}

/** hourly の ISO 時刻文字列（"YYYY-MM-DDTHH:mm"）を Date に変換（ローカル扱い） */
export function parseHourly(iso: string): Date {
  // Open-Meteo は timezone=Asia/Tokyo 指定時、オフセット無しのローカル時刻文字列を返す
  const [datePart, timePart] = iso.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm || 0, 0, 0)
}

/**
 * hourly 配列（time[] とその値）を今夜ウィンドウで絞り込むためのインデックスを返す。
 * 19→7 の時系列順（配列は元々昇順なので、範囲内のインデックスをそのまま返せばよい）。
 */
export function nightIndices(times: string[], win: NightWindow): number[] {
  const out: number[] = []
  for (let i = 0; i < times.length; i++) {
    const t = parseHourly(times[i]).getTime()
    if (t >= win.start.getTime() && t <= win.end.getTime()) {
      out.push(i)
    }
  }
  return out
}

/** 数値配列から null を除いた min/max。全て欠損なら null。 */
export function minMax(values: Array<number | null | undefined>): { min: number; max: number } | null {
  let min = Infinity
  let max = -Infinity
  let found = false
  for (const v of values) {
    if (v === null || v === undefined || Number.isNaN(v)) continue
    found = true
    if (v < min) min = v
    if (v > max) max = v
  }
  return found ? { min, max } : null
}
