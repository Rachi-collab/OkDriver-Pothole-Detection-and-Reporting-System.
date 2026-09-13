import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Mail, MapPin } from 'lucide-react'
import { getPothole, updatePothole } from '../api/potholes'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import { format } from 'date-fns'

const STATUSES = ['reported', 'acknowledged', 'in_progress', 'resolved']

export default function PotholeDetail() {
  const { id } = useParams()
  const [pothole, setPothole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    getPothole(id)
      .then(r => { setPothole(r.data); setNewStatus(r.data.status); setNotes(r.data.notes || '') })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      const { data } = await updatePothole(id, { status: newStatus, notes })
      setPothole(data)
      toast.success('Status updated')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <p className="p-8 text-gray-400">Loading…</p>
  if (!pothole) return <p className="p-8 text-red-500">Pothole not found</p>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pothole #{pothole.id}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Reported {format(new Date(pothole.reported_at), 'dd MMM yyyy, HH:mm')}
          </p>
        </div>
        <div className="flex gap-2">
          <SeverityBadge severity={pothole.severity} />
          <StatusBadge status={pothole.status} />
        </div>
      </div>

      {/* Annotated image */}
      {pothole.image_path && (
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img
            src={`/api/potholes/${pothole.id}/image`}
            alt="Annotated pothole"
            className="w-full object-contain max-h-72 bg-gray-100"
          />
        </div>
      )}

      {/* Details grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Coordinates</p>
          <p className="font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand-600" />
            {pothole.latitude.toFixed(5)}, {pothole.longitude.toFixed(5)}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Address</p>
          <p className="font-medium">{pothole.address || '—'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Zone</p>
          <p className="font-medium">{pothole.zone || '—'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Confidence</p>
          <p className="font-medium">{pothole.confidence ? `${(pothole.confidence * 100).toFixed(1)}%` : '—'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-400 text-xs mb-0.5">Civic Authority</p>
          <p className="font-medium flex items-center gap-1">
            <Mail className="w-3 h-3 text-brand-600" />
            {pothole.authority_name || '—'}
            {pothole.authority_email && (
              <span className="text-gray-400 ml-1">({pothole.authority_email})</span>
            )}
          </p>
        </div>
      </div>

      {/* Status update */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Update Status</h2>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setNewStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition
                ${newStatus === s
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'}`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add notes (optional)"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="bg-brand-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
        >
          {updating ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
