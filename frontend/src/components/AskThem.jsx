import { useState } from 'react'
import Signup from './Signup'
import './AskThem.css'

// For candidates with no public AI statements: help voters ask the campaign directly.
// The question is the same for every candidate and doesn't suggest an answer.
export default function AskThem({ candidate: c, race, anchor = false }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/candidates/${c.slug}`
  const message =
    `Hi, I'm a voter in the race for ${race.title}. Where do you stand on AI safety, ` +
    `including how the most powerful AI systems should be tested and overseen? ` +
    `I'm comparing candidates on AI Vote Watch: ${url}`
  const subject = `Your position on AI safety, ${race.title}`
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
  const search = `https://www.google.com/search?q=${encodeURIComponent(`"${c.name}" ${race.title} 2026 campaign`)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section id={anchor ? 'ask' : undefined} className="ask" aria-labelledby={`ask-${c.slug}`}>
      <h3 id={`ask-${c.slug}`} className="ask__title">Ask {c.name} where they stand</h3>
      <p className="ask__text">
        We couldn't find any public statements on AI from this candidate. Asking the campaign directly is the best
        way to find out.
      </p>
      <blockquote className="ask__message">{message}</blockquote>
      <div className="ask__actions">
        <a href={mailto} className="btn btn--primary">Email the question</a>
        <button type="button" className="btn btn--outline" onClick={copy}>{copied ? 'Copied' : 'Copy the question'}</button>
        <a href={search} target="_blank" rel="noreferrer" className="ask__find">
          Find their campaign's contact page<span className="visually-hidden"> (opens a web search in a new tab)</span> ↗
        </a>
      </div>
      <p className="ask__hint">“Email the question” opens your email app; add the campaign's address from their website.</p>
      <div className="ask__notify">
        <Signup source="candidate" idPrefix={`ask-signup-${c.slug}`} variant="strip"
          headline="Get notified if they answer"
          subline={null} />
      </div>
    </section>
  )
}
