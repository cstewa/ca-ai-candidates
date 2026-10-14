// Renders guide text with inline source links written as [label](url) or [[label]](url).
// URLs may contain balanced parentheses (e.g. Wikipedia links).
const LINK = /\[\[?([^\]]+)\]?\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g

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
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      <a key={m.index} className="source-link" href={m[2]} target="_blank" rel="noreferrer">
        {linkLabel(m[1], m[2])}<span className="visually-hidden"> (opens in new tab)</span>
      </a>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}
