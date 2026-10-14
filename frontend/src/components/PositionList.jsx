import { Link } from 'react-router-dom'
import { POSITION_LABELS } from '../data'

// Compact chips: "SB 53 · Voted yes". Every value is styled the same way on purpose.
export function PositionChips({ positions, yardsticks }) {
  if (!positions.length) return null
  return (
    <ul className="chips" aria-label="Recorded positions">
      {positions.map(p => (
        <li key={p.yardstick} className="chip" title={p.detail || undefined}>
          <span className="chip__name">{yardsticks[p.yardstick].short_name}</span>
          <span className="chip__value">{POSITION_LABELS[p.value]}</span>
        </li>
      ))}
    </ul>
  )
}

// Full list with details, used on race and candidate pages.
export default function PositionList({ positions, yardsticks }) {
  if (!positions.length) return null
  return (
    <dl className="positions">
      {positions.map(p => {
        const y = yardsticks[p.yardstick]
        return (
          <div key={p.yardstick} className="positions__row">
            <dt>
              <Link to={`/benchmarks#${y.key}`}>{y.short_name}</Link>
              <span className="positions__year">{y.year}</span>
            </dt>
            <dd>
              <strong>{POSITION_LABELS[p.value]}</strong>
              {p.detail && <span className="positions__detail">{p.detail}</span>}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
