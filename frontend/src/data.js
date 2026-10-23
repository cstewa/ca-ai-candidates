import { useEffect, useState } from 'react'
import { getRaces, getYardsticks } from './api'

// The whole guide is fetched once and shared by every page. Even nationwide it is ~1,600
// candidates, most with only a few official votes, so this stays small once compressed.
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

export const LAST_UPDATED = 'October 23, 2026'
export const ELECTION_DAY = 'November 3, 2026'
export const FIND_DISTRICTS_URL = 'https://findyourrep.legislature.ca.gov/'
export const BALLOT_STATUS_URL = 'https://www.sos.ca.gov/elections/ballot-status/wheres-my-ballot'
export const VOTE_GOV_URL = 'https://vote.gov/'
// The election-day message shows until polls close on Nov. 3 in the last time zone (Hawaii and Alaska).
export const VOTING_CLOSES = Date.parse('2026-11-04T06:00:00Z')
export const BALLOT_LIST_URL = 'https://elections.cdn.sos.ca.gov/statewide-elections/2026-general/cert-list-candidates.pdf'

export const SITE_NAME = 'AI Vote Watch'

// Federal races cover every state; the rest (caOnly) are California's state races.
export const CATEGORIES = [
  {
    key: 'us_senate',
    label: 'U.S. Senate',
    intro: '35 Senate seats are on the ballot in 34 states, including special elections in Florida and Ohio. California has no Senate race this year. Senators who served in 2025 have a recorded vote on stripping the 10-year ban on state AI laws.',
  },
  {
    key: 'us_house',
    label: 'U.S. House',
    param: 'cd',
    districtLabel: 'Congressional district',
    splitLabel: 'congressional districts',
    intro: 'All 435 seats are on the ballot. Members of Congress have recorded votes on the 2025 reconciliation bill and the TAKE IT DOWN Act, and may have sponsored federal AI bills or signed letters. Nine states redrew their maps for 2026 (Alabama, California, Florida, Louisiana, North Carolina, Ohio, Tennessee, Texas and Utah), so some incumbents are running in a different district number.',
  },
  {
    key: 'statewide',
    label: 'California statewide offices',
    caOnly: true,
    intro: 'Every California voter sees these races. The Attorney General enforces SB 53, the state law on frontier AI safety.',
  },
  {
    key: 'state_senate',
    caOnly: true,
    label: 'California State Senate',
    param: 'sd',
    districtLabel: 'State Senate district',
    splitLabel: 'State Senate districts',
    intro: 'Senators and former Assemblymembers have recorded votes on SB 1047, SB 53 and SB 813. Only even-numbered Senate districts are on the 2026 ballot.',
  },
  {
    key: 'state_assembly',
    caOnly: true,
    label: 'California State Assembly',
    param: 'ad',
    districtLabel: 'Assembly district',
    splitLabel: 'Assembly districts',
    intro: 'Incumbents have recorded Assembly floor votes on SB 1047 (2024), SB 53 (2025) and SB 813 (2026). Members first elected in 2024 had no SB 1047 vote.',
  },
  {
    key: 'board_of_equalization',
    caOnly: true,
    label: 'California Board of Equalization (state tax board)',
    param: 'boe',
    districtLabel: 'Board of Equalization district',
    splitLabel: 'Board of Equalization districts',
    intro: 'The Board of Equalization oversees some state taxes and has no role in AI policy. Some candidates are current or former legislators with votes on AI-safety bills.',
  },
]

export const STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming',
}

// What a "Record not yet reviewed" candidate card says.
export const NOT_REVIEWED_NOTE = "We haven't finished reviewing this race yet. Votes shown are from official records."

export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

// Describes how much public record exists — never whether it is good or bad.
export const STATUSES = {
  on_record:  { label: 'Public record on AI safety',        short: 'Record on AI safety' },
  ai_other:   { label: 'Public record on other AI issues',  short: 'Other AI issues' },
  none_found: { label: 'No public AI statements found',     short: 'None found' },
  not_reviewed: { label: 'Record not yet reviewed',          short: 'Not yet reviewed' },
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
