import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { listPotholes } from '../api/potholes'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import { Link } from 'react-router-dom'

const severityColour = { low: '#f59e0b', medium: '#f97316', high: '#ef4444' }

export default function MapView() {
  const [potholes, setPotholes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPotholes({ limit: 200 })
      .then(r => setPotholes(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Centre on first pothole or fallback to Delhi
  const centre = potholes.length
    ? [potholes[0].latitude, potholes[0].longitude]
    : [28.6139, 77.2090]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Pothole Map</h1>
      {loading && <p className="text-gray-400 text-sm">Loading…</p>}

      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '70vh' }}>
        <MapContainer center={centre} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {potholes.map(p => (
            <CircleMarker
              key={p.id}
              center={[p.latitude, p.longitude]}
              radius={10}
              pathOptions={{
                color: severityColour[p.severity] ?? '#6b7280',
                fillColor: severityColour[p.severity] ?? '#6b7280',
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm space-y-1 min-w-[180px]">
                  <p className="font-semibold">Pothole #{p.id}</p>
                  <div className="flex gap-1 flex-wrap">
                    <SeverityBadge severity={p.severity} />
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-gray-500">{p.address || 'No address'}</p>
                  <p className="text-gray-400 text-xs">{p.zone}</p>
                  <Link
                    to={`/pothole/${p.id}`}
                    className="text-blue-600 hover:underline block mt-1"
                  >
                    View details →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-gray-600">
        {Object.entries(severityColour).map(([sev, col]) => (
          <div key={sev} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: col }} />
            {sev.charAt(0).toUpperCase() + sev.slice(1)} severity
          </div>
        ))}
      </div>
    </div>
  )
}
