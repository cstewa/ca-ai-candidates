import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import DistrictFinder from '../components/DistrictFinder'
import RaceCard from '../components/RaceCard'
import ZipForm from '../components/ZipForm'
import Signup from '../components/Signup'
import ShareButton from '../components/ShareButton'
import { Loading, LoadError } from '../components/PageState'
import { getZip } from '../api'
import { useGuide, CATEGORIES, ELECTION_DAY, STATES, savedDistricts, savedZip } from '../data'
import './MyBallot.css'

const DISTRICT_PARAMS = ['cd', 'sd', 'ad', 'boe']
// Races specific to the visitor's ZIP come first; statewide races (the same for every
// Californian) follow. Otherwise, on a phone, district races start several screens down.
const BALLOT_ORDER = [...CATEGORIES.filter(c => c.key !== 'statewide'), ...CATEGORIES.filter(c => c.key === 'statewide')]

// A congressional district option: "12", or "TX-12" when a ZIP crosses a state line.
const cdKey = o => `${o.state}-${o.district}`
const districtName = d => (d === 0 ? 'At-large' : `District ${d}`)

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
            key={o.value}
            type="button"
            className={`split__button ${o.value === chosen ? 'split__button--on' : ''}`}
            aria-pressed={o.value === chosen}
            onClick={() => onChoose(o.value)}
          >
            {o.label}{i === 0 && <span className="split__hint"> (most of this ZIP)</span>}
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

  // Typed district numbers are California's; a ZIP says which state it's in.
  const state = lookup.data?.state || 'CA'
  const categories = BALLOT_ORDER.filter(c => state === 'CA' || !c.caOnly)

  // Pick a district for each office: the visitor's choice, else the largest share of the ZIP.
  // Each option's value is what goes in the URL; chosen[key] is { value, state, district }.
  const chosen = {}
  const options = {}
  for (const cat of categories.filter(c => c.param)) {
    const fromZip = lookup.data?.districts[cat.key] || []
    const multiState = new Set(fromZip.map(o => o.state)).size > 1
    options[cat.key] = fromZip.map(o => ({
      ...o,
      state: o.state || 'CA',
      value: multiState ? cdKey(o) : String(o.district),
      label: multiState ? `${STATES[o.state]} ${districtName(o.district)}` : districtName(o.district),
    }))
    const want = params.get(cat.param) ?? typedDistricts[cat.param]
    const picked = options[cat.key].find(o => o.value === want) || (want && !zip ? { value: want, state: 'CA', district: Number(want) } : options[cat.key][0])
    if (picked && !Number.isNaN(picked.district)) chosen[cat.key] = picked
  }
  const raceFor = key => {
    const c = chosen[key]
    return c && data?.races.find(r => r.category === key && r.state === c.state && r.district === c.district)
  }
  const senateRace = data?.races.find(r => r.category === 'us_senate' && r.state === state)

  const ready = data && !lookup.loading
  const zipProblem = zip && lookup.error
  const nothingChosen = !zip && !Object.keys(typedDistricts).length
  const showResults = ready && !zipProblem && !nothingChosen
  const askForZip = nothingChosen || zipProblem

  // How many candidates are on this visitor's ballot, for the sign-up headline.
  const shownRaces = !showResults ? [] : [
    ...(state === 'CA' ? data.races.filter(r => r.category === 'statewide') : []),
    senateRace,
    ...categories.filter(c => c.param).map(c => raceFor(c.key)),
  ].filter(Boolean)
  const candidateCount = shownRaces.reduce((n, r) => n + r.candidates.length, 0)
  const trackHeadline = `Track the ${candidateCount} candidates on your ballot`

  return (
    <>
      {askForZip ? (
        // No ZIP yet (e.g. from the top-bar button): lead with the ZIP field, like the homepage.
        <section className="page-hero">
          <div className="container">
            <p className="page-hero__kicker">{ELECTION_DAY}</p>
            <h1>Find your candidates</h1>
            <p>Enter your ZIP code to see your candidates for the U.S. House and Senate. In California, you'll also see state races, from governor to Assembly.</p>
            <div className="ballot__hero-form">
              <ZipForm idPrefix="top" initial={zip} />
            </div>
          </div>
        </section>
      ) : (
        // Results: a short header, so candidate names show on the first screen.
        <section className="page-hero ballot__hero">
          <div className="container">
            <p className="page-hero__kicker">{STATES[state]} · Nov. 3, 2026</p>
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
                  <ShareButton className="ballot__change" label="Send to a friend" text="See where the candidates on my ballot stand on AI" />
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
            <strong>We couldn't find residents in ZIP code {zip}.</strong>{' '}
            It may be a PO box or business-only ZIP, or outside the 50 states (Washington, D.C. and the territories aren't covered). Try your home ZIP code,{' '}
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
            {categories.map(cat => {
              if (cat.param && !chosen[cat.key]) return null
              const short = cat.label.replace('California ', '').replace(' (state tax board)', '')
              const label = cat.key === 'statewide' ? 'Statewide' : cat.param ? `${short} ${chosen[cat.key].district || 'at-large'}` : short
              return <a key={cat.key} href={`#b-${cat.key}`} className="ballot__jump-link">{label}</a>
            })}
          </nav>
        )}

        {showResults && (
          <p className="ballot__hint">
            Tap a bill name, like <Link to={state === 'CA' ? '/bills/sb53' : '/bills/take_it_down_act'} className="bill-link">{state === 'CA' ? 'SB 53' : 'TAKE IT DOWN Act'}</Link>, to see what it does and what a yes or no vote means.
          </p>
        )}

        {showResults && categories.map(cat => {
          if (cat.key === 'statewide') {
            const races = data.races.filter(r => r.category === 'statewide')
            return <BallotGroup key={cat.key} id={cat.key} title={cat.label}>{races.map(r => <RaceCard key={r.slug} race={r} yardsticks={data.yardsticks} />)}</BallotGroup>
          }

          if (cat.key === 'us_senate') {
            return (
              <BallotGroup key={cat.key} id={cat.key} title={cat.label}>
                {senateRace
                  ? <RaceCard race={senateRace} yardsticks={data.yardsticks} />
                  : <p className="notice">{STATES[state]} has no U.S. Senate race on the Nov. 3 ballot.</p>}
              </BallotGroup>
            )
          }

          const c = chosen[cat.key]
          if (!c) return null
          const race = raceFor(cat.key)
          const missing = cat.key === 'state_senate'
            ? `State Senate District ${c.district} isn't on the ballot this year. Only even-numbered Senate districts hold elections in 2026.`
            : `No ${cat.label} race found for ${districtName(c.district)}.`

          return (
            <BallotGroup key={cat.key} id={cat.key} title={cat.label}>
              <SplitChooser category={cat} options={options[cat.key]} chosen={c.value} onChoose={v => setParam(cat.param, v)} />
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
            initial={state === 'CA' ? Object.fromEntries(CATEGORIES.filter(c => c.param && chosen[c.key]).map(c => [c.param, chosen[c.key].district])) : {}}
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
