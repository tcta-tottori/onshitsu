import type { Location } from '../api/weather'

// プリセット地点。デフォルトは鳥取市。
// （余裕があれば Open-Meteo Geocoding API で自由入力も可。まずはプリセット優先。）
export const LOCATIONS: Location[] = [
  { id: 'tottori', name: '鳥取市', lat: 35.5011, lon: 134.2351 },
  { id: 'yonago', name: '米子市', lat: 35.4281, lon: 133.3311 },
  { id: 'kurayoshi', name: '倉吉市', lat: 35.43, lon: 133.82 },
]

export const DEFAULT_LOCATION = LOCATIONS[0]

export function findLocation(id: string): Location {
  return LOCATIONS.find((l) => l.id === id) ?? DEFAULT_LOCATION
}
