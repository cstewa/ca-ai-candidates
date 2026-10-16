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
│   │   ├── controllers/api/v1/ # races, candidates, yardsticks, zips (read-only)
│   │   └── models/             # guide.rb loads the YAML; zip_lookup.rb answers ZIP lookups
│   ├── db/
│   │   └── data/
│   │       ├── races.yml       # ← every race, candidate, vote and statement
│   │       ├── yardsticks.yml  # ← the benchmark bills, votes and letters
│   │       └── zip_lookup.json # ZIP code → districts and cities (generated)
│   └── spec/                   # data checks + API tests
├── scripts/build_zip_lookup.py # rebuilds zip_lookup.json from Census files
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
| GET | /api/v1/zips/:zip | Districts and covered mayor races for a California ZIP code, with each one's share of residents |

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | ZIP code field, name search, counts, browse by office |
| `/my-ballot?zip=` | Your candidates | Statewide races + mayor + districts for a ZIP; split ZIPs get switch buttons (`&cd=32`, `&in-mayor-los-angeles=yes`). `?cd=&sd=&ad=&boe=` still works for known districts |
| `/races` | All races | Filter by office, name or district number |
| `/races/:slug` | Race | Side-by-side table + full record for each candidate |
| `/candidates/:slug` | Candidate | One candidate's record, link to compare |
| `/benchmarks` | Bills & letters | Each yardstick and who on the ballot has a position on it |
| `/about` | How to read this | Methodology, labels, limits, sources |

---

## Editing the data

`backend/db/data/races.yml` is the source of truth. It was generated from the Oct. 14, 2026 Google Doc, and is meant to be edited by hand from here on. Changes go live on the next deploy. Locally, the dev server picks them up on the next page load. Run `bundle exec rspec` after editing; it catches typos like unknown parties, missing sources or bad yardstick keys. If a typo slips through, the new deploy fails its health check and Railway keeps the previous version live.

```yaml
- office: us_house            # governor, attorney_general, mayor, us_house, state_senate, state_assembly, board_of_equalization, ...
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
      kind: letter             # required: vote, bill, letter, statement, platform, official_action, background, funding
    - text: Public First Action ... put about $3.5 million into a pro-Wiener PAC. [[source]](https://...)
      kind: funding            # outside spending / endorsements, shown in their own section
```

A mayor's race names its city and that city's 5-digit Census place code, which the ZIP lookup uses to tell whether a ZIP is inside the city:

```yaml
- office: mayor
  city: Los Angeles
  place_fips: '44000'          # from the Census list of California places
  note: Nonpartisan office
  candidates: ...
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
- **Record type labels** (`kind`) were assigned from each item's wording, then hand-checked. Judgment calls: Kiley's 2018 Asilomar resolution = bill; Wiener's preemption push and Lieu's demand to AI companies = letter; Lieu's commission co-chair = official action; Chan's AI Pact and Morgan's fraud proposal = platform; Joyce's Society Library and the reactions to Obernolte's FRONTIER Act = background. Irwin's AB 2013 authorship was split from her votes.
- **LA mayor** (added Oct. 16): Bass = `ai_other` (two executive directives on using AI in city permitting, with human review and audits; nothing on AI safety). Raman = `none_found`. Worth a targeted check of council votes and forum coverage.
- **Funding items** (`kind: funding`) were tagged by keyword: Becerra (Encode AI donor), Wiener, Liccardo, Panetta, Gomez. Connie Chan's criticism of PAC spending stays a statement.
- **Dropped from the doc**: editorial summary lines such as "the sharpest contrasts are in…", "the clearest 'no' records belong to…", "has the deepest AI record". Section intros on the site only describe what the votes are.

---

## Rebuilding the ZIP lookup

`backend/db/data/zip_lookup.json` maps each California ZIP code (Census ZCTA) to the share of its 2020 residents in each congressional, State Senate, Assembly and Board of Equalization district, and in each city. It only needs rebuilding if district lines change. Download these into a folder outside the repo, then run the script:

| File | Source |
|------|--------|
| `tab20_zcta520_tabblock20_natl.txt` (filter to rows whose block starts with `06`) | [Census 2020 ZCTA relationship files](https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/) |
| `cageo2020.pl` (block populations) | [2020 P.L. 94-171 data for California](https://www2.census.gov/programs-surveys/decennial/2020/data/01-Redistricting_File--PL_94-171/California/) |
| `CD120_06.txt` (Prop 50 congressional map) | [Census 120th Congress block files](https://www.census.gov/geographies/mapping-files/2027/dec/rdo/120-congressional-district-bef.html) |
| `06_CA_SLDU22.txt`, `06_CA_SLDL22.txt` | [Census 2022 state legislative block files](https://www2.census.gov/programs-surveys/decennial/rdo/mapping-files/2023/2022-state-legislative-bef/) |
| `BOE_Final equiv.csv` | [2021 Citizens Redistricting Commission final maps](https://wedrawthelines.ca.gov/final-maps/) |
| `BlockAssign_ST06_CA_INCPLACE_CDP.txt` | [Census 2020 block assignment files](https://www2.census.gov/geo/docs/maps-data/data/baf2020/) |

```bash
python3 scripts/build_zip_lookup.py --zcta zcta_block_ca.txt --geo cageo2020.pl --cd CD120_06.txt --sd 06_CA_SLDU22.txt --ad 06_CA_SLDL22.txt --boe "BOE_Final equiv.csv" --place BlockAssign_ST06_CA_INCPLACE_CDP.txt --out backend/db/data/zip_lookup.json
```

The Census Senate and Assembly files match the Commission's final equivalency files block for block. Districts holding under 2% of a ZIP's residents are dropped as slivers.

---

## Neutrality choices

- Alphabetical by last name within each race
- Party shown as text; no red/blue anywhere
- "Voted yes" and "Voted no" are styled identically
- Outside spending is separated and labeled as actions by others
- Every record type label (Vote, Statement, …) uses the same style
- Split-ZIP buttons show district numbers only, never candidate names or parties
- No scores, grades, rankings or recommendations

---

## Deployment (Railway)

Same as `mama-california`: `railway.toml` builds the `Dockerfile`, which builds the React app into `backend/public` and runs Rails. No environment variables or database are needed. (The app has no logins or cookies, so it doesn't use `SECRET_KEY_BASE`; Rails generates a throwaway one at boot.) Health check: `/healthz`.
