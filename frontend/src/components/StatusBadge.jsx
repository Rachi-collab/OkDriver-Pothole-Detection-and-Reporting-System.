const colours = {
  reported:     'bg-blue-100   text-blue-800   border-blue-300',
  acknowledged: 'bg-purple-100 text-purple-800 border-purple-300',
  in_progress:  'bg-amber-100  text-amber-800  border-amber-300',
  resolved:     'bg-green-100  text-green-800  border-green-300',
}

const labels = {
  reported:     'Reported',
  acknowledged: 'Acknowledged',
  in_progress:  'In Progress',
  resolved:     'Resolved',
}

export default function StatusBadge({ status }) {
  const cls = colours[status] ?? colours.reported
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}
