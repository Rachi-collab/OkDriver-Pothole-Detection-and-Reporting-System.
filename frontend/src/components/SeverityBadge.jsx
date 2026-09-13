const colours = {
  low:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  medium: 'bg-orange-100 text-orange-800 border-orange-300',
  high:   'bg-red-100   text-red-800    border-red-300',
}

export default function SeverityBadge({ severity }) {
  const cls = colours[severity] ?? colours.medium
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {severity?.toUpperCase()}
    </span>
  )
}
