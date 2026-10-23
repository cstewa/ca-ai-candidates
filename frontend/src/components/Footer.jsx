import { Link } from 'react-router-dom'
import { LAST_UPDATED, BALLOT_LIST_URL, VOTE_GOV_URL } from '../data'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__about">
          <p className="footer__title">AI Vote Watch</p>
          <p>
            A record of what candidates on the November 3, 2026 ballot have said and done about AI safety.
            It does not endorse or rate any candidate.
          </p>
          <p className="footer__updated">Last updated {LAST_UPDATED}.</p>
        </div>
        <nav className="footer__links" aria-label="Footer">
          <Link to="/my-ballot">Find my candidates</Link>
          <Link to="/races">All races</Link>
          <Link to="/bills">Bills &amp; letters</Link>
          <Link to="/about">How to read this</Link>
          <a href={BALLOT_LIST_URL} target="_blank" rel="noreferrer">California's official candidate list (PDF)</a>
          <a href={VOTE_GOV_URL} target="_blank" rel="noreferrer">Register and find voting rules (vote.gov)</a>
          <Link to="/#track">Track your candidates by email</Link>
        </nav>
      </div>
    </footer>
  )
}
