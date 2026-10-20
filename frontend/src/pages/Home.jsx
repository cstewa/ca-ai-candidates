import { Link } from 'react-router-dom'
import ZipForm from '../components/ZipForm'
import DistrictFinder from '../components/DistrictFinder'
import CandidateSearch from '../components/CandidateSearch'
import StatusBadge from '../components/StatusBadge'
import { Loading, LoadError } from '../components/PageState'
import { useGuide, CATEGORIES, ELECTION_DAY, STATUSES, UPDATES_FORM_URL } from '../data'
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
          <h1>
            <span className="home-hero__state">California</span>
            AI Safety Candidate Lookup
          </h1>
          <p className="home-hero__lede">
            Enter your ZIP code to see what the candidates on your ballot have said and done about AI safety,
            from governor and mayor to Congress and the Legislature.
          </p>
          <div className="home-hero__form">
            <ZipForm />
          </div>
          <p className="home-hero__neutral">A record of votes and statements, with sources. Not an endorsement.</p>
        </div>
      </section>

      <section className="section home-find">
        <div className="container home-find__grid">
          <div className="home-card">
            <h2>Look up a candidate by name</h2>
            {loading && <Loading />}
            {error && <LoadError />}
            {data && <CandidateSearch candidates={data.candidates} />}
          </div>
          <DistrictFinder idPrefix="home-finder" />
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
                    {key === 'ai_other' && 'Positions or actions on other AI issues, such as AI in schools, jobs or government.'}
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
            <li><strong>Every item is labeled</strong> as a vote, bill, letter, statement, platform or official action, and links to its source.</li>
            <li><strong>“No public AI statements found”</strong> means a targeted search found nothing. It does not mean the candidate has no view. Asking them directly is the best way to fill the gap.</li>
            <li><strong>Every value looks the same.</strong> A “yes” and a “no” vote are styled identically, and parties are shown as text only.</li>
            <li><strong>Outside money is labeled separately.</strong> Spending by AI-policy groups is something done by others, not a statement by the candidate.</li>
          </ul>
          <Link to="/about" className="btn btn--outline">Full methodology</Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="home-updates">
            <div>
              <h2 className="home-h2">Get updates</h2>
              <p className="home-updates__text">
                Leave your email to hear about AI safety and California's elections, including new races and
                candidate records as they're added.
              </p>
            </div>
            <div className="home-updates__action">
              <a href={UPDATES_FORM_URL} target="_blank" rel="noreferrer" className="btn btn--primary">
                Sign up for updates<span className="visually-hidden"> (opens a Google Form in a new tab)</span> ↗
              </a>
              <p className="home-updates__note">Opens a short Google Form. Only your email is asked for.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
