import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Clock, Download, RefreshCw } from 'lucide-react'
import { getExportCsvUrl, getStats, listPotholes } from '../api/potholes'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import { formatDistanceToNow } from 'date-fns'

const StatCard = ({ label, value, icon: Icon, gradient, textColour }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center shadow-md`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-2xl font-extrabold tracking-tight ${textColour}`}>{value ?? 0}</p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pothole Monitoring Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time hazard tracking, severity analytics, and civic authority dispatch status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={getExportCsvUrl(filters)}
            download="potholes_report.csv"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </a>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all px-4 py-2 border border-slate-300 rounded-xl bg-white shadow-sm hover:border-slate-400"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            + Report Pothole
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Logged"  value={stats?.total} icon={AlertTriangle} gradient="from-blue-600 to-indigo-500" textColour="text-slate-900" />
        <StatCard label="In Progress"    value={s.in_progress} icon={Clock}         gradient="from-amber-500 to-orange-400" textColour="text-amber-600" />
        <StatCard label="Resolved"       value={s.resolved}    icon={CheckCircle}   gradient="from-emerald-500 to-teal-400" textColour="text-emerald-600" />
        <StatCard label="High Severity"  value={sev.high}      icon={AlertTriangle} gradient="from-red-500 to-rose-600"     textColour="text-red-600" />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Filters:</span>
          
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
            className="text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Severity: All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select
            value={filters.zone}
            onChange={e => setFilters(f => ({ ...f, zone: e.target.value }))}
            className="text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Zone: All</option>
            {['MCD North', 'MCD South', 'MCD East', 'MCD West', 'PWD SW', 'General'].map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        <span className="text-xs font-bold text-slate-400">
          Showing {potholes.length} record{potholes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5 text-left">ID</th>
                <th className="px-5 py-3.5 text-left">Location Address / Coordinates</th>
                <th className="px-5 py-3.5 text-left">Zone / Authority</th>
                <th className="px-5 py-3.5 text-left">Severity</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-left">Reported</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Fetching pothole telemetry...
                    </div>
                  </td>
                </tr>
              ) : potholes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h3 className="font-extrabold text-slate-800">No Potholes Logged Yet</h3>
                      <p className="text-xs text-slate-500">
                        No active reports match the selected filters. Submit a new photo to run AI detection.
                      </p>
                      <Link
                        to="/report"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
                      >
                        + Report a Pothole Now
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : potholes.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500">#{p.id}</td>
                  <td className="px-5 py-4 text-slate-800 font-medium max-w-xs truncate">
                    {p.address || `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs font-semibold">{p.zone || 'General'}</td>
                  <td className="px-5 py-4"><SeverityBadge severity={p.severity} /></td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(p.reported_at), { addSuffix: true })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={`/pothole/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View Report →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

