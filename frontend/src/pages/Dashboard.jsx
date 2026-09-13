import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Clock, Download, RefreshCw } from 'lucide-react'
import { getExportCsvUrl, getStats, listPotholes } from '../api/potholes'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import { formatDistanceToNow } from 'date-fns'

const StatCard = ({ label, value, icon: Icon, colour }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
    <div className={`p-3 rounded-lg ${colour}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value ?? '–'}</p>
    </div>
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [potholes, setPotholes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', severity: '', zone: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, listRes] = await Promise.all([
        getStats(),
        listPotholes({ limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }),
      ])
      setStats(statsRes.data)
      setPotholes(listRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [filters])

  const s = stats?.by_status ?? {}
  const sev = stats?.by_severity ?? {}

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pothole Dashboard</h1>
        <div className="flex items-center gap-2">
          <a
            href={getExportCsvUrl(filters)}
            download="potholes_report.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-gray-500" /> Export CSV
          </a>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition px-3 py-1.5 border border-gray-300 rounded-lg bg-white shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Reported"  value={stats?.total}          icon={AlertTriangle} colour="bg-blue-500"   />
        <StatCard label="In Progress"     value={s.in_progress}         icon={Clock}         colour="bg-amber-500"  />
        <StatCard label="Resolved"        value={s.resolved}            icon={CheckCircle}   colour="bg-green-500"  />
        <StatCard label="High Severity"   value={sev.high}              icon={AlertTriangle} colour="bg-red-500"    />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        >
          <option value="">Status: All</option>
          <option value="reported">Reported</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={filters.severity}
          onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        >
          <option value="">Severity: All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          value={filters.zone}
          onChange={e => setFilters(f => ({ ...f, zone: e.target.value }))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        >
          <option value="">Zone: All</option>
          {['MCD North', 'MCD South', 'MCD East', 'MCD West', 'PWD SW', 'General'].map(z => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>


      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['ID', 'Location', 'Zone', 'Severity', 'Status', 'Reported', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading…</td></tr>
            ) : potholes.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No potholes found</td></tr>
            ) : potholes.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-mono text-gray-500">#{p.id}</td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                  {p.address || `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.zone || '—'}</td>
                <td className="px-4 py-3"><SeverityBadge severity={p.severity} /></td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  {formatDistanceToNow(new Date(p.reported_at), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <Link to={`/pothole/${p.id}`} className="text-brand-600 hover:underline font-medium">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
