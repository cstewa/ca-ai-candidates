import { useState } from 'react'
import DistrictPicker from './DistrictPicker'
import ZipForm from './ZipForm'
import { FIND_DISTRICTS_URL } from '../data'
import './DistrictFinder.css'

// "Find your district candidates": two paths, depending on whether the visitor knows their district numbers.
export default function DistrictFinder({ idPrefix, initial = {}, zip, headingLevel = 2 }) {
  const H = `h${headingLevel}`
  const [mode, setMode] = useState(null)

  return (
    <section className="dfinder" aria-labelledby={`${idPrefix}-h`}>
      <H id={`${idPrefix}-h`} className="dfinder__title">Find your district candidates</H>
      <p className="dfinder__intro">
        Your districts decide which candidates for Congress, State Senate and Assembly are on your ballot.
      </p>

      <div className="dfinder__options" role="group" aria-label="Do you know your district numbers?">
        <button type="button" className="dfinder__option" aria-pressed={mode === 'dont'} aria-expanded={mode === 'dont'} onClick={() => setMode('dont')}>
          I don't know my district numbers
        </button>
        <button type="button" className="dfinder__option" aria-pressed={mode === 'know'} aria-expanded={mode === 'know'} onClick={() => setMode('know')}>
          I know my district numbers
        </button>
      </div>

      {mode === 'dont' && (
        <div className="dfinder__panel">
          <ZipForm idPrefix={`${idPrefix}-zip`} size="small" initial={zip} label="Enter your ZIP code and we'll find them" />
          <p className="dfinder__alt">
            Want your exact districts?{' '}
            <a href={FIND_DISTRICTS_URL} target="_blank" rel="noreferrer">
              Look them up by street address<span className="visually-hidden"> on the State Legislature's site (opens in new tab)</span> ↗
            </a>
            , then come back and choose “I know my district numbers.”
          </p>
        </div>
      )}

      {mode === 'know' && (
        <div className="dfinder__panel">
          <DistrictPicker idPrefix={`${idPrefix}-d`} initial={initial} />
        </div>
      )}
    </section>
  )
}
