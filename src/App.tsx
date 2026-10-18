import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

type Result = {
  ip: string
  isp: string
  location: { city: string; region: string; country: string; postalCode: string; timezone: string; lat: number; lng: number }
}

async function lookup(query: string, signal: AbortSignal): Promise<Result> {
  const params = new URLSearchParams({ query })
  const response = await fetch(`/.netlify/functions/lookup?${params}`, { signal })
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(import.meta.env.DEV
      ? 'Start npm run dev:netlify and open http://localhost:8888 to enable lookups.'
      : 'The lookup function is missing. Deploy the full project to Netlify.')
  }
  if (!response.ok) {
    if (response.status >= 500) throw new Error('The lookup service is unavailable. Please try again later.')
    throw new Error('Could not find that address. Check the IP or domain and try again.')
  }
  const data: Result = await response.json()
  if (!data.ip || !Number.isFinite(data.location?.lat) || !Number.isFinite(data.location?.lng)) {
    throw new Error('No location was found. Try another address.')
  }
  return data
}

function App() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const mapElement = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const request = useRef<AbortController | null>(null)

  async function search(value: string) {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError('')
    try {
      setResult(await lookup(value.trim(), controller.signal))
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to look up this address. Try again.')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const instance = L.map(mapElement.current!, { zoomControl: false }).setView([20, 0], 2)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
    }).addTo(instance)
    L.control.zoom({ position: 'bottomright' }).addTo(instance)
    map.current = instance
    void search('')
    return () => {
      request.current?.abort()
      instance.remove()
      map.current = null
      marker.current = null
    }
  }, [])

  useEffect(() => {
    if (!result || !map.current) return
    const coordinates: L.LatLngTuple = [result.location.lat, result.location.lng]
    const icon = L.icon({ iconUrl: '/images/icon-location (1).svg', iconSize: [46, 56], iconAnchor: [23, 56] })
    if (marker.current) marker.current.setLatLng(coordinates)
    else marker.current = L.marker(coordinates, { icon, alt: 'IP address location' }).addTo(map.current)
    map.current.setView(coordinates, 13)
  }, [result])

  const location = result?.location
  const fields = [
    ['IP Address', result?.ip],
    ['Location', location && [location.city, location.region, location.country].filter(Boolean).join(', ') + (location.postalCode ? ` ${location.postalCode}` : '')],
    ['Timezone', location?.timezone ? `UTC ${location.timezone}` : undefined],
    ['ISP', result?.isp],
  ]
  return (
    <main>
      <header className="tracker-header">
        <h1>IP Address Tracker</h1>
        <form className="search" onSubmit={(event) => { event.preventDefault(); void search(query) }}>
          <label className="sr-only" htmlFor="address">IP address or domain</label>
          <input id="address" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for any IP address or domain" autoComplete="off" spellCheck={false} aria-describedby="search-status" />
          <button type="submit" aria-label="Search" disabled={loading}><img src="/images/icon-arrow.svg" alt="" /></button>
        </form>
        <p id="search-status" className="status" role="status">{loading ? 'Looking up address…' : error}</p>
        <dl className="results" aria-live="polite" aria-busy={loading}>
          {fields.map(([label, value]) => <div className="result" key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}
        </dl>
      </header>
      <div className="map" ref={mapElement} aria-label="Map of the IP address location" />
    </main>
  )
}
export default App

