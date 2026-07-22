import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, BellOff, RefreshCw } from 'lucide-react'
import { fetchWeather, type Location, type WeatherData } from './api/weather'
import { DEFAULT_LOCATION } from './lib/locations'
import { deriveNight, deriveNightCards, deriveNightForecast } from './lib/derive'
import { weatherFromCode } from './lib/weatherCode'
import {
  formatNightBody,
  isNotifyEnabled,
  notifySupported,
  requestPermission,
  scheduleNightNotify,
  setNotifyEnabled,
  showNotification,
  type NightNotifyData,
} from './lib/notify'
import NightSummary from './components/NightSummary'
import NightChart from './components/NightChart'
import ForecastTable from './components/ForecastTable'
import LocationPicker from './components/LocationPicker'
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
    return { night, forecast, cards }
  }, [state])

  // 初回の気象データ読込が終わったら起動ローダー（#boot）を隠す
  useEffect(() => {
    if (state.status === 'ready' || state.status === 'error') {
      ;(window as unknown as { __bootFinish?: () => void }).__bootFinish?.()
    }
  }, [state.status])

  const retry = () => setReloadKey((k) => k + 1)

  // --- 17時通知 ---
  const [notifyOn, setNotifyOn] = useState(() => isNotifyEnabled())
  // 最新の「今夜」サマリーをスケジューラから参照できるよう ref に保持
  const notifyDataRef = useRef<NightNotifyData | null>(null)
  useEffect(() => {
    if (!derived) return
    const c = derived.cards[0]
    notifyDataRef.current = {
      locationName: location.name,
      tempHigh: c.tempHigh,
      tempLow: c.tempLow,
      humHigh: c.humHigh,
      humLow: c.humLow,
      weatherLabel: weatherFromCode(c.weatherCode).label,
    }
  }, [derived, location])

  // ON の間だけ 17時通知をスケジュール（アプリが開いている間のみ動作）
  useEffect(() => {
    if (!notifyOn) return
    return scheduleNightNotify(() => notifyDataRef.current)
  }, [notifyOn])

  const toggleNotify = useCallback(async () => {
    if (notifyOn) {
      setNotifyEnabled(false)
      setNotifyOn(false)
      return
    }
    const perm = await requestPermission()
    if (perm === 'granted') {
      setNotifyEnabled(true)
      setNotifyOn(true)
      const d = notifyDataRef.current
      void showNotification(
        '🌙 通知をオンにしました',
        d
          ? `毎日17時に今夜の予報をお知らせします。\n${formatNightBody(d)}`
          : '毎日17時に今夜の予報をお知らせします。',
      )
    } else if (perm === 'denied') {
      alert(
        '通知がブロックされています。ブラウザ／端末の設定でこのサイトの通知を許可してください。',
      )
    }
  }, [notifyOn])

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
        {notifySupported() && (
          <button
            className={`tctrl-btn${notifyOn ? ' on' : ''}`}
            onClick={toggleNotify}
            aria-label={notifyOn ? '17時通知をオフにする' : '17時に今夜の予報を通知する'}
            aria-pressed={notifyOn}
            title={notifyOn ? '17時通知：オン' : '17時通知：オフ'}
          >
            {notifyOn ? <Bell size={19} strokeWidth={2.2} /> : <BellOff size={19} strokeWidth={2.2} />}
          </button>
        )}
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
