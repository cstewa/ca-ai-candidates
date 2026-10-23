import { useEffect, useState } from 'react'
import { getRaces, getYardsticks } from './api'

// The whole guide is small (~300 candidates), so it is fetched once and shared by every page.
let cache = null
let pending = null

function load() {
  if (!pending) {
    pending = Promise.all([getRaces(), getYardsticks()]).then(([r, y]) => {
      const races = r.data
      const yardsticks = Object.fromEntries(y.data.map(ys => [ys.key, ys]))
      const candidates = races.flatMap(race => race.candidates.map(c => ({ ...c, race })))
      cache = {
        races,
        yardsticks,
        yardstickList: y.data,
        candidates,
        raceBySlug: Object.fromEntries(races.map(rc => [rc.slug, rc])),
        candidateBySlug: Object.fromEntries(candidates.map(c => [c.slug, c])),
      }
      return cache
    }).catch(err => {
      pending = null
      throw err
    })
  }
  return pending
}

export function useGuide() {
  const [state, setState] = useState({ data: cache, error: null })

  useEffect(() => {
    if (cache) return
    let live = true
    load()
      .then(data => live && setState({ data, error: null }))
      .catch(error => live && setState({ data: null, error }))
    return () => { live = false }
  }, [])

  return { data: state.data, loading: !state.data && !state.error, error: state.error }
}

export const LAST_UPDATED = 'October 14, 2026'
export const ELECTION_DAY = 'November 3, 2026'
export const FIND_DISTRICTS_URL = 'https://findyourrep.legislature.ca.gov/'
export const BALLOT_STATUS_URL = 'https://www.sos.ca.gov/elections/ballot-status/wheres-my-ballot'
// The election-day message shows until the end of Nov. 3 in California.
export const VOTING_CLOSES = Date.parse('2026-11-04T08:00:00Z')
export const BALLOT_LIST_URL = 'https://elections.cdn.sos.ca.gov/statewide-elections/2026-general/cert-list-candidates.pdf'

export const CATEGORIES = [
  {
    key: 'statewide',
    label: 'Statewide offices',
    intro: 'Every California voter sees these races. The Attorney General enforces SB 53, the state law on frontier AI safety.',
  },
  {
    key: 'local',
    label: 'City races',
    intro: 'Mayoral races in Los Angeles, Oakland, Anaheim, Santa Ana, Irvine and Chula Vista, plus the Santa Monica City Council, which picks Santa Monica\'s mayor. Long Beach and San Bernardino re-elected their mayors outright in June, so those races aren\'t on the November ballot.',
  },
  {
    key: 'us_house',
    label: 'U.S. House',
    param: 'cd',
    districtLabel: 'Congressional district',
    splitLabel: 'congressional districts',
    intro: 'Members of Congress may have signed letters, sponsored federal bills, or voted on the 2025 House reconciliation bill. Some candidates are current or former state legislators with votes on California bills. Proposition 50 (2025) redrew the congressional maps, so some incumbents are running in a different district number than the one they represent now.',
  },
  {
    key: 'state_senate',
    label: 'State Senate',
    param: 'sd',
    districtLabel: 'State Senate district',
    splitLabel: 'State Senate districts',
    intro: 'Senators and former Assemblymembers have recorded votes on SB 1047, SB 53 and SB 813. Only even-numbered Senate districts are on the 2026 ballot.',
  },
  {
    key: 'state_assembly',
    label: 'State Assembly',
    param: 'ad',
    districtLabel: 'Assembly district',
    splitLabel: 'Assembly districts',
    intro: 'Incumbents have recorded Assembly floor votes on SB 1047 (2024), SB 53 (2025) and SB 813 (2026). Members first elected in 2024 had no SB 1047 vote.',
  },
  {
    key: 'board_of_equalization',
    label: 'Board of Equalization (state tax board)',
    param: 'boe',
    districtLabel: 'Board of Equalization district',
    splitLabel: 'Board of Equalization districts',
    intro: 'The Board of Equalization oversees some state taxes and has no role in AI policy. Some candidates are current or former legislators with votes on AI-safety bills.',
  },
]

export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

// Describes how much public record exists — never whether it is good or bad.
export const STATUSES = {
  on_record:  { label: 'Public record on AI safety',        short: 'Record on AI safety' },
  ai_other:   { label: 'Public record on other AI issues',  short: 'Other AI issues' },
  none_found: { label: 'No public AI statements found',     short: 'None found' },
}

// The type of each statement or action. Every type is styled the same way.
export const ITEM_KINDS = {
  vote: 'Vote',
  bill: 'Bill',
  letter: 'Letter',
  statement: 'Statement',
  platform: 'Platform',
  official_action: 'Official action',
  background: 'Background',
  funding: 'Outside money',
}

export const POSITION_LABELS = {
  yes: 'Voted yes',
  no: 'Voted no',
  did_not_vote: 'Did not vote',
  author: 'Author',
  coauthor: 'Co-author',
  sponsor: 'Sponsor',
  cosponsor: 'Co-sponsor',
  signed: 'Signed',
}

export function candidateMeta(c) {
  const parts = []
  if (c.party_label) parts.push(c.party_label)
  else if (c.party === null) parts.push('Nonpartisan office')
  if (c.incumbent) parts.push(c.incumbent_note ? `Incumbent (${c.incumbent_note})` : 'Incumbent')
  if (c.unopposed) parts.push('Unopposed')
  return parts.join(' · ')
}

export function districtsFor(races, category) {
  return races.filter(r => r.category === category).map(r => r.district)
}

export const STORAGE_KEY = 'ca-ai-candidates:districts'

export function savedDistricts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}

export const ZIP_KEY = 'ca-ai-candidates:zip'

export function savedZip() {
  try { return localStorage.getItem(ZIP_KEY) || '' } catch { return '' }
}

export function saveZip(zip) {
  try { localStorage.setItem(ZIP_KEY, zip) } catch { /* storage unavailable */ }
}

// Every bill, vote and letter has its own page.
export const billPath = key => `/bills/${key}`

export const SIGNUP_KEY = 'ca-ai-candidates:signed-up'

export function hasSignedUp() {
  try { return localStorage.getItem(SIGNUP_KEY) === '1' } catch { return false }
}

export function markSignedUp() {
  try { localStorage.setItem(SIGNUP_KEY, '1') } catch { /* storage unavailable */ }
  // Let every sign-up box on the page switch to "You're signed up".
  window.dispatchEvent(new Event(SIGNUP_KEY))
}
