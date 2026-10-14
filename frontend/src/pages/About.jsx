import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { LAST_UPDATED, BALLOT_LIST_URL } from '../data'

const SOURCES = [
  ['Certified List of Candidates, Nov. 3, 2026 (California Secretary of State)', BALLOT_LIST_URL],
  ['SB 1047 roll calls (FastDemocracy, from official records)', 'https://fastdemocracy.com/bill-search/ca/2023-2024/bills/CAB00031416/'],
  ['SB 53 roll calls', 'https://fastdemocracy.com/bill-search/ca/2025-2026/bills/CAB00033508/'],
  ['SB 813 roll calls', 'https://fastdemocracy.com/bill-search/ca/2025-2026/bills/CAB00035450/'],
  ['Neither Becerra nor Hilton will commit to AI safety guidelines (CalMatters, Sept. 18, 2026)', 'https://calmatters.org/politics/2026/09/california-governor-race-ai-safety/'],
  ['107-member letter and signers (Rep. Liccardo)', 'https://liccardo.house.gov/media/press-releases/over-hundred-house-democrats-demand-congress-stay-session-confront-ai-crisis'],
  ['Letter to OpenAI and signers (Rep. Casar)', 'https://casar.house.gov/media/press-releases/casar-leads-demand-information-open-ai-about-security-incident'],
  ['House reconciliation vote and AI moratorium (Center for American Progress Action)', 'https://www.americanprogressaction.org/article/almost-every-house-republican-voted-to-block-state-and-local-governments-ability-to-protect-residents-from-ai-data-centers/'],
  ['AI super PAC spending in California (Transformer tracker)', 'https://elections.transformernews.ai/states/ca'],
]

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>How to read this guide</h1>
          <p>What we counted, what the labels mean, and what this guide can't tell you.</p>
        </div>
      </section>

      <div className="container prose" style={{ maxWidth: 860, paddingTop: 16 }}>
        <h2>What this is</h2>
        <p>
          This guide lists every candidate on California's certified November 3, 2026 ballot, office by office,
          with what each has said or done about AI and AI safety. By AI safety we mean catastrophic risk, loss of
          human control over AI systems, AI-enabled cyber and biological threats, and oversight of the companies
          building the most powerful models.
        </p>
        <p>It reports records. It does not endorse, score or rank anyone.</p>

        <h2>What counts as a record</h2>
        <ul>
          <li>Recorded floor votes on the main AI-safety bills (see <Link to="/benchmarks">Bills &amp; letters</Link>)</li>
          <li>Bills a candidate wrote, sponsored or co-sponsored</li>
          <li>Letters a candidate signed</li>
          <li>Public statements in news coverage, debates and campaign websites</li>
        </ul>
        <p>
          For legislators, votes are often the clearest signal, since few challengers have spoken about
          catastrophic AI risk at all. Every item links to its source.
        </p>

        <h2>The three groups</h2>
        <p>Each candidate is placed in one group based on <em>how much</em> public record exists, not on what it says.</p>
        <dl>
          <dt><StatusBadge status="on_record" /></dt>
          <dd>Has voted on, written, sponsored or signed something on AI safety, or spoken publicly about AI risk.</dd>
          <dt><StatusBadge status="ai_other" /></dt>
          <dd>Has spoken about AI (for example, its use in schools or government) but not about AI safety specifically.</dd>
          <dt><StatusBadge status="none_found" /></dt>
          <dd>
            A targeted search of news, voter guides and vote records found nothing. This does not mean the candidate
            has no view. Many challengers have a small online footprint, and asking them directly is the best way to
            fill the gap.
          </dd>
        </dl>

        <h2>Keeping it neutral</h2>
        <ul>
          <li>Candidates in each race are listed alphabetically by last name.</li>
          <li>Parties appear as text only. The site avoids party colors.</li>
          <li>A “yes” and a “no” vote look exactly the same. Readers can decide what a vote means to them.</li>
          <li>Where a vote was on a large bill that covered much more than AI, the bill's page says so.</li>
          <li>Spending by outside groups is shown separately and labeled as something others did, not something the candidate said.</li>
        </ul>

        <h2>AI-policy groups that spend in elections</h2>
        <p>Spending is noted where it happened. Two networks are active in California races:</p>
        <ul>
          <li><strong>Leading the Future / Think Big</strong>: industry-funded; favors lighter, federal-only rules.</li>
          <li><strong>Public First / Guardrails Alliance</strong>: favors stronger safeguards.</li>
        </ul>

        <h2>Limits</h2>
        <ul>
          <li>Debate content comes from written news coverage, not from watching the debates.</li>
          <li>
            District numbers follow the 2026 ballot. Proposition 50 (2025) redrew the congressional maps, so some
            incumbents are running in a different district number than the one they represent now.
          </li>
          <li>Records are current as of {LAST_UPDATED}. Candidates may have said more since.</li>
        </ul>

        <h2>Main sources</h2>
        <ul>
          {SOURCES.map(([label, url]) => (
            <li key={url}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>
          ))}
        </ul>
        <p>Every other source is linked next to the item it supports.</p>
      </div>
    </>
  )
}
