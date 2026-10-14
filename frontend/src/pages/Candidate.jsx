import { Link, useParams } from 'react-router-dom'
import CandidatePanel from '../components/CandidatePanel'
import StatusBadge from '../components/StatusBadge'
import { Loading, LoadError } from '../components/PageState'
import NotFound from './NotFound'
import { useGuide, candidateMeta } from '../data'
import './Candidate.css'

export default function Candidate() {
  const { slug } = useParams()
  const { data, loading, error } = useGuide()

  if (loading) return <Loading />
  if (error) return <LoadError />
  const c = data.candidateBySlug[slug]
  if (!c) return <NotFound />
  const others = c.race.candidates.filter(o => o.slug !== c.slug)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/races">All races</Link> / <Link to={`/races/${c.race.slug}`}>{c.race.title}</Link>
          </nav>
          <h1>{c.name}</h1>
          <p>Candidate for {c.race.title}</p>
        </div>
      </section>

      <div className="container candidate-page">
        <CandidatePanel candidate={c} yardsticks={data.yardsticks} linkName={false} headingLevel={2} />

        <aside className="candidate-page__others" aria-labelledby="others-h">
          <h2 id="others-h">Also in this race</h2>
          {others.length ? (
            <ul>
              {others.map(o => (
                <li key={o.slug}>
                  <Link to={`/candidates/${o.slug}`}>{o.name}</Link>
                  <span className="candidate-page__meta">{candidateMeta(o)}</span>
                  <StatusBadge status={o.status} short />
                </li>
              ))}
            </ul>
          ) : <p>No other candidates are on the ballot for this office.</p>}
          <Link to={`/races/${c.race.slug}`} className="btn btn--outline">Compare side by side</Link>
        </aside>
      </div>
    </>
  )
}
