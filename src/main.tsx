import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 起動ローダー（index.html の #boot）をアプリ描画後にフェードアウトして隠す。
// 一瞬で消えるチラつきを避けるため、最低600msは表示する。
const boot = document.getElementById('boot')
if (boot) {
  const hide = () => {
    boot.classList.add('boot-hide')
    setTimeout(() => {
      boot.style.display = 'none'
    }, 460)
  }
  const started = performance.now()
  const wait = Math.max(0, 600 - (performance.now() - started))
  setTimeout(hide, wait)
}
