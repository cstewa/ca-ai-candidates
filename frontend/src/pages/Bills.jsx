import { Link } from 'react-router-dom'
import PositionGuide from '../components/PositionGuide'
import { Loading, LoadError } from '../components/PageState'
import { useGuide, billPath } from '../data'
import './Bills.css'

// Index of every bill, vote and letter used in the guide. Each one has its own page.
export default function Bills() {
  const { data, loading, error } = useGuide()

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Bills &amp; letters</h1>
          <p>
            The bills, votes and letters this guide uses to compare candidates. Open one to see what it does
            in plain language, read the official text, and see which candidates on this ballot have a position on it.
          </p>
        </div>
      </section>

      <div className="container bench">
        {loading && <Loading />}
        {error && <LoadError />}
        {data && (
          <ul className="bills-list">
            {data.yardstickList.map(y => {
              const count = data.candidates.filter(c => c.positions.some(p => p.yardstick === y.key)).length
              return (
                <li key={y.key}>
                  <Link to={billPath(y.key)} className="bills-list__item">
                    <span className="bench__meta">{y.level === 'state' ? 'California' : 'Federal'} {y.kind} · {y.year}</span>
                    <span className="bills-list__name">{y.name}</span>
                    <span className="bills-list__what">{y.what_it_does}</span>
                    <span className="bills-list__more">
                      {count} {count === 1 ? 'candidate has' : 'candidates have'} a position · Read more →
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {data && <PositionGuide />}
      </div>
    </>
  )
}
