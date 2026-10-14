import { Link, useParams } from 'react-router-dom'
import CandidatePanel from '../components/CandidatePanel'
import { Loading, LoadError } from '../components/PageState'
import NotFound from './NotFound'
import { useGuide, CATEGORY_BY_KEY, POSITION_LABELS } from '../data'
import './Race.css'

function CompareTable({ race, yardsticks }) {
  const keys = Object.keys(yardsticks).filter(k => race.candidates.some(c => c.positions.some(p => p.yardstick === k)))
  if (!keys.length) return null
  const cell = (c, k) => c.positions.find(p => p.yardstick === k)

  return (
    <section className="compare" aria-labelledby="compare-h">
      <h2 id="compare-h">Side by side</h2>
      <div className="compare__scroll">
        <table className="compare__table">
          <thead>
            <tr>
              <th scope="col">Bill, vote or letter</th>
              {race.candidates.map(c => <th key={c.slug} scope="col">{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k}>
                <th scope="row">
                  <Link to={`/benchmarks#${k}`}>{yardsticks[k].short_name}</Link>
                  <span className="compare__year">{yardsticks[k].year}</span>
                </th>
                {race.candidates.map(c => {
                  const p = cell(c, k)
                  return (
                    <td key={c.slug}>
                      {p ? (
                        <>
                          {POSITION_LABELS[p.value]}
                          {p.detail && <span className="compare__detail">{p.detail}</span>}
                        </>
                      ) : <span className="compare__none" aria-label="No recorded position">—</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="compare__legend">— means no recorded position, for example because the candidate was not in that legislature at the time.</p>
    </section>
  )
}

export default function Race() {
  const { slug } = useParams()
  const { data, loading, error } = useGuide()

  if (loading) return <Loading />
  if (error) return <LoadError />
  const race = data.raceBySlug[slug]
  if (!race) return <NotFound />
  const cat = CATEGORY_BY_KEY[race.category]

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/races">All races</Link> / <Link to={`/races?office=${cat.key}`}>{cat.label}</Link>
          </nav>
          <h1>{race.title}</h1>
          {race.note && <p>{race.note}</p>}
        </div>
      </section>

      <div className="container race-page">
        <p className="race-page__order">
          {race.candidates.length === 1 ? 'One candidate is on the ballot.' : `${race.candidates.length} candidates, listed alphabetically by last name.`}
          {' '}<Link to="/about">How to read this page</Link>
        </p>

        <CompareTable race={race} yardsticks={data.yardsticks} />

        <h2 className="race-page__h2">Full records</h2>
        <div className={`race-page__panels race-page__panels--${Math.min(race.candidates.length, 2)}`}>
          {race.candidates.map(c => <CandidatePanel key={c.slug} candidate={c} yardsticks={data.yardsticks} />)}
        </div>
      </div>
    </>
  )
}
