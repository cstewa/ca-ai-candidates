import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FIND_DISTRICTS_URL, STORAGE_KEY, savedDistricts } from '../data'
import './DistrictPicker.css'

const FIELDS = [
  { key: 'cd',  label: 'Congressional district', max: 52 },
  { key: 'sd',  label: 'State Senate district',  max: 40 },
  { key: 'ad',  label: 'Assembly district',      max: 80 },
  { key: 'boe', label: 'Board of Equalization',  max: 4 },
]

const range = n => Array.from({ length: n }, (_, i) => i + 1)

export default function DistrictPicker({ initial = {}, compact = false }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(() => ({ ...savedDistricts(), ...initial }))

  function submit(e) {
    e.preventDefault()
    const picked = Object.fromEntries(Object.entries(values).filter(([, v]) => v))
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(picked)) } catch { /* storage unavailable */ }
    navigate(`/my-ballot?${new URLSearchParams(picked)}`)
  }

  return (
    <form className={`dpicker ${compact ? 'dpicker--compact' : ''}`} onSubmit={submit}>
      <div className="dpicker__fields">
        {FIELDS.map(f => (
          <div key={f.key} className="form-group">
            <label htmlFor={`d-${f.key}`}>{f.label}</label>
            <select
              id={`d-${f.key}`}
              value={values[f.key] || ''}
              onChange={e => setValues({ ...values, [f.key]: e.target.value })}
            >
              <option value="">Not sure / skip</option>
              {range(f.max).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="dpicker__actions">
        <button type="submit" className="btn btn--primary">Show my races</button>
        <a href={FIND_DISTRICTS_URL} target="_blank" rel="noreferrer" className="dpicker__help">
          Don't know your districts? Look them up by address<span className="visually-hidden"> (opens in new tab)</span> ↗
        </a>
      </div>
    </form>
  )
}
