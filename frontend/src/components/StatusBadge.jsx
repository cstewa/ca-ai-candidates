import { STATUSES } from '../data'

export default function StatusBadge({ status, short = false }) {
  const s = STATUSES[status]
  return (
    <span className={`status status--${status}`}>
      <span className="status__dot" aria-hidden="true" />
      {short ? s.short : s.label}
    </span>
  )
}
