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
