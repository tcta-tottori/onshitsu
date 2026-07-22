// 地点選択：ヘッダーの地点名タップでシートを開き、プリセットから選ぶ。
// （StudyDrill の科目ピッカーと同じ構成）
import { useState } from 'react'
import { Check, ChevronDown, MapPin } from 'lucide-react'
import { LOCATIONS } from '../lib/locations'
import type { Location } from '../api/weather'

export default function LocationPicker({
  value,
  onChange,
}: {
  value: Location
  onChange: (loc: Location) => void
}) {
  const [open, setOpen] = useState(false)

  function choose(loc: Location) {
    setOpen(false)
    if (loc.id !== value.id) onChange(loc)
  }

  return (
    <>
      <button
        className="loc-pick"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="地点を変更"
      >
        <span className="loc-pin">
          <MapPin size={17} strokeWidth={2.2} />
        </span>
        <span className="loc-name">{value.name}</span>
        <span className="loc-caret">
          <ChevronDown size={16} strokeWidth={2.4} />
        </span>
      </button>

      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-label="地点を選択"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-title">地点を選択</div>
            {LOCATIONS.map((loc) => {
              const active = loc.id === value.id
              return (
                <button
                  key={loc.id}
                  className={`sheet-opt${active ? ' active' : ''}`}
                  onClick={() => choose(loc)}
                >
                  <span>{loc.name}</span>
                  {active && <Check size={18} strokeWidth={2.4} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
