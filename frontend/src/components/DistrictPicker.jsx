import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STORAGE_KEY, savedDistricts } from '../data'
import './DistrictPicker.css'

const FIELDS = [
  { key: 'cd',  label: 'Congressional district', max: 52 },
  { key: 'sd',  label: 'State Senate district',  max: 40 },
  { key: 'ad',  label: 'Assembly district',      max: 80 },
  { key: 'boe', label: 'Board of Equalization (state tax board)', max: 4 },
]

const range = n => Array.from({ length: n }, (_, i) => i + 1)

export default function DistrictPicker({ initial = {}, idPrefix = 'd' }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(() => ({ ...savedDistricts(), ...initial }))
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    const picked = Object.fromEntries(Object.entries(values).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))
    if (!Object.keys(picked).length) {
      setError('Choose at least one district.')
      return
    }
    setError('')
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(picked)) } catch { /* storage unavailable */ }
    navigate(`/my-ballot?${new URLSearchParams(picked)}`)
    // The results may be on this same page, above the form: bring them into view.
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <form className="dpicker" onSubmit={submit} noValidate>
      <div className="dpicker__fields">
        {FIELDS.map(f => (
          <div key={f.key} className="form-group">
            <label htmlFor={`${idPrefix}-${f.key}`}>{f.label}</label>
            <select
              id={`${idPrefix}-${f.key}`}
              value={values[f.key] || ''}
              onChange={e => setValues({ ...values, [f.key]: e.target.value })}
            >
              <option value="">Not sure / skip</option>
              {range(f.max).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        ))}
      </div>
      {error && <p className="dpicker__error" role="alert">{error}</p>}
      <button type="submit" className="btn btn--primary">Show my candidates</button>
    </form>
  )
}
