# AI Vote Watch — 2026 General Election

A neutral, sourced guide to what candidates on the November 3, 2026 ballot have said and done about AI safety: every U.S. House and Senate candidate in all 50 states, plus every candidate on California's state ballot. Live at https://aivotewatch.org.

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
│   │       ├── races.yml       # ← California: every race, candidate, vote and statement
│   │       ├── federal/*.yml   # ← U.S. Senate and House races in every other state, one file per state
│   │       ├── federal_votes.yml # official roll calls and cosponsorships by Bioguide ID (generated)
│   │       ├── yardsticks.yml  # ← the benchmark bills, votes and letters
│   │       └── zip_lookup.json # ZIP code → districts (generated)
│   └── spec/                   # data checks + API tests
├── scripts/build_zip_lookup.py # rebuilds zip_lookup.json from Census files
├── scripts/import_federal.rb   # imports federal races (Ballotpedia) and official votes
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
| GET | /api/v1/zips/:zip | Districts for a California ZIP code, with each one's share of residents |
| POST | /api/v1/signups | Email sign-up (`email`, optional `zip`, `source`); forwarded to the Google Form |

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | ZIP code field, name search, district finder ("I know / don't know my district numbers"), counts, browse by office |
| `/my-ballot?zip=` | Your candidates | Statewide races + districts for a ZIP; split ZIPs get switch buttons (`&cd=32`). `?cd=&sd=&ad=&boe=` still works for known districts |
| `/races` | All races | Filter by office, name or district number |
| `/races/:slug` | Race | Side-by-side table + full record for each candidate |
| `/candidates/:slug` | Candidate | One candidate's record, link to compare |
| `/bills` | Bills & letters | Every bill, vote and letter, plus how to read a position |
| `/bills/:key` | Bill | One bill: plain-language summary, official text, every candidate with a position. Bill chips and bill names elsewhere link here. Old `/benchmarks#key` links redirect |
| `/about` | How to read this | Methodology, labels, limits, sources |

---

## Editing the data

`backend/db/data/races.yml` (California) and `backend/db/data/federal/<state>.yml` (other states' U.S. Senate and House races) are the source of truth. `races.yml` was generated from the Oct. 14, 2026 Google Doc; the federal files were imported from Ballotpedia on Oct. 23 (see "Importing federal races"). Both are meant to be edited by hand from here on. Changes go live on the next deploy. Locally, the dev server picks them up on the next page load. Run `bundle exec rspec` after editing; it catches typos like unknown parties, missing sources or bad yardstick keys. If a typo slips through, the new deploy fails its health check and Railway keeps the previous version live.

```yaml
- office: us_house            # governor, attorney_general, us_house, state_senate, state_assembly, board_of_equalization, ...
  district: 11
  note: Open seat (Pelosi retiring)
  candidates:
  - name: Scott Wiener
    sort_name: Wiener          # candidates are listed alphabetically by this
    party: D                   # D, R, NPP, L, G, P&F, I, C; or blank, with party_name: for any other party
    incumbent: true            # optional; also incumbent_note, unopposed
    bioguide: W000830          # members of Congress: pulls in their official votes from federal_votes.yml
    status: on_record          # on_record | ai_other | none_found | not_reviewed  (see below)
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

Federal race files add `state:` (two-letter) and use `office: us_senate` or `us_house`; at-large House seats use `district: 0`. Their slugs carry the state (`us-house-tx-12`, `us-house-wy-at-large`, `us-senate-tx`); California's keep their original slugs (`us-house-11`) so shared links still work.

Positions written by hand win over imported ones for the same yardstick.

Link labels are rewritten for display: `[[source]]` shows the site's domain, `[[1047]]` or `[[votes]]` shows "roll call".

### Status labels

The status describes **how much public record exists**, never whether it is good or bad.

| Status | Shown as | Meaning |
|--------|----------|---------|
| `on_record` | Public record on AI safety | Voted on, wrote, sponsored or signed something on AI safety, or spoke publicly about AI risk |
| `ai_other` | Public record on other AI issues | Positions or actions on AI outside AI safety (schools, jobs, government use, fraud detection, etc.) |
| `none_found` | No public AI statements found | Search found nothing; does not mean the candidate has no view |
| `not_reviewed` | Record not yet reviewed | The race hasn't been researched yet. Official votes still show. Every candidate in a race moves off this status together |

**Review order for federal races** (set Oct. 23, before review began): every Senate race first, then House races alphabetically by state, then by district. A race is marked reviewed only when every candidate in it is done.

### Judgment calls for review (Bridie)

These were made while converting the doc and are worth checking:

- **`ai_other`**: Herb W. Morgan, Sonja Shaw, Richard Barrera (added Oct. 20: AI in schools, from Voice of San Diego), Jamie Joyce, Melissa Hernandez (Hernandez's comment was about *where* AI should be regulated, not safety itself).
- **`none_found` despite an entry**: Michael E. Gates (platform note only) and Leticia Castillo (only "did not vote" records).
- **Moved to `on_record` by official House votes (Oct. 23):** once roll calls were imported, 10 California House members had recorded votes on federal yardsticks (the reconciliation bill, the TAKE IT DOWN Act or the KIDS Act): James Gallagher, John Garamendi, Josh Harder, Adam Gray (was `ai_other`), Jim Costa, Raul Ruiz, Jimmy Gomez, Norma J. Torres, Maxine Waters and Juan Vargas. Recorded votes on AI-safety yardsticks count as a record, as they do for state legislators.
- **Mixed votes** use the **final** floor vote as the position, with the full sequence in `detail` (e.g. Shannon Grove, Roger Niello, Kelly Seyarto, Tony Strickland, Ben Allen, Dave Min).
- **2025 reconciliation bill**: the doc listed only Republican "yes" votes. Since Oct. 23 every House member's vote comes from the official roll call (`federal_votes.yml`), so "no" votes show too. The bill's page notes it was a broad budget bill, not a standalone AI vote.
- **Federal yardsticks (Oct. 23):** added the Senate vote to strip the AI moratorium (99-1), the TAKE IT DOWN Act House vote (409-2), the KIDS Act House vote (267-117; a broad child online safety package that includes chatbot rules, noted on its page), and cosponsorship of the GUARD Act, the AI Risk Evaluation Act and the GUARDRAILS Act. Approved as drafted in the national-expansion PRD.
- **Senate review (Phase 2, Oct. 23):** all 35 Senate races, 123 candidates, reviewed the same way as the California campaign-site check: campaign site from Ballotpedia (web search when none was listed), scanned for AI, data center, deepfake and chatbot mentions, every hit read by hand. Results: 38 `on_record`, 23 `ai_other`, 62 `none_found`. Judgment calls:
    - Sitting members with recorded votes on federal yardsticks are `on_record` even with nothing on their campaign site (same rule as California's House members).
    - `on_record` from campaign sites alone: Angie Nixon, Adam Withrow (frontier AI evolving "faster than the institutions"), Jamie Davis, John Deaton, Abdul El-Sayed, Peggy Flanagan (AI in insurance denials, like Judy Chu's California entry), Alani Bankhead, Seth Bodnar, James Talarico ("guidelines that protect Americans from harm").
    - Data center positions (costs, moratoriums, local consent) are `ai_other`, as in California, including Dan Osborn's opposition to data center tax breaks (his site states it while criticizing his opponent). So are Natalie Fleming ("algorithmic transparency"), Todd Achilles (AI and intellectual property) and Chris Pappas's "AI-driven price discrimination" (he is `on_record` from votes).
    - Not counted: attacks on opponents (Mike Rogers calling his opponent "a glitchy AI chatbot," Annie Andrews naming "data center developers" as her opponent's backers), "algorithms" in grocery or housing pricing (Roy Cooper, Todd Achilles), links to news articles, and false hits (A.I. duPont Hospital, Instagram's "Meta AI").
    - Ballotpedia linked the wrong site for Gerald Heikes (his opponent's) and Timothy Long (his opponent's), and Yoshi Matthews's site was offline; with no other site found, all three are `none_found` with "No campaign website found." Bill Hagerty's site blocks automated visits, so it couldn't be read; he is `on_record` from his vote.
- **Write-in candidates** aren't listed for federal races, since they aren't printed on the ballot.
- **OpenAI incident letter** (Aug. 2026) was added as its own yardstick since five candidates signed it.
- **Record type labels** (`kind`) were assigned from each item's wording, then hand-checked. Judgment calls: Kiley's 2018 Asilomar resolution = bill; Wiener's preemption push and Lieu's demand to AI companies = letter; Lieu's commission co-chair = official action; Chan's AI Pact and Morgan's fraud proposal = platform; Joyce's Society Library and the reactions to Obernolte's FRONTIER Act = background. Irwin's AB 2013 authorship was split from her votes.
- **City and school board races removed** (Oct. 23): the site covers only statewide and district races (House, State Senate, Assembly, Board of Equalization), which every voter has and where AI law gets written. Mayor races (LA, Oakland, Anaheim, Santa Ana, Irvine, Chula Vista) and the Santa Monica City Council were added and then taken out; they're in git history (commit 073fe91) if they come back. `zip_lookup.json` still records each ZIP's city shares, unused.
- **Campaign-site check (Oct. 21):** every candidate marked `none_found` had their campaign site checked (found via Ballotpedia, or a web search when Ballotpedia listed none). Sites were scanned for AI, data center, deepfake and chatbot mentions, and every hit was read before anything was added. 35 candidates changed:
    - **Now `on_record`:** Sara Hernandez (after her campaign wrote in; her platform page confirms it), Eric Jones, Mark Rendón, JJ Galvez, Randy Villegas, Ida Obeso-Martinez, Cristian Morales, Larry Thompson, Brian Goldsmith, Joe Lisuzzo, Judy Chu (her 2024 letter on AI in Medicare coverage decisions).
    - **Now `ai_other`:** Angela Gonzales-Torres, Angélica María Dueñas, Andrea Lee Anderson, Deborah Klein Lopez, Houston Brignano, Jabra Muhawieh, Jackie Elward, Jaron Brandon, Jeff Frese, Jessie Lopez, Chris Kluwe, Kevin Akin, Leila Namvar, Mai Vang, Nithya Raman, Rickey Hayes II, Victor Hernandez, Adam Gray, Tessa Lynn Hodge, Sarah Rascón, Michael MacDonald, Andre Sandford, Jeff Belle, Bob Smith.
    - **Rule used to tell the two apart:** `on_record` = the candidate calls for preventing harm from AI systems themselves (testing, oversight bodies, liability, safeguards, or limits on harmful uses such as AI chatbots aimed at kids, AI-generated abuse images, AI-built weapons, or AI denying medical care). `ai_other` = AI's effects on jobs, energy, schools, costs or competitiveness, including data centers. Closest calls: Lisuzzo and Goldsmith (`on_record`), Raman (data centers only, no mention of AI).
    - **Left out on purpose:** attacks on opponents (Amy Slavensky's release about her opponent's AI ad; Sarah Rascón's and Eric Jones's lines about their opponents' donors), passing mentions (Shane Lewis: AI raising grid demand; Adam Gray: a building with "automation technology"), AI-ad disclosures (Jennifer Hawks), and "addictive algorithms" in social-media bills (Stephanie Vargas).
    - **Couldn't check:** no campaign site found for Kevin Lincoln, Peter Sundin Soulé, Susan Mason, Araceli Martinez, Jagtar Singh, Tom Patti, Manuel Noris-Barrera, David G. Johnson, Adam Vena, Ricardo Benitez, Dan Tran, Trinity Hannaway, Payton Galvez, Alejandro Galicia; sites that wouldn't load or need a login: Malia Cohen (official bio), Scott Meyers, Lydia Gutiérrez, Tony Rodriguez, Jessica Martinez. Matthew Adams discussed data centers in a video interview, but his position isn't stated in text, so nothing was added.
- **Funding items** (`kind: funding`) were tagged by keyword: Becerra (Encode AI donor), Wiener, Liccardo, Panetta, Gomez. Connie Chan's criticism of PAC spending stays a statement.
- **Dropped from the doc**: editorial summary lines such as "the sharpest contrasts are in…", "the clearest 'no' records belong to…", "has the deepest AI record". Section intros on the site only describe what the votes are.

---

## Email sign-ups

Sign-up boxes (under "Your candidates in [ZIP]", at the end of the results, on the homepage, and "Get notified if they answer" on candidates with no record) submit in place. The server forwards each one to the Google Form **AI CA Political Activism** (`backend/app/models/google_form.rb`), so responses land in the form and its Sheet. Visitors never see Google.

- **Segmenting by district:** add short-answer questions titled **ZIP code** and **Signed up from** to the form. The server matches questions by title (re-checked hourly), so they start filling in with no code change. "Signed up from" is `results`, `home` or `candidate`.
- **Local development** logs sign-ups instead of sending them, so test clicks don't reach the form. Set `SIGNUP_LIVE=1` to send for real.
- **Unsubscribe:** the sign-up copy promises "Unsubscribe anytime." With a Google Form, that's manual: delete the row when someone asks, and include a reply-to-unsubscribe line in every email.
- Email addresses are filtered out of the server logs.

## Measuring sign-ups

The server logs one line per ZIP lookup and per sign-up. In Railway's logs for the app, search:

- `event=zip_lookup found=yes`: ZIP lookups that found a California ZIP
- `event=signup source=results`: sign-ups from the results page

Sign-ups from results ÷ successful ZIP lookups = the share of lookups that end in a sign-up. Railway keeps logs for a limited time, so note the counts daily.

## Rebuilding the ZIP lookup

`backend/db/data/zip_lookup.json` maps each U.S. ZIP code (Census ZCTA) to its congressional districts on the 2026 maps, with the share of the ZIP in each, plus California's State Senate, Assembly and Board of Equalization districts. It only needs rebuilding if district lines change. `scripts/build_zip_lookup.py` uses three sources:

- **California:** carried over from the California-only lookup (commit 1cbb604), built from 2020 Census blocks weighted by population. See that commit's README for its inputs.
- **The 8 other redrawn states** (AL, FL, LA, NC, OH, TN, TX, UT): each census tract's 2020 population is split among districts by its blocks, and each ZIP takes its share of the tracts it overlaps, by land area.
- **Every other state:** the Census ZIP-to-119th-district file, weighted by land area, since those maps are unchanged. Missouri is in this group: its new map is on hold, so the 2024 map is used on Nov. 3.

Download these into a folder outside the repo:

| File | Source |
|------|--------|
| `tab20_cd11920_zcta520_natl.txt` | [Census CD-to-ZCTA relationship files](https://www2.census.gov/geo/docs/maps-data/data/rel2020/cd-sld/) |
| `NationalCD120.txt` (inside `cd120.zip`; regenerated Oct. 7, 2026 for Missouri) | [Census 120th Congress block files](https://www.census.gov/geographies/mapping-files/2027/dec/rdo/120-congressional-district-bef.html) |
| `tab20_zcta520_tract20_natl.txt` | [Census 2020 ZCTA relationship files](https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/) |
| `algeo2020.pl`, `flgeo2020.pl`, `lageo2020.pl`, `ncgeo2020.pl`, `ohgeo2020.pl`, `tngeo2020.pl`, `txgeo2020.pl`, `utgeo2020.pl` (from each state's `xx2020.pl.zip`) | [2020 P.L. 94-171 data](https://www2.census.gov/programs-surveys/decennial/2020/data/01-Redistricting_File--PL_94-171/) |

```bash
git show 1cbb604:backend/db/data/zip_lookup.json > ca_zip_lookup.json
python3 scripts/build_zip_lookup.py --ca ca_zip_lookup.json --cd119 tab20_cd11920_zcta520_natl.txt --cd120 NationalCD120.txt --zcta tab20_zcta520_tract20_natl.txt --geo-dir . --out backend/db/data/zip_lookup.json
```

Districts holding under 2% of a ZIP are dropped as slivers. Washington, D.C. (non-voting delegate) isn't covered.

## Importing federal races

`scripts/import_federal.rb` writes `backend/db/data/federal/<state>.yml` (races and candidates outside California, all starting as `not_reviewed`) and regenerates `federal_votes.yml` (official votes and cosponsorships). It never overwrites an existing state file unless given `--force`, since those files hold hand-written research. Inputs:

| Input | Source |
|-------|--------|
| General-election candidates, one JSON entry per Ballotpedia district or Senate page | [Ballotpedia](https://ballotpedia.org/United_States_House_of_Representatives_elections,_2026), read through a browser (Ballotpedia blocks scripts), about 3 seconds apart |
| `legislators-current.json`, `legislators-historical.json` (Bioguide IDs, matched to Ballotpedia pages) | [unitedstates/congress-legislators](https://unitedstates.github.io/congress-legislators/) |
| House roll calls `h2025-145.xml` (reconciliation bill), `h2025-104.xml` (TAKE IT DOWN Act), `kids_act.xml` (2026 roll 228) | `https://clerk.house.gov/evs/<year>/roll<NNN>.xml` |
| Senate roll call 119-1-363 (moratorium amendment), as `LIS_ID:Vote,...` | [senate.gov](https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00363.xml) (blocks scripts; read through a browser) |
| `bs_s3062.xml`, `bs_s2938.xml`, `bs_hr8031.xml`, `bs_s4216.xml` (sponsors and cosponsors) | `https://www.govinfo.gov/bulkdata/BILLSTATUS/119/<type>/BILLSTATUS-119<bill>.xml` |

```bash
ruby scripts/import_federal.rb --ballotpedia ballotpedia.json --legislators . --rolls rolls --bills . --senate senate_363.txt
```

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
