// エアコンのおすすめ設定カード（今日のカードの下）。エアコン温度は固定のため
// タイマー時間のみ提示する。
import { Droplets, Snowflake, Timer, Wind } from 'lucide-react'
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
        <>
          <div className="ac-reco">
            <div className="ac-reco-item">
              {advice.mode === 'cool' ? (
                <Snowflake size={18} strokeWidth={2.2} />
              ) : (
                <Droplets size={18} strokeWidth={2.2} />
              )}
              <span className="ac-k">おすすめ</span>
              <span className="ac-v mode">{advice.modeLabel}</span>
            </div>
            <span className="ac-reco-sep" aria-hidden="true" />
            <div className="ac-reco-item">
              <Timer size={18} strokeWidth={2.2} />
              <span className="ac-k">タイマー</span>
              <span className="ac-v">
                {advice.timerHours}
                <small>時間</small>
              </span>
            </div>
          </div>

          <div className="ac-cost">
            <span className="ac-cost-label">電気代の目安</span>
            <span className={`ac-cost-item${advice.mode === 'cool' ? ' on' : ''}`}>
              冷房 約{advice.costCool}円
            </span>
            <span className="ac-cost-sep2" aria-hidden="true">
              /
            </span>
            <span className={`ac-cost-item${advice.mode === 'dry' ? ' on' : ''}`}>
              除湿 約{advice.costDry}円
            </span>
          </div>
        </>
      )}

      <p className="ac-detail">{advice.detail}</p>
      <p className="ac-note">
        ※就寝21時・起床4時を想定した体感（不快指数）と、実機の消費電力・31円/kWhによる目安です。
      </p>
    </section>
  )
}
