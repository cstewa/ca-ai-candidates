import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveZip, savedZip } from '../data'
import './ZipForm.css'

// One field: a 5-digit ZIP code. Submitting opens the visitor's races.
export default function ZipForm({ initial, size = 'large', label = 'Your ZIP code' }) {
  const navigate = useNavigate()
  const [zip, setZip] = useState(() => initial ?? savedZip())
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    const clean = zip.trim()
    if (!/^\d{5}$/.test(clean)) {
      setError('Enter a 5-digit ZIP code.')
      return
    }
    setError('')
    saveZip(clean)
    navigate(`/my-ballot?zip=${clean}`)
  }

  return (
    <form className={`zipform zipform--${size}`} onSubmit={submit} noValidate>
      <label htmlFor={`zip-${size}`} className="zipform__label">{label}</label>
      <div className="zipform__row">
        <input
          id={`zip-${size}`}
          className="zipform__input"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="[0-9]{5}"
          maxLength={5}
          placeholder="e.g. 90024"
          value={zip}
          onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
          aria-invalid={!!error}
          aria-describedby={error ? `zip-${size}-error` : undefined}
        />
        <button type="submit" className="btn btn--primary zipform__button">See my candidates</button>
      </div>
      {error && <p id={`zip-${size}-error`} className="zipform__error" role="alert">{error}</p>}
    </form>
  )
}
