import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './Navbar.css'

const LINKS = [
  { to: '/races',      label: 'All races' },
  { to: '/benchmarks', label: 'Bills & letters' },
  { to: '/about',      label: 'How to read this' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="navbar" aria-label="Main">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo" onClick={() => setOpen(false)}>
          <span className="navbar__mark" aria-hidden="true">CA</span>
          <span className="navbar__title">
            AI Safety Candidate Lookup
            <span className="navbar__sub">California · 2026 Election</span>
          </span>
        </Link>

        <button
          className="navbar__hamburger"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="nav-links"
        >
          <span /><span /><span />
        </button>

        <div id="nav-links" className={`navbar__links ${open ? 'navbar__links--open' : ''}`}>
          {LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/my-ballot" className="btn btn--primary navbar__cta" onClick={() => setOpen(false)}>
            Find my candidates
          </Link>
        </div>
      </div>
    </nav>
  )
}
