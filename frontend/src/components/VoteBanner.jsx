import { useState } from 'react'
import { BALLOT_STATUS_URL, VOTING_CLOSES } from '../data'
import './VoteBanner.css'

// Shown until polls close on Nov. 3; disappears on its own afterward.
export default function VoteBanner() {
  const [open] = useState(() => Date.now() < VOTING_CLOSES)
  if (!open) return null
  return (
    <div className="vote-banner" role="note">
      <div className="container vote-banner__inner">
        <strong>Ballots are out. Vote by Nov. 3.</strong>
        <a href={BALLOT_STATUS_URL} target="_blank" rel="noreferrer">
          Track your ballot<span className="visually-hidden"> on the Secretary of State's site (opens in new tab)</span> ↗
        </a>
      </div>
    </div>
  )
}
