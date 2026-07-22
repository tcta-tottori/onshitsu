// エアコンのおすすめ設定カード（今日のカードの下）。エアコン温度は固定のため
// タイマー時間のみ提示する。
import { Timer, Wind } from 'lucide-react'
import type { AirconAdvice } from '../lib/aircon'

export default function AirconCard({ advice }: { advice: AirconAdvice }) {
  if (!advice.available) return null

  return (
    <section className={`card aircon${advice.shouldUse ? '' : ' ac-ok'}`} aria-label="エアコンのおすすめ">
      <div className="ac-head">
        <span className="ac-ic">
          <Wind size={16} strokeWidth={2.2} />
        </span>
        <span className="ac-title">エアコンのおすすめ</span>
        <span className={`ac-chip${advice.shouldUse ? '' : ' ok'}`}>{advice.comfortLabel}</span>
      </div>

      <div className="ac-headline">{advice.headline}</div>

      {advice.shouldUse && (
        <div className="ac-reco">
          <div className="ac-reco-item single">
            <Timer size={18} strokeWidth={2.2} />
            <span className="ac-k">おすすめタイマー</span>
            <span className="ac-v">
              {advice.timerHours}
              <small>時間</small>
            </span>
          </div>
        </div>
      )}

      <p className="ac-detail">{advice.detail}</p>
      <p className="ac-note">※就寝21時・起床4時を想定した、不快指数（体感）による目安です。</p>
    </section>
  )
}
