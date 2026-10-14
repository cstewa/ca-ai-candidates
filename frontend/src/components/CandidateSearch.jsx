import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import './CandidateSearch.css'

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function CandidateSearch({ candidates }) {
  const [q, setQ] = useState('')

  const results = useMemo(() => {
    const term = fold(q.trim())
    if (term.length < 2) return []
    return candidates.filter(c => fold(c.name).includes(term)).slice(0, 8)
  }, [q, candidates])

  return (
    <div className="csearch">
      <div className="form-group">
        <label htmlFor="candidate-search">Search by candidate name</label>
        <input
          id="candidate-search"
          type="search"
          placeholder="e.g. Wiener, Bonta, Kiley"
          value={q}
          onChange={e => setQ(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div aria-live="polite">
        {q.trim().length >= 2 && (
          results.length ? (
            <ul className="csearch__results">
              {results.map(c => (
                <li key={c.slug}>
                  <Link to={`/candidates/${c.slug}`} className="csearch__result">
                    <span>
                      <strong>{c.name}</strong>
                      <span className="csearch__race">{c.race.title}</span>
                    </span>
                    <StatusBadge status={c.status} short />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="csearch__empty">No candidates match “{q}”.</p>
        )}
      </div>
    </div>
  )
}
