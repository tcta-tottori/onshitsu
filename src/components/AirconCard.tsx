// エアコンのおすすめ設定カード（今日のカードの下）。
import { Snowflake, Timer, Wind } from 'lucide-react'
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
          <div className="ac-reco-item">
            <Snowflake size={15} strokeWidth={2.2} />
            <span className="ac-k">冷房</span>
            <span className="ac-v">29℃</span>
          </div>
          <span className="ac-reco-sep" aria-hidden="true" />
          <div className="ac-reco-item">
            <Timer size={15} strokeWidth={2.2} />
            <span className="ac-k">タイマー</span>
            <span className="ac-v">
              {advice.timerHours}
              <small>時間</small>
            </span>
          </div>
        </div>
      )}

      <p className="ac-detail">{advice.detail}</p>
      <p className="ac-note">※就寝21時・起床5時を想定した、不快指数（体感）による目安です。</p>
    </section>
  )
}
