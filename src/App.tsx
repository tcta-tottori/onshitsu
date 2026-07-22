import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { fetchWeather, type Location, type WeatherData } from './api/weather'
import { DEFAULT_LOCATION } from './lib/locations'
import { deriveNight, deriveNightCards, deriveNightForecast } from './lib/derive'
import { adviseAircon } from './lib/aircon'
import NightSummary from './components/NightSummary'
import NightChart from './components/NightChart'
import ForecastTable from './components/ForecastTable'
import LocationPicker from './components/LocationPicker'
import AirconCard from './components/AirconCard'
import Reveal from './components/Reveal'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: WeatherData }
  | { status: 'error'; message: string }

export default function App() {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
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

  const derived = useMemo(() => {
    if (state.status !== 'ready') return null
    const now = nowRef.current
    const night = deriveNight(state.data, now, state.data.hourly.precipitation_probability)
    const forecast = deriveNightForecast(state.data, now, 6)
    const cards = deriveNightCards(state.data, now, 3)
    const aircon = adviseAircon(night.points)
    return { night, forecast, cards, aircon }
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
              <NightSummary cards={derived.cards} />
            </Reveal>

            {derived.aircon.available && (
              <Reveal>
                <AirconCard advice={derived.aircon} />
              </Reveal>
            )}

            <Reveal>
              <div className="sec-head">
                <h2>今夜の推移</h2>
              </div>
            </Reveal>
            <NightChart series={derived.night} />

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
