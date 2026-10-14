import { useSearchParams, Link } from 'react-router-dom'
import DistrictPicker from '../components/DistrictPicker'
import RaceCard from '../components/RaceCard'
import { Loading, LoadError } from '../components/PageState'
import { useGuide, CATEGORIES, ELECTION_DAY, savedDistricts } from '../data'
import './MyBallot.css'

export default function MyBallot() {
  const { data, loading, error } = useGuide()
  const [params] = useSearchParams()
  const fromUrl = Object.fromEntries([...params].filter(([k]) => ['cd', 'sd', 'ad', 'boe'].includes(k)))
  const picked = Object.keys(fromUrl).length ? fromUrl : savedDistricts()

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="page-hero__kicker">{ELECTION_DAY}</p>
          <h1>Your races</h1>
          <p>Statewide races plus the districts you choose. Your choices stay on this device.</p>
        </div>
      </section>

      <div className="container ballot">
        <details className="ballot__picker" open={!Object.keys(picked).length}>
          <summary>Change districts</summary>
          <DistrictPicker initial={picked} compact />
        </details>

        {loading && <Loading />}
        {error && <LoadError />}

        {data && CATEGORIES.map(cat => {
          let races
          let missing = null
          if (cat.key === 'statewide') {
            races = data.races.filter(r => r.category === 'statewide')
          } else {
            const d = Number(picked[cat.param])
            if (!d) return null
            races = data.races.filter(r => r.category === cat.key && r.district === d)
            if (!races.length) {
              missing = cat.key === 'state_senate'
                ? `State Senate District ${d} is not on the ballot this year. Only even-numbered Senate districts hold elections in 2026.`
                : `No ${cat.label} race found for District ${d}.`
            }
          }
          return (
            <section key={cat.key} className="ballot__group" aria-labelledby={`b-${cat.key}`}>
              <h2 id={`b-${cat.key}`}>{cat.key === 'statewide' ? cat.label : `${cat.districtLabel} ${picked[cat.param]}`}</h2>
              {missing ? <p className="notice">{missing}</p> : (
                <div className="ballot__list">
                  {races.map(r => <RaceCard key={r.slug} race={r} yardsticks={data.yardsticks} />)}
                </div>
              )}
            </section>
          )
        })}

        {data && (
          <p className="ballot__more">
            Looking for something else? <Link to="/races">Browse all races</Link>.
          </p>
        )}
      </div>
    </>
  )
}
