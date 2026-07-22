import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 起動ローダー（index.html の #boot）は「気象データの読込が終わるまで」表示する。
// 実際に隠すのは App が window.__bootFinish() を呼んだとき（データ ready / error 時）。

// 通知用 Service Worker を登録（モバイルでの通知表示に必要）。
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* 登録失敗時は通知はデスクトップの new Notification にフォールバック */
    })
  })
}

