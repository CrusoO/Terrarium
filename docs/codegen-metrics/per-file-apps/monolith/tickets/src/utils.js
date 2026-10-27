export function priorityColor(priority) {
  switch (priority) {
    case 'Critical': return '#ef4444'
    case 'High':     return '#f97316'
    case 'Medium':   return '#f59e0b'
    case 'Low':      return '#22c55e'
    default:         return '#64748b'
  }
}

export function statusColor(status) {
  switch (status) {
    case 'Open':        return { background: '#dbeafe', color: '#1d4ed8' }
    case 'In Progress': return { background: '#fef3c7', color: '#92400e' }
    case 'Resolved':    return { background: '#dcfce7', color: '#166534' }
    case 'Closed':      return { background: '#f1f5f9', color: '#475569' }
    default:            return { background: '#f1f5f9', color: '#475569' }
  }
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
