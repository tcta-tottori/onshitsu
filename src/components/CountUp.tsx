// 数字のカウントアップ表示。0 → value をイージングでアニメーション。
// prefers-reduced-motion 時は即座に最終値。
import { useEffect, useRef, useState } from 'react'

function reduceMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function CountUp({
  value,
  duration = 850,
  className,
}: {
  value: number | null
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState<number | null>(value)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (value === null) {
      setDisplay(null)
      return
    }
    if (reduceMotion()) {
      setDisplay(value)
      return
    }
    let startTs: number | null = null
    const target = value
    const tick = (ts: number) => {
      if (startTs === null) startTs = ts
      const t = Math.min(1, (ts - startTs) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(target * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    setDisplay(0)
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [value, duration])

  if (display === null) return <span className={className}>—</span>
  return <span className={className}>{Math.round(display)}</span>
}
