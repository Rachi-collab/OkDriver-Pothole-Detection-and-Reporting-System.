import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { UploadCloud, MapPin, CheckCircle, AlertTriangle } from 'lucide-react'
import { detectPothole } from '../api/potholes'
import SeverityBadge from '../components/SeverityBadge'

export default function ReportPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLon(pos.coords.longitude.toFixed(6))
        toast.success('Location detected')
      },
      () => toast.error('Could not get location – please enter manually')
    )
  }

  const handleSubmit = async () => {
    if (!file) return toast.error('Please upload an image first')
    if (!lat || !lon) return toast.error('Please provide GPS coordinates')

    const fd = new FormData()
    fd.append('image', file)
    fd.append('latitude', lat)
    fd.append('longitude', lon)
    if (address) fd.append('address', address)

    setLoading(true)
    try {
      const { data } = await detectPothole(fd)
      setResult(data)
      if (data.pothole_detected) {
        toast.success(`Pothole detected! Severity: ${data.severity}`)
      } else {
        toast('No pothole detected in this image', { icon: 'ℹ️' })
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Report a Pothole</h1>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
          ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400 bg-white'}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain" />
        ) : (
          <>
            <UploadCloud className="mx-auto w-10 h-10 text-gray-400 mb-2" />
            <p className="text-gray-500">Drag & drop an image, or <span className="text-brand-600 font-medium">browse</span></p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max 20 MB</p>
          </>
        )}
      </div>

      {/* Location */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-600" /> Location
        </h2>
        <button
          onClick={handleLocate}
          className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition"
        >
          Use My Current Location
        </button>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Latitude *</label>
            <input
              type="number" step="any" value={lat} onChange={e => setLat(e.target.value)}
              placeholder="28.6139"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Longitude *</label>
            <input
              type="number" step="any" value={lon} onChange={e => setLon(e.target.value)}
              placeholder="77.2090"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Address (optional)</label>
          <input
            type="text" value={address} onChange={e => setAddress(e.target.value)}
            placeholder="Near XYZ signal, MG Road"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700
                   disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
      >
        {loading ? 'Analysing…' : 'Detect & Report Pothole'}
      </button>

      {/* Result */}
      {result && (
        <div className={`rounded-xl border p-5 space-y-3 ${result.pothole_detected ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
          <div className="flex items-center gap-2">
            {result.pothole_detected
              ? <AlertTriangle className="w-5 h-5 text-red-600" />
              : <CheckCircle className="w-5 h-5 text-green-600" />}
            <h3 className="font-semibold">
              {result.pothole_detected ? 'Pothole Detected!' : 'No Pothole Detected'}
            </h3>
          </div>
          {result.pothole_detected && (
            <>
              <div className="flex gap-3 text-sm">
                <div><span className="text-gray-500">Severity: </span><SeverityBadge severity={result.severity} /></div>
                <div><span className="text-gray-500">Confidence: </span><strong>{(result.confidence * 100).toFixed(1)}%</strong></div>
              </div>
              <p className="text-sm text-gray-600">
                A report has been sent to the responsible civic authority and the pothole has been logged on the dashboard.
              </p>
              <button
                onClick={() => navigate(`/pothole/${result.pothole_id}`)}
                className="text-brand-600 text-sm font-medium hover:underline"
              >
                View report →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
