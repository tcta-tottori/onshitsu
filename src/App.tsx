import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { fetchWeather, type Location, type WeatherData } from './api/weather'
import { fetchJmaReportDatetime } from './api/jma'
import { DEFAULT_LOCATION } from './lib/locations'
import { deriveNightCards, deriveNightForecast } from './lib/derive'
import { adviseAircon } from './lib/aircon'
import NightSummary from './components/NightSummary'
import ForecastTable from './components/ForecastTable'
import LocationPicker from './components/LocationPicker'
import AirconCard from './components/AirconCard'
import Reveal from './components/Reveal'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: WeatherData }
  | { status: 'error'; message: string }

/** 気象庁データの発表（更新）時刻を日本時間で "M/D HH:MM" と表す */
function fmtStamp(d: Date): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`
}

export default function App() {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  // 気象庁公式予報の発表（更新）時刻。取得できなければ非表示。
  const [dataTime, setDataTime] = useState<Date | null>(null)
  // 再取得トリガ
  const [reloadKey, setReloadKey] = useState(0)
  // now は再取得のたびに更新（夜ウィンドウ判定用）
  const nowRef = useRef(new Date())

  // 主軸データ取得
  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: 'loading' })
    nowRef.current = new Date()
    fetchWeather(location, ctrl.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return
        const message =
          e instanceof Error
            ? e.message
            : 'ネットワークに接続できませんでした。通信環境を確認して再取得してください。'
        setState({ status: 'error', message })
      })
    return () => ctrl.abort()
  }, [location, reloadKey])

  // 気象庁公式予報の発表時刻を取得（添え物。失敗しても主軸表示は壊さない）。
  useEffect(() => {
    const ctrl = new AbortController()
    setDataTime(null)
    fetchJmaReportDatetime(undefined, ctrl.signal)
      .then((d) => {
        if (!ctrl.signal.aborted && d) setDataTime(d)
      })
      .catch(() => {
        /* 取得失敗時はスタンプ非表示のまま */
      })
    return () => ctrl.abort()
  }, [location, reloadKey])

  const derived = useMemo(() => {
    if (state.status !== 'ready') return null
    const now = nowRef.current
    const pop = state.data.hourly.precipitation_probability
    const forecast = deriveNightForecast(state.data, now, 5, pop)
    const cards = deriveNightCards(state.data, now, 3, pop)
    const aircon = adviseAircon(cards[0]?.series.points ?? [])
    return { forecast, cards, aircon }
  }, [state])

  // 初回の気象データ読込が終わったら起動ローダー（#boot）を隠す
  useEffect(() => {
    if (state.status === 'ready' || state.status === 'error') {
      ;(window as unknown as { __bootFinish?: () => void }).__bootFinish?.()
    }
  }, [state.status])

  const retry = () => setReloadKey((k) => k + 1)

  return (
    <div className="app">
      {state.status === 'ready' && dataTime && (
        <div className="data-stamp">DATA:{fmtStamp(dataTime)}</div>
      )}
      <header className="appbar">
        <div className="brand">
          <img
            className="brand-mark"
            src={`${import.meta.env.BASE_URL}icon.png`}
            alt=""
            width={38}
            height={38}
          />
          <span className="brand-name">ONSHITSU</span>
        </div>
        <span className="spacer" />
        <LocationPicker value={location} onChange={setLocation} />
      </header>

      <main className="screen">
        {state.status === 'loading' && (
          <div className="state" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            予報を読み込んでいます…
          </div>
        )}

        {state.status === 'error' && (
          <div className="state error" role="alert">
            <div className="err-title">予報を取得できませんでした</div>
            <p className="err-msg">{state.message}</p>
            <button className="retry-btn" onClick={retry}>
              <RefreshCw size={16} strokeWidth={2.4} />
              再取得する
            </button>
          </div>
        )}

        {state.status === 'ready' && derived && (
          <>
            <Reveal>
              <NightSummary cards={derived.cards} now={nowRef.current} />
            </Reveal>

            {derived.aircon.available && (
              <Reveal>
                <AirconCard advice={derived.aircon} />
              </Reveal>
            )}

            <Reveal>
              <div className="sec-head">
                <h2>明日以降の予報</h2>
              </div>
            </Reveal>
            <ForecastTable rows={derived.forecast} />
          </>
        )}
      </main>

      <footer className="credits">
        <div>
          予報：気象庁MSM/GSMモデル（
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
            Open-Meteo
          </a>
          ）
          <span className="cr-sep">|</span>
          出典：
          <a href="https://www.jma.go.jp/" target="_blank" rel="noopener noreferrer">
            気象庁
          </a>
        </div>
      </footer>
    </div>
  )
}
