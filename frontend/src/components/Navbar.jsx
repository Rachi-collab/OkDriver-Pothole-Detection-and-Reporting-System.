import { Link, useLocation } from 'react-router-dom'
import { MapPin, UploadCloud, BarChart2 } from 'lucide-react'

const links = [
  { to: '/',       label: 'Dashboard', icon: BarChart2  },
  { to: '/map',    label: 'Map',       icon: MapPin     },
  { to: '/report', label: 'Report',    icon: UploadCloud },
]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-brand-600 text-lg">
          <MapPin className="w-5 h-5" />
          OkDriver
        </Link>

        {/* Nav links */}
        <nav className="flex gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
