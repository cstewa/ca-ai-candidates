import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import DistrictFinder from '../components/DistrictFinder'
import RaceCard from '../components/RaceCard'
import ZipForm from '../components/ZipForm'
import { Loading, LoadError } from '../components/PageState'
import { getZip } from '../api'
import { useGuide, CATEGORIES, ELECTION_DAY, savedDistricts, savedZip } from '../data'
import './MyBallot.css'

const DISTRICT_PARAMS = ['cd', 'sd', 'ad', 'boe']
// A city covering at least this share of a ZIP's residents is shown without asking.
const CITY_SURE = 0.98

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

function CityQuestion({ city, inside, onAnswer }) {
  return (
    <div className="split" role="group" aria-label={`Do you live in the City of ${city.city}?`}>
      <p className="split__note">Part of your ZIP code is in the City of {city.city}. Do you live in the city?</p>
      <div className="split__buttons">
        <button type="button" className={`split__button ${inside ? 'split__button--on' : ''}`} aria-pressed={inside} onClick={() => onAnswer(true)}>Yes</button>
        <button type="button" className={`split__button ${!inside ? 'split__button--on' : ''}`} aria-pressed={!inside} onClick={() => onAnswer(false)}>No</button>
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

  // Mayor races the ZIP touches; ask when the ZIP is only partly inside the city.
  const cities = (lookup.data?.cities || []).map(city => {
    const answer = params.get(`in-${city.race}`)
    const inside = answer ? answer === 'yes' : city.share >= 0.5
    return { ...city, inside, ask: city.share < CITY_SURE }
  })

  const ready = data && !lookup.loading
  const zipProblem = zip && lookup.error
  const nothingChosen = !zip && !Object.keys(typedDistricts).length

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="page-hero__kicker">California · {ELECTION_DAY}</p>
          <h1>{zip && !zipProblem ? `Your candidates in ${zip}` : 'Your candidates'}</h1>
          <p>
            {zip
              ? 'Statewide races, plus the city and districts for your ZIP code. Your ZIP code stays on this device.'
              : 'Statewide races, plus the districts you chose.'}
          </p>
        </div>
      </section>

      <div className="container ballot">
        <div className="ballot__zip">
          <ZipForm idPrefix="top" initial={zip} size="small" label={zip ? 'Change ZIP code' : 'Your ZIP code'} />
        </div>

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

        {nothingChosen && (
          <p className="ballot__empty">Enter your ZIP code to see the races on your ballot.</p>
        )}

        {ready && !zipProblem && !nothingChosen && (
          <nav className="ballot__jump" aria-label="Jump to a race">
            <span className="ballot__jump-label">On your ballot:</span>
            {CATEGORIES.map(cat => {
              if (cat.key === 'local' && !cities.length) return null
              if (cat.param && !chosen[cat.key]) return null
              const label = cat.key === 'statewide' ? 'Statewide' : cat.key === 'local' ? 'Mayor' : `${cat.label.replace(' (state tax board)', '')} ${chosen[cat.key]}`
              return <a key={cat.key} href={`#b-${cat.key}`} className="ballot__jump-link">{label}</a>
            })}
          </nav>
        )}

        {ready && !zipProblem && !nothingChosen && (
          <p className="ballot__hint">
            Tap a bill name, like <strong>SB 53</strong>, to see what it does and what a yes or no vote means.
          </p>
        )}

        {ready && !zipProblem && !nothingChosen && CATEGORIES.map(cat => {
          if (cat.key === 'statewide') {
            const races = data.races.filter(r => r.category === 'statewide')
            return <BallotGroup key={cat.key} id={cat.key} title={cat.label}>{races.map(r => <RaceCard key={r.slug} race={r} yardsticks={data.yardsticks} />)}</BallotGroup>
          }

          if (cat.key === 'local') {
            if (!cities.length) return null
            return (
              <BallotGroup key={cat.key} id={cat.key} title="Mayor">
                {cities.map(city => (
                  <div key={city.race} className="ballot__stack">
                    {city.ask && <CityQuestion city={city} inside={city.inside} onAnswer={yes => setParam(`in-${city.race}`, yes ? 'yes' : 'no')} />}
                    {city.inside
                      ? <RaceCard race={data.raceBySlug[city.race]} yardsticks={data.yardsticks} />
                      : <p className="notice">No mayor's race shown. Outside the City of {city.city}, your city's mayor isn't covered yet.</p>}
                  </div>
                ))}
              </BallotGroup>
            )
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
