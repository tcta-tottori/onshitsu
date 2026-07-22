// エアコンのおすすめ設定カード（今日のカードの下）。エアコン温度は固定のため
// タイマー時間と、21時〜切れるまでの目安料金を提示する。
import { JapaneseYen, Timer, Wind } from 'lucide-react'
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
            <Timer size={16} strokeWidth={2.2} />
            <span className="ac-k">タイマー</span>
            <span className="ac-v">
              {advice.timerHours}
              <small>時間</small>
            </span>
          </div>
          <span className="ac-reco-sep" aria-hidden="true" />
          <div className="ac-reco-item">
            <JapaneseYen size={16} strokeWidth={2.2} />
            <span className="ac-k">目安料金</span>
            <span className="ac-v">
              {advice.costYen}
              <small>円</small>
            </span>
          </div>
        </div>
      )}

      <p className="ac-detail">{advice.detail}</p>
      <p className="ac-note">
        ※就寝21時・起床4時を想定した不快指数（体感）による目安。料金は冷房0.5kWh/h・31円/kWhで試算。
      </p>
    </section>
  )
}
