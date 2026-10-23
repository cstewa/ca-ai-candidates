import { useState } from 'react'
import { VOTE_GOV_URL, VOTING_CLOSES } from '../data'
import './VoteBanner.css'

// Shown until polls close on Nov. 3; disappears on its own afterward.
export default function VoteBanner() {
  const [open] = useState(() => Date.now() < VOTING_CLOSES)
  if (!open) return null
  return (
    <div className="vote-banner" role="note">
      <div className="container vote-banner__inner">
        <strong>Election Day is Nov. 3.</strong>
        <a href={VOTE_GOV_URL} target="_blank" rel="noreferrer">
          Voting rules in your state<span className="visually-hidden"> on vote.gov (opens in new tab)</span> ↗
        </a>
      </div>
    </div>
  )
}
