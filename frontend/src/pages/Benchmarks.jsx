import { Link } from 'react-router-dom'
import { Loading, LoadError } from '../components/PageState'
import { useGuide, POSITION_LABELS } from '../data'
import './Benchmarks.css'

export default function Benchmarks() {
  const { data, loading, error } = useGuide()

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Bills, votes and letters</h1>
          <p>
            The benchmarks used throughout this guide. For each one, you can see which candidates on this
            ballot have a recorded position.
          </p>
        </div>
      </section>

      <div className="container bench">
        {loading && <Loading />}
        {error && <LoadError />}
        {data && data.yardstickList.map(y => {
          const holders = data.candidates
            .map(c => ({ c, p: c.positions.find(p => p.yardstick === y.key) }))
            .filter(x => x.p)
          const groups = Object.keys(POSITION_LABELS)
            .map(v => [v, holders.filter(h => h.p.value === v)])
            .filter(([, list]) => list.length)

          return (
            <article key={y.key} id={y.key} className="bench__item">
              <header>
                <p className="bench__meta">{y.level === 'state' ? 'California' : 'Federal'} {y.kind} · {y.year}</p>
                <h2>{y.name}</h2>
                {y.full_title && <p className="bench__full">{y.full_title}</p>}
                {y.sponsors && <p className="bench__sponsors">{y.sponsors}</p>}
              </header>
              <dl className="bench__facts">
                <dt>What it does</dt><dd>{y.what_it_does}</dd>
                <dt>Why it matters for AI safety</dt><dd>{y.why_it_matters}</dd>
                {y.outcome && (<><dt>Outcome</dt><dd>{y.outcome}</dd></>)}
              </dl>
              {y.caveat && <p className="notice">{y.caveat}</p>}
              {y.url && <p><a className="bench__source" href={y.url} target="_blank" rel="noreferrer">Source ↗</a></p>}

              <details className="bench__who">
                <summary>Candidates on this ballot with a recorded position ({holders.length})</summary>
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
              </details>
            </article>
          )
        })}
      </div>
    </>
  )
}
