import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Races from './pages/Races'
import Race from './pages/Race'
import Candidate from './pages/Candidate'
import MyBallot from './pages/MyBallot'
import Benchmarks from './pages/Benchmarks'
import About from './pages/About'
import NotFound from './pages/NotFound'
import './index.css'
import './App.css'

// New page: start at the top, unless the link points at a spot on it (#sb53).
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => { if (!hash) window.scrollTo(0, 0) }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app">
        <a href="#main" className="skip-link">Skip to content</a>
        <Navbar />
        <main id="main">
          <Routes>
            <Route path="/"                  element={<Home />} />
            <Route path="/my-ballot"         element={<MyBallot />} />
            <Route path="/races"             element={<Races />} />
            <Route path="/races/:slug"       element={<Race />} />
            <Route path="/candidates/:slug"  element={<Candidate />} />
            <Route path="/benchmarks"        element={<Benchmarks />} />
            <Route path="/about"             element={<About />} />
            <Route path="*"                  element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
