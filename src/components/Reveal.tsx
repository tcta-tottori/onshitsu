// スクロールで表示領域に入ったら、少し遅れて下から浮かび上がる（フローティング）。
// 初期表示で見えている要素はすぐに現れる。prefers-reduced-motion 時は即表示。
import { useEffect, useRef, useState, type ReactNode } from 'react'

function reduceMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // モーション低減設定・IntersectionObserver 非対応時は即表示（データが消えないよう保険）。
    if (reduceMotion() || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true)
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    // 保険：万一 observer が発火しなくても、一定時間後には必ず表示する。
    const fallback = window.setTimeout(() => setShown(true), 1200)
    return () => {
      io.disconnect()
      window.clearTimeout(fallback)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal${shown ? ' reveal-in' : ''} ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
