import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Loading, LoadError } from '../components/PageState'
import { useGuide, POSITION_LABELS } from '../data'
import './Benchmarks.css'

export default function Benchmarks() {
  const { data, loading, error } = useGuide()
  const { hash } = useLocation()

  // Arriving from a bill chip (/benchmarks#sb53): scroll to that bill once it has loaded.
  useEffect(() => {
    if (!data || !hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, [data, hash])

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Bills, votes and letters</h1>
          <p>
            What each bill and letter in this guide does, in plain language, with a link to the official text.
            For each one, you can see which candidates on this ballot have a recorded position.
          </p>
        </div>
      </section>

      <div className="container bench">
        {loading && <Loading />}
        {error && <LoadError />}
        {data && (
          <section className="bench__how" aria-labelledby="how-h">
            <h2 id="how-h">How to read a candidate's position</h2>
            <dl>
              <dt>Voted yes</dt><dd>Voted to pass the bill.</dd>
              <dt>Voted no</dt><dd>Voted against passing it. Legislators vote no for different reasons, so check their statements too.</dd>
              <dt>Did not vote</dt><dd>Was in office but has no recorded vote, for example because they were absent or abstained.</dd>
              <dt>Author, co-author, sponsor</dt><dd>Wrote or formally backed the bill.</dd>
              <dt>Signed</dt><dd>Put their name on the letter.</dd>
            </dl>
            <p className="bench__jump">
              Jump to:{' '}
              {data.yardstickList.map((y, i) => (
                <span key={y.key}>{i > 0 && ' · '}<a href={`#${y.key}`}>{y.short_name}</a></span>
              ))}
            </p>
          </section>
        )}

        {data && data.yardstickList.map(y => {
          const holders = data.candidates
            .map(c => ({ c, p: c.positions.find(p => p.yardstick === y.key) }))
            .filter(x => x.p)
          const groups = Object.keys(POSITION_LABELS)
            .map(v => [v, holders.filter(h => h.p.value === v)])
            .filter(([, list]) => list.length)

          return (
            <article key={y.key} id={y.key} className={`bench__item ${hash === `#${y.key}` ? 'bench__item--focus' : ''}`}>
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
              <p className="bench__links">
                {y.text_url && <a className="bench__source" href={y.text_url} target="_blank" rel="noreferrer">Read the official bill text ↗</a>}
                {y.url && (
                  <a className="bench__source" href={y.url} target="_blank" rel="noreferrer">
                    {y.text_url ? 'See every legislator’s vote ↗' : 'Source ↗'}
                  </a>
                )}
              </p>

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
