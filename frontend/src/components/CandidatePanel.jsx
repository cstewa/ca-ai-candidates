import { Link } from 'react-router-dom'
import RecordText from './RecordText'
import StatusBadge from './StatusBadge'
import PositionList from './PositionList'
import AskThem from './AskThem'
import { candidateMeta, ITEM_KINDS, NOT_REVIEWED_NOTE } from '../data'
import './CandidatePanel.css'

export default function CandidatePanel({ candidate: c, race, yardsticks, linkName = true, headingLevel = 3, askAnchor = false }) {
  const H = `h${headingLevel}`
  const record = c.items.filter(i => i.kind !== 'funding')
  const funding = c.items.filter(i => i.kind === 'funding')

  return (
    <article className="cpanel" aria-labelledby={`c-${c.slug}`}>
      <header className="cpanel__head">
        <H id={`c-${c.slug}`} className="cpanel__name">
          {linkName ? <Link to={`/candidates/${c.slug}`}>{c.name}</Link> : c.name}
        </H>
        <p className="cpanel__meta">{candidateMeta(c)}</p>
        <StatusBadge status={c.status} />
      </header>

      {c.positions.length > 0 && (
        <section className="cpanel__section">
          <h4 className="cpanel__label">Votes, bills and letters</h4>
          <PositionList positions={c.positions} yardsticks={yardsticks} />
        </section>
      )}

      {record.length > 0 && (
        <section className="cpanel__section">
          <h4 className="cpanel__label">Record</h4>
          <ul className="cpanel__items cpanel__items--typed">
            {record.map((i, n) => (
              <li key={n}>
                <span className="kind-chip">{ITEM_KINDS[i.kind]}</span>
                <span><RecordText text={i.body} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {funding.length > 0 && (
        <section className="cpanel__section cpanel__section--funding">
          <h4 className="cpanel__label">Outside money and endorsements</h4>
          <p className="cpanel__hint">Actions by outside groups, not statements by the candidate.</p>
          <ul className="cpanel__items">
            {funding.map((i, n) => <li key={n}><RecordText text={i.body} /></li>)}
          </ul>
        </section>
      )}

      {c.status === 'not_reviewed' && (
        <p className="cpanel__note">
          {NOT_REVIEWED_NOTE}
          {c.ballotpedia && <> <a href={c.ballotpedia} target="_blank" rel="noreferrer">Ballotpedia profile<span className="visually-hidden"> for {c.name} (opens in new tab)</span></a>.</>}
        </p>
      )}

      {c.search_note && (
        <p className="cpanel__note"><RecordText text={c.search_note} /></p>
      )}

      {c.status === 'none_found' && race && <AskThem candidate={c} race={race} anchor={askAnchor} />}
    </article>
  )
}
