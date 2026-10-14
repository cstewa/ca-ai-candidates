import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { PositionChips } from './PositionList'
import { candidateMeta } from '../data'
import './RaceCard.css'

// Compact summary of one race, used in lists and on the ballot page.
export default function RaceCard({ race, yardsticks, headingLevel = 3 }) {
  const H = `h${headingLevel}`
  return (
    <article className="race-card">
      <header className="race-card__head">
        <H className="race-card__title">
          <Link to={`/races/${race.slug}`}>{race.title}</Link>
        </H>
        {race.note && <span className="race-card__note">{race.note}</span>}
      </header>
      <ul className="race-card__candidates">
        {race.candidates.map(c => (
          <li key={c.slug} className="race-card__candidate">
            <div className="race-card__who">
              <Link to={`/candidates/${c.slug}`} className="race-card__name">{c.name}</Link>
              <span className="race-card__meta">{candidateMeta(c)}</span>
            </div>
            <StatusBadge status={c.status} short />
            <PositionChips positions={c.positions} yardsticks={yardsticks} />
          </li>
        ))}
      </ul>
      <Link to={`/races/${race.slug}`} className="race-card__more">
        Compare full records<span className="visually-hidden"> for {race.title}</span> →
      </Link>
    </article>
  )
}
