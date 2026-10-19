import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import RaceCard from '../components/RaceCard'
import RecordText from '../components/RecordText'
import { Loading, LoadError } from '../components/PageState'
import { useGuide, CATEGORIES } from '../data'
import './Races.css'

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function Races() {
  const { data, loading, error } = useGuide()
  const [params, setParams] = useSearchParams()
  const office = params.get('office') || ''
  const q = params.get('q') || ''
  const onlyRecord = params.get('record') === '1'

  function update(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    if (!data) return []
    const term = fold(q.trim())
    return data.races.filter(r => {
      if (office && r.category !== office) return false
      if (onlyRecord && !r.candidates.some(c => c.status === 'on_record')) return false
      if (!term) return true
      if (/^\d+$/.test(term)) return r.district === Number(term)
      return fold(r.title).includes(term) || r.candidates.some(c => fold(c.name).includes(term))
    })
  }, [data, office, q, onlyRecord])

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>All races</h1>
          <p>Every race on California's November 2026 ballot. Candidates are listed alphabetically by last name.</p>
        </div>
      </section>

      <div className="container">
        <form className="races-filters" role="search" onSubmit={e => e.preventDefault()}>
          <div className="form-group">
            <label htmlFor="f-office">Office</label>
            <select id="f-office" value={office} onChange={e => update('office', e.target.value)}>
              <option value="">All offices</option>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group races-filters__q">
            <label htmlFor="f-q">Name or district number</label>
            <input id="f-q" type="search" value={q} placeholder="e.g. Lofgren or 17" onChange={e => update('q', e.target.value)} />
          </div>
          <label className="races-filters__check">
            <input type="checkbox" checked={onlyRecord} onChange={e => update('record', e.target.checked ? '1' : '')} />
            Only races where at least one candidate has a public record on AI safety
          </label>
        </form>

        {loading && <Loading />}
        {error && <LoadError />}

        {data && (
          <>
            <p className="races-count" aria-live="polite">
              Showing {filtered.length} of {data.races.length} races
            </p>
            {filtered.length === 0 && (
              <div className="empty-state"><h3>No races match</h3><p>Try a different name, district or office.</p></div>
            )}
            {CATEGORIES.map(cat => {
              const races = filtered.filter(r => r.category === cat.key)
              if (!races.length) return null
              return (
                <section key={cat.key} className="races-group" aria-labelledby={`g-${cat.key}`}>
                  <h2 id={`g-${cat.key}`}>{cat.label}</h2>
                  <p className="races-group__intro"><RecordText text={cat.intro} /></p>
                  <div className="races-group__list">
                    {races.map(r => <RaceCard key={r.slug} race={r} yardsticks={data.yardsticks} />)}
                  </div>
                </section>
              )
            })}
          </>
        )}
      </div>
    </>
  )
}
