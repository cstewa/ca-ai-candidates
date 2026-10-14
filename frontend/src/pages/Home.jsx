import { Link } from 'react-router-dom'
import DistrictPicker from '../components/DistrictPicker'
import CandidateSearch from '../components/CandidateSearch'
import StatusBadge from '../components/StatusBadge'
import { Loading, LoadError } from '../components/PageState'
import { useGuide, CATEGORIES, ELECTION_DAY, STATUSES } from '../data'
import './Home.css'

export default function Home() {
  const { data, loading, error } = useGuide()

  const counts = data && Object.fromEntries(
    Object.keys(STATUSES).map(s => [s, data.candidates.filter(c => c.status === s).length])
  )

  return (
    <>
      <section className="home-hero">
        <div className="container">
          <p className="page-hero__kicker">California General Election · {ELECTION_DAY}</p>
          <h1>What have your candidates said and done about AI safety?</h1>
          <p className="home-hero__lede">
            Votes, bills, letters and public statements on the risks of advanced AI, for every candidate
            on California's ballot, with a source for each one. This guide reports records. It does not
            endorse or rate anyone.
          </p>
        </div>
      </section>

      <section className="section home-find">
        <div className="container home-find__grid">
          <div className="home-card">
            <h2>Find the races on your ballot</h2>
            <p className="home-card__intro">
              Choose the districts you live in. Statewide races are always included.
            </p>
            <DistrictPicker />
          </div>
          <div className="home-card">
            <h2>Look up a candidate</h2>
            <p className="home-card__intro">Search everyone on the ballot, from governor to Assembly.</p>
            {loading && <Loading />}
            {error && <LoadError />}
            {data && <CandidateSearch candidates={data.candidates} />}
          </div>
        </div>
      </section>

      {data && (
        <section className="section section--sand">
          <div className="container">
            <h2 className="home-h2">At a glance</h2>
            <p className="home-sub">
              {data.candidates.length} candidates in {data.races.length} races. Each candidate falls into one of three groups,
              based on how much public record we could find, not on what that record says.
            </p>
            <ul className="home-stats">
              {Object.keys(STATUSES).map(key => (
                <li key={key} className="home-stat">
                  <span className="home-stat__num">{counts[key]}</span>
                  <StatusBadge status={key} />
                  <span className="home-stat__desc">
                    {key === 'on_record' && 'Votes on AI-safety bills, sponsored bills, signed letters, or public statements on AI risk.'}
                    {key === 'ai_other' && 'Has spoken about AI, but not about AI safety specifically.'}
                    {key === 'none_found' && 'A search turned up nothing. This does not mean the candidate has no view.'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <h2 className="home-h2">Browse by office</h2>
          <ul className="home-offices">
            {CATEGORIES.map(cat => {
              const n = data ? data.races.filter(r => r.category === cat.key).length : null
              return (
                <li key={cat.key}>
                  <Link to={`/races?office=${cat.key}`} className="home-office">
                    <span className="home-office__name">{cat.label}</span>
                    {n !== null && <span className="home-office__count">{n} {n === 1 ? 'race' : 'races'}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container home-read">
          <h2 className="home-h2">How to read this guide</h2>
          <ul>
            <li><strong>What counts as a record:</strong> recorded votes on the main AI-safety bills, bills authored or sponsored, signed letters, and public statements in news coverage, debates and campaign sites.</li>
            <li><strong>“No public AI statements found”</strong> means a targeted search found nothing. It does not mean the candidate has no view. Asking them directly is the best way to fill the gap.</li>
            <li><strong>Every value looks the same.</strong> A “yes” and a “no” vote are styled identically, and parties are shown as text only.</li>
            <li><strong>Outside money is labeled separately.</strong> Spending by AI-policy groups is something done by others, not a statement by the candidate.</li>
          </ul>
          <Link to="/about" className="btn btn--outline">Full methodology</Link>
        </div>
      </section>
    </>
  )
}
