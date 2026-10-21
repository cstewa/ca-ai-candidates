import { useEffect, useState } from 'react'
import { postSignup } from '../api'
import { hasSignedUp, markSignedUp, SIGNUP_KEY } from '../data'
import './Signup.css'

const SUBLINE = 'We’ll email you when someone on your ballot votes, signs or says something about AI. After Nov 3, we’ll keep tracking the winners.'

// Email sign-up that submits in place (the server forwards it to the Google Form).
// variant: 'strip' (compact, under the results header) or 'card' (full).
export default function Signup({ source, zip, headline, subline = SUBLINE, variant = 'card', idPrefix = 'signup' }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState(() => (hasSignedUp() ? 'done' : 'idle'))
  const [error, setError] = useState('')

  useEffect(() => {
    const onSignedUp = () => setState('done')
    window.addEventListener(SIGNUP_KEY, onSignedUp)
    return () => window.removeEventListener(SIGNUP_KEY, onSignedUp)
  }, [])

  async function submit(e) {
    e.preventDefault()
    const website = e.currentTarget.elements.website.value
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    setState('sending')
    try {
      await postSignup({ email: email.trim(), zip, source, website })
      markSignedUp()
      setState('done')
    } catch (err) {
      setState('idle')
      setError(err.response?.status === 422
        ? 'Enter a valid email address.'
        : 'We couldn’t sign you up just now. Please try again in a minute.')
    }
  }

  if (state === 'done') {
    return (
      <section className={`signup signup--${variant} signup--done`} aria-live="polite">
        <p className="signup__done"><span aria-hidden="true">✓</span> You’re signed up. We’ll email you when your candidates go on record about AI.</p>
      </section>
    )
  }

  return (
    <section className={`signup signup--${variant}`} aria-labelledby={`${idPrefix}-h`}>
      <h2 id={`${idPrefix}-h`} className="signup__headline">{headline}</h2>
      {subline && <p className="signup__subline">{subline}</p>}
      <form className="signup__form" onSubmit={submit} noValidate>
        <div className="signup__field">
          <label htmlFor={`${idPrefix}-email`}>Email</label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="e.g. maria@gmail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={`${idPrefix}-micro${error ? ` ${idPrefix}-error` : ''}`}
          />
        </div>
        {/* Spam trap: hidden from people, filled in by bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="signup__trap" aria-hidden="true" />
        <button type="submit" className="btn btn--primary signup__button" disabled={state === 'sending'}>
          {state === 'sending' ? 'Signing you up…' : 'Track my candidates'}
        </button>
      </form>
      {error && <p id={`${idPrefix}-error`} className="signup__error" role="alert">{error}</p>}
      <p id={`${idPrefix}-micro`} className="signup__micro">Free. A few emails, not daily. Unsubscribe anytime.</p>
    </section>
  )
}
