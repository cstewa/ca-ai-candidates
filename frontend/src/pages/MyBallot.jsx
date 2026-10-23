import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import DistrictFinder from '../components/DistrictFinder'
import RaceCard from '../components/RaceCard'
import ZipForm from '../components/ZipForm'
import Signup from '../components/Signup'
import ShareButton from '../components/ShareButton'
import { Loading, LoadError } from '../components/PageState'
import { getZip } from '../api'
import { useGuide, CATEGORIES, ELECTION_DAY, savedDistricts, savedZip } from '../data'
import './MyBallot.css'

const DISTRICT_PARAMS = ['cd', 'sd', 'ad', 'boe']
// Races specific to the visitor's ZIP come first; statewide races (the same for every
// Californian) follow. Otherwise, on a phone, district races start several screens down.
const BALLOT_ORDER = [...CATEGORIES.filter(c => c.key !== 'statewide'), ...CATEGORIES.filter(c => c.key === 'statewide')]

function useZipLookup(zip) {
  const [state, setState] = useState({ zip: null, data: null, error: null })

  useEffect(() => {
    if (!zip) return
    let live = true
    getZip(zip)
      .then(r => live && setState({ zip, data: r.data, error: null }))
      .catch(err => live && setState({ zip, data: null, error: err.response?.status === 404 ? 'not_found' : 'failed' }))
    return () => { live = false }
  }, [zip])

  if (!zip) return { loading: false }
  if (state.zip !== zip) return { loading: true }
  return { loading: false, data: state.data, error: state.error }
}

// One-tap switch between the districts a ZIP code spans.
function SplitChooser({ category, options, chosen, onChoose }) {
  if (options.length < 2) return null
  return (
    <div className="split" role="group" aria-label={`Choose your ${category.districtLabel.toLowerCase()}`}>
      <p className="split__note">
        Your ZIP code is split between {options.length} {category.splitLabel}. Which one is yours?
      </p>
      <div className="split__buttons">
        {options.map((o, i) => (
          <button
            key={o.district}
            type="button"
            className={`split__button ${o.district === chosen ? 'split__button--on' : ''}`}
            aria-pressed={o.district === chosen}
            onClick={() => onChoose(o.district)}
          >
            District {o.district}{i === 0 && <span className="split__hint"> (most of this ZIP)</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MyBallot() {
  const { data, loading, error } = useGuide()
  const [params, setParams] = useSearchParams()

  // With no parameters, reopen what this device used last.
  const urlZip = params.get('zip')
  const urlDistricts = Object.fromEntries(DISTRICT_PARAMS.filter(k => params.get(k)).map(k => [k, params.get(k)]))
  const hasParams = urlZip || Object.keys(urlDistricts).length
  const zip = urlZip || (!hasParams ? savedZip() : '')
  const typedDistricts = hasParams ? urlDistricts : (zip ? {} : savedDistricts())

  const lookup = useZipLookup(zip)
  // The "Change ZIP code" box closes by itself once a new ZIP is submitted.
  const [editingFor, setEditingFor] = useState(null)
  const editingZip = editingFor === (zip || 'none')

  function setParam(key, value) {
    const next = new URLSearchParams(params)
    if (zip && !next.get('zip')) next.set('zip', zip)
    next.set(key, value)
    setParams(next, { replace: true })
  }

  // Pick a district for each office: the visitor's choice, else the largest share of the ZIP.
  const chosen = {}
  const options = {}
  for (const cat of CATEGORIES.filter(c => c.param)) {
    const fromZip = lookup.data?.districts[cat.key] || []
    options[cat.key] = fromZip
    const picked = Number(params.get(cat.param)) || Number(typedDistricts[cat.param]) || fromZip[0]?.district
    if (picked) chosen[cat.key] = picked
  }

  const ready = data && !lookup.loading
  const zipProblem = zip && lookup.error
  const nothingChosen = !zip && !Object.keys(typedDistricts).length
  const showResults = ready && !zipProblem && !nothingChosen
  const askForZip = nothingChosen || zipProblem

  // How many candidates are on this visitor's ballot, for the sign-up headline.
  const shownRaces = !showResults ? [] : [
    ...data.races.filter(r => r.category === 'statewide'),
    ...CATEGORIES.filter(c => c.param && chosen[c.key])
      .map(c => data.races.find(r => r.category === c.key && r.district === chosen[c.key]))
      .filter(Boolean),
  ]
  const candidateCount = shownRaces.reduce((n, r) => n + r.candidates.length, 0)
  const trackHeadline = `Track the ${candidateCount} candidates on your ballot`

  return (
    <>
      {askForZip ? (
        // No ZIP yet (e.g. from the top-bar button): lead with the ZIP field, like the homepage.
        <section className="page-hero">
          <div className="container">
            <p className="page-hero__kicker">California · {ELECTION_DAY}</p>
            <h1>Find your candidates</h1>
            <p>Enter your ZIP code to see everyone on your ballot, from governor to Assembly.</p>
            <div className="ballot__hero-form">
              <ZipForm idPrefix="top" initial={zip} />
            </div>
          </div>
        </section>
      ) : (
        // Results: a short header, so candidate names show on the first screen.
        <section className="page-hero ballot__hero">
          <div className="container">
            <p className="page-hero__kicker">California · Nov. 3, 2026</p>
            <h1>{zip ? `Your candidates in ${zip}` : 'Your candidates'}</h1>
            {editingZip ? (
              <div className="ballot__hero-form">
                <ZipForm idPrefix="top" initial={zip} size="small" label="New ZIP code" />
              </div>
            ) : (
              <div className="ballot__hero-actions">
                <button type="button" className="ballot__change" onClick={() => setEditingFor(zip || 'none')}>
                  {zip ? 'Change ZIP code' : 'Use a ZIP code instead'}
                </button>
                {showResults && (
                  <ShareButton className="ballot__change" label="Send to a friend" text="See where everyone on my California ballot stands on AI" />
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="container ballot">

        {(loading || lookup.loading) && <Loading />}
        {error && <LoadError />}

        {zipProblem === 'not_found' && (
          <div className="notice ballot__problem" role="alert">
            <strong>We couldn't find California residents in ZIP code {zip}.</strong>{' '}
            It may be outside California, or a PO box or business-only ZIP. Try your home ZIP code,{' '}
            <Link to="/races">browse all races</Link>, or <Link to="/">search by candidate name</Link>.
          </div>
        )}
        {zipProblem === 'failed' && <LoadError />}

        {showResults && (
          <Signup source="results" zip={zip || undefined} idPrefix="results-signup" variant="strip" headline={trackHeadline} />
        )}

        {showResults && (
          <nav className="ballot__jump" aria-label="Jump to a race">
            <span className="ballot__jump-label">On your ballot:</span>
            {BALLOT_ORDER.map(cat => {
              if (cat.param && !chosen[cat.key]) return null
              const label = cat.key === 'statewide' ? 'Statewide' : `${cat.label.replace(' (state tax board)', '')} ${chosen[cat.key]}`
              return <a key={cat.key} href={`#b-${cat.key}`} className="ballot__jump-link">{label}</a>
            })}
          </nav>
        )}

        {showResults && (
          <p className="ballot__hint">
            Tap a bill name, like <Link to="/bills/sb53" className="bill-link">SB 53</Link>, to see what it does and what a yes or no vote means.
          </p>
        )}

        {showResults && BALLOT_ORDER.map(cat => {
          if (cat.key === 'statewide') {
            const races = data.races.filter(r => r.category === 'statewide')
            return <BallotGroup key={cat.key} id={cat.key} title={cat.label}>{races.map(r => <RaceCard key={r.slug} race={r} yardsticks={data.yardsticks} />)}</BallotGroup>
          }

          const d = chosen[cat.key]
          if (!d) return null
          const race = data.races.find(r => r.category === cat.key && r.district === d)
          const missing = cat.key === 'state_senate'
            ? `State Senate District ${d} isn't on the ballot this year. Only even-numbered Senate districts hold elections in 2026.`
            : `No ${cat.label} race found for District ${d}.`

          return (
            <BallotGroup key={cat.key} id={cat.key} title={cat.label}>
              <SplitChooser category={cat} options={options[cat.key]} chosen={d} onChoose={v => setParam(cat.param, v)} />
              {race ? <RaceCard race={race} yardsticks={data.yardsticks} /> : <p className="notice">{missing}</p>}
            </BallotGroup>
          )
        })}

        {showResults && (
          <div className="ballot__end-signup">
            <Signup source="results" zip={zip || undefined} idPrefix="results-signup-end" headline={trackHeadline} />
          </div>
        )}

        <div className="ballot__finder">
          <DistrictFinder
            idPrefix="ballot-finder"
            zip={zip}
            initial={Object.fromEntries(CATEGORIES.filter(c => c.param && chosen[c.key]).map(c => [c.param, chosen[c.key]]))}
          />
        </div>

        {data && (
          <p className="ballot__more">
            Looking for something else? <Link to="/races">Browse all races</Link>.
          </p>
        )}
      </div>
    </>
  )
}

function BallotGroup({ id, title, children }) {
  return (
    <section className="ballot__group" aria-labelledby={`b-${id}`}>
      <h2 id={`b-${id}`}>{title}</h2>
      <div className="ballot__list">{children}</div>
    </section>
  )
}
