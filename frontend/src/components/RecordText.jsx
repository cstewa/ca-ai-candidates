import { Link } from 'react-router-dom'

// Renders guide text with inline source links written as [label](url) or [[label]](url).
// URLs may contain balanced parentheses (e.g. Wikipedia links).
const LINK = /\[\[?([^\]]+)\]?\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g

// Bill and letter names in the text link to their plain-language entry on Bills & letters.
const BILLS = /\bSB (1047|53|813|947|574|867)\b|\bAB (1018|1405|2013)\b|\b(?:AI )?Kill Switch Act\b|\bFRONTIER Act\b|\b107-member(?: letter)?/g

// Other bills mentioned in records, which link straight to the official bill page.
const OFFICIAL = {
  'SB 947': 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB947',
  'SB 574': 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB574',
  'SB 867': 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB867',
  'AB 1018': 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260AB1018',
  'AB 1405': 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260AB1405',
  'AB 2013': 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2013',
}

function billKey(name) {
  if (name.startsWith('SB ')) return `sb${name.slice(3)}`
  if (name.includes('Kill Switch')) return 'kill_switch_act'
  if (name.startsWith('FRONTIER')) return 'frontier_act'
  return 'letter_107'
}

function linkBills(text, keyBase) {
  const out = []
  let last = 0
  for (const m of text.matchAll(BILLS)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = `${keyBase}-${m.index}`
    out.push(OFFICIAL[m[0]]
      ? <a key={key} href={OFFICIAL[m[0]]} target="_blank" rel="noreferrer" className="bill-link">{m[0]}<span className="visually-hidden"> (official bill text, opens in new tab)</span></a>
      : <Link key={key} to={`/benchmarks#${billKey(m[0])}`} className="bill-link">{m[0]}</Link>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function host(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return 'source' }
}

function linkLabel(label, url) {
  if (/^\d+$/.test(label)) return `SB ${label} roll call`
  if (label === 'votes') return 'roll call'
  if (/^SB \d+ votes$/.test(label)) return label.replace('votes', 'roll call')
  if (label === 'source' || label === 'ballot') return host(url)
  return label
}

export default function RecordText({ text }) {
  const out = []
  let last = 0
  for (const m of text.matchAll(LINK)) {
    if (m.index > last) out.push(...linkBills(text.slice(last, m.index), last))
    out.push(
      <a key={m.index} className="source-link" href={m[2]} target="_blank" rel="noreferrer">
        {linkLabel(m[1], m[2])}<span className="visually-hidden"> (opens in new tab)</span>
      </a>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(...linkBills(text.slice(last), last))
  return <>{out}</>
}
