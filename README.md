# California Candidates on AI Safety — 2026 General Election

A neutral, sourced guide to what every candidate on California's November 3, 2026 ballot has said and done about AI safety.

- **Backend**: Ruby on Rails 7.1 API (no database: it reads the YAML files in `backend/db/data`)
- **Frontend**: React + Vite
- Same layout and deploy setup as `mama-california` (one Docker image; Rails serves the built React app)

---

## Project Structure

```
ca-ai-candidates/
├── backend/                    # Rails API
│   ├── app/
│   │   ├── controllers/api/v1/ # races, candidates, yardsticks (read-only)
│   │   └── models/guide.rb     # loads and validates the YAML
│   ├── db/
│   │   └── data/
│   │       ├── races.yml       # ← every race, candidate, vote and statement
│   │       └── yardsticks.yml  # ← the benchmark bills, votes and letters
│   └── spec/                   # data checks + API tests
└── frontend/                   # React + Vite
    └── src/
        ├── pages/              # Home, MyBallot, Races, Race, Candidate, Benchmarks, About
        ├── components/         # Navbar, Footer, RaceCard, CandidatePanel, DistrictPicker, ...
        ├── data.js             # loads the guide once; labels and section text
        └── api.js
```

---

## Setup

```bash
cd backend
bundle install
bin/rails s -p 3000
```

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Run the checks (validates the YAML and the API):

```bash
cd backend && bundle exec rspec
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/races | Every race with candidates, positions and record items |
| GET | /api/v1/races/:slug | One race (`governor`, `us-house-11`, `assembly-16`, `state-senate-2`, `boe-1`) |
| GET | /api/v1/candidates/:slug | One candidate plus their race |
| GET | /api/v1/yardsticks | The benchmark bills, votes and letters |

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | District picker, name search, counts, browse by office |
| `/my-ballot?cd=&sd=&ad=&boe=` | Your races | Statewide races + the user's districts (remembered on their device) |
| `/races` | All races | Filter by office, name or district number |
| `/races/:slug` | Race | Side-by-side table + full record for each candidate |
| `/candidates/:slug` | Candidate | One candidate's record, link to compare |
| `/benchmarks` | Bills & letters | Each yardstick and who on the ballot has a position on it |
| `/about` | How to read this | Methodology, labels, limits, sources |

---

## Editing the data

`backend/db/data/races.yml` is the source of truth. It was generated from the Oct. 14, 2026 Google Doc, and is meant to be edited by hand from here on. Changes go live on the next deploy. Locally, the dev server picks them up on the next page load. Run `bundle exec rspec` after editing; it catches typos like unknown parties, missing sources or bad yardstick keys. If a typo slips through, the new deploy fails its health check and Railway keeps the previous version live.

```yaml
- office: us_house            # governor, attorney_general, us_house, state_senate, state_assembly, board_of_equalization, ...
  district: 11
  note: Open seat (Pelosi retiring)
  candidates:
  - name: Scott Wiener
    sort_name: Wiener          # candidates are listed alphabetically by this
    party: D                   # D, R, NPP, L, G, P&F, or blank for nonpartisan offices
    incumbent: true            # optional; also incumbent_note, unopposed
    status: on_record          # on_record | ai_other | none_found  (see below)
    search_note: No campaign AI statements found.   # optional, shown in italics
    positions:                 # structured votes/sponsorships/signatures, keyed to yardsticks.yml
    - yardstick: sb1047
      position: author         # yes, no, did_not_vote, author, coauthor, sponsor, cosponsor, signed
      detail: Optional extra context (e.g. "Yes on first passage; no on final")
    items:                     # statements and actions; every item needs at least one link
    - text: Led 20 state lawmakers ... [[source]](https://...)
    - text: Public First Action ... put about $3.5 million into a pro-Wiener PAC. [[source]](https://...)
      kind: funding            # outside spending / endorsements, shown separately
```

Link labels are rewritten for display: `[[source]]` shows the site's domain, `[[1047]]` or `[[votes]]` shows "roll call".

### Status labels

The status describes **how much public record exists**, never whether it is good or bad.

| Status | Shown as | Meaning |
|--------|----------|---------|
| `on_record` | Public record on AI safety | Voted on, wrote, sponsored or signed something on AI safety, or spoke publicly about AI risk |
| `ai_other` | Has spoken on AI, not AI safety | AI comments only (schools, fraud detection, etc.) |
| `none_found` | No public AI statements found | Search found nothing; does not mean the candidate has no view |

### Judgment calls for review (Bridie)

These were made while converting the doc and are worth checking:

- **`ai_other`**: Herb W. Morgan, Sonja Shaw, Jamie Joyce, Melissa Hernandez (Hernandez's comment was about *where* AI should be regulated, not safety itself).
- **`none_found` despite an entry**: Jimmy Gomez (only outside PAC spending), Michael E. Gates (platform note only), James Gallagher and Leticia Castillo (only "did not vote" records).
- **Mixed votes** use the **final** floor vote as the position, with the full sequence in `detail` (e.g. Shannon Grove, Roger Niello, Kelly Seyarto, Tony Strickland, Ben Allen, Dave Min).
- **2025 reconciliation bill**: only the votes the doc listed (Republican "yes" votes) are recorded. Democratic "no" votes were not in the doc, so they are not shown. The bill's page notes it was a broad budget bill, not a standalone AI vote.
- **OpenAI incident letter** (Aug. 2026) was added as its own yardstick since five candidates signed it.
- **Funding items** (`kind: funding`) were tagged by keyword: Becerra (Encode AI donor), Wiener, Liccardo, Panetta, Gomez. Connie Chan's criticism of PAC spending stays a statement.
- **Dropped from the doc**: editorial summary lines such as "the sharpest contrasts are in…", "the clearest 'no' records belong to…", "has the deepest AI record". Section intros on the site only describe what the votes are.

---

## Neutrality choices

- Alphabetical by last name within each race
- Party shown as text; no red/blue anywhere
- "Voted yes" and "Voted no" are styled identically
- Outside spending is separated and labeled as actions by others
- No scores, grades, rankings or recommendations

---

## Deployment (Railway)

Same as `mama-california`: `railway.toml` builds the `Dockerfile`, which builds the React app into `backend/public` and runs Rails. The only variable to set is `SECRET_KEY_BASE`; no database is needed. Health check: `/healthz`.
