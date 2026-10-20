import { Link, useNavigate, useParams } from 'react-router-dom'
import PositionGuide from '../components/PositionGuide'
import { Loading, LoadError } from '../components/PageState'
import NotFound from './NotFound'
import { useGuide, billPath, POSITION_LABELS } from '../data'
import './Bills.css'

// One bill, vote or letter: what it is, and every candidate on this ballot with a position on it.
export default function Bill() {
  const { key } = useParams()
  const navigate = useNavigate()
  const { data, loading, error } = useGuide()

  if (loading) return <Loading />
  if (error) return <LoadError />
  const y = data.yardsticks[key]
  if (!y) return <NotFound />

  const holders = data.candidates
    .map(c => ({ c, p: c.positions.find(p => p.yardstick === y.key) }))
    .filter(x => x.p)
  const groups = Object.keys(POSITION_LABELS)
    .map(v => [v, holders.filter(h => h.p.value === v)])
    .filter(([, list]) => list.length)
  const others = data.yardstickList.filter(o => o.key !== y.key)
  // React Router numbers in-app history entries; idx > 0 means there's a page of ours to go back to.
  const canGoBack = (window.history.state?.idx ?? 0) > 0

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/bills">Bills &amp; letters</Link> / {y.short_name}
          </nav>
          <p className="page-hero__kicker">{y.level === 'state' ? 'California' : 'Federal'} {y.kind} · {y.year}</p>
          <h1>{y.name}</h1>
          {y.full_title && <p>{y.full_title}</p>}
          {canGoBack && (
            <button type="button" className="bill__back" onClick={() => navigate(-1)}>← Back to where you were</button>
          )}
        </div>
      </section>

      <div className="container bench">
        <article className="bench__item">
          {y.sponsors && <p className="bench__sponsors">{y.sponsors}</p>}
          <dl className="bench__facts">
            <dt>What it does</dt><dd>{y.what_it_does}</dd>
            <dt>Why it matters for AI safety</dt><dd>{y.why_it_matters}</dd>
            {y.outcome && (<><dt>Outcome</dt><dd>{y.outcome}</dd></>)}
          </dl>
          {y.caveat && <p className="notice">{y.caveat}</p>}
          <p className="bench__links">
            {y.text_url && <a className="bench__source" href={y.text_url} target="_blank" rel="noreferrer">Read the official bill text ↗</a>}
            {y.url && (
              <a className="bench__source" href={y.url} target="_blank" rel="noreferrer">
                {y.text_url ? 'See every legislator’s vote ↗' : 'Source ↗'}
              </a>
            )}
          </p>
        </article>

        <PositionGuide />

        <section className="bench__item" aria-labelledby="who-h">
          <h2 id="who-h" className="bill__h2">Candidates on this ballot with a position ({holders.length})</h2>
          {groups.map(([v, list]) => (
            <div key={v} className="bench__group">
              <h3>{POSITION_LABELS[v]} ({list.length})</h3>
              <ul>
                {list.map(({ c, p }) => (
                  <li key={c.slug}>
                    <Link to={`/candidates/${c.slug}`}>{c.name}</Link>
                    <span> · {c.race.title}</span>
                    {p.detail && <span className="bench__detail"> · {p.detail}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <nav className="bill__others" aria-label="Other bills and letters">
          <h2 className="bill__h2">Other bills &amp; letters</h2>
          <ul>
            {others.map(o => <li key={o.key}><Link to={billPath(o.key)}>{o.name}</Link> <span className="bench__detail">· {o.year}</span></li>)}
          </ul>
        </nav>
      </div>
    </>
  )
}
