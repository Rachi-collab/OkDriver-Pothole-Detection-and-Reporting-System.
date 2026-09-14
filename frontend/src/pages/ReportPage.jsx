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
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase">
          <UploadCloud className="w-3.5 h-3.5" /> AI Pothole Detection & Report Pipeline
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Report Road Hazard
        </h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Upload an image, tag location coordinates, and our YOLOv8 AI will detect severity and auto-route to civic authorities.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">

          {/* Step 1: Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
              Upload Pothole Photo
            </label>

            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 group
                ${isDragActive ? 'border-blue-500 bg-blue-50/80 scale-[1.01]' : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-white'}`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="relative group">
                  <img src={preview} alt="Preview" className="mx-auto max-h-64 rounded-xl object-contain shadow-md" />
                  <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-semibold">
                    Click or drag to replace photo
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Drag & drop road image here, or <span className="text-blue-600 underline">browse files</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WebP — max 20 MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Location Details */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                GPS Coordinates & Location
              </label>
              <button
                type="button"
                onClick={handleLocate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" /> Use Current Location
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Latitude *</label>
                <input
                  type="number" step="any" value={lat} onChange={e => setLat(e.target.value)}
                  placeholder="e.g. 28.6139"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Longitude *</label>
                <input
                  type="number" step="any" value={lon} onChange={e => setLon(e.target.value)}
                  placeholder="e.g. 77.2090"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address (Optional)</label>
              <input
                type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Near Ring Road Flyover, MG Road"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          {/* Step 3: Submit Action */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold py-3.5 px-6 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running AI Detection & Routing Authority...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Run AI Detection & Submit Report
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Detection Result Feedback */}
      {result && (
        <div className={`rounded-2xl border p-6 space-y-4 transition-all duration-300 shadow-md ${
          result.pothole_detected
            ? 'border-red-200 bg-gradient-to-br from-red-50/90 via-orange-50/50 to-white text-slate-900'
            : 'border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white text-slate-900'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${result.pothole_detected ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {result.pothole_detected ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {result.pothole_detected ? 'Pothole Confirmed!' : 'No Road Hazard Detected'}
                </h3>
                <p className="text-xs text-slate-500">
                  {result.pothole_detected ? 'Ticket auto-dispatched to authority' : 'The submitted image looks clear'}
                </p>
              </div>
            </div>

            {result.pothole_detected && (
              <SeverityBadge severity={result.severity} />
            )}
          </div>

          {result.pothole_detected && (
            <div className="space-y-3 pt-3 border-t border-slate-200/60">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Detection Confidence</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Report ID</span>
                  <span className="text-base font-mono font-bold text-blue-600">
                    #{result.pothole_id}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/pothole/${result.pothole_id}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View Details & Map Marker →
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/map')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow hover:bg-blue-700 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" /> Open GIS Map
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

}
