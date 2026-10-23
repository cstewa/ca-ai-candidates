#!/usr/bin/env ruby
# Imports the federal (U.S. House and Senate) races outside California, and the
# official votes and cosponsorships used as federal yardsticks.
#
# Writes:
#   backend/db/data/federal/<state>.yml  one file per state: races and candidates, every
#                                        candidate starting as not_reviewed. Existing files
#                                        are left alone (they hold hand-written research)
#                                        unless --force is given.
#   backend/db/data/federal_votes.yml    Bioguide ID => positions, regenerated every run.
#
# Inputs (see README "Importing federal races"):
#   --ballotpedia FILE  JSON rows, one per Ballotpedia race page, read from each page's Nov. 3, 2026 box:
#                       [race heading, 1 if unopposed and not printed on the ballot,
#                        [[name, Ballotpedia path, party, 1 if incumbent], ...]] (write-ins left out)
#   --legislators DIR   legislators-current.json and legislators-historical.json (unitedstates/congress-legislators)
#   --rolls DIR         House Clerk roll-call XML, named h<year>-<roll>.xml
#   --bills DIR         GovInfo BILLSTATUS XML, named bs_<bill>.xml (e.g. bs_s3062.xml)
#   --senate FILE       Senate roll call 119-1-363 as "LIS_ID:Vote,..."
Encoding.default_external = Encoding::UTF_8
require "json"
require "yaml"
require "rexml/document"
require "optparse"
require "cgi"
require "set"

ROOT = File.expand_path("..", __dir__)
DATA = File.join(ROOT, "backend", "db", "data")

opts = {}
OptionParser.new do |o|
  %w[ballotpedia legislators rolls bills senate].each { |k| o.on("--#{k} PATH") { |v| opts[k] = v } }
  o.on("--force") { opts["force"] = true }
end.parse!

STATES = {
  "Alabama" => "AL", "Alaska" => "AK", "Arizona" => "AZ", "Arkansas" => "AR", "California" => "CA",
  "Colorado" => "CO", "Connecticut" => "CT", "Delaware" => "DE", "Florida" => "FL", "Georgia" => "GA",
  "Hawaii" => "HI", "Idaho" => "ID", "Illinois" => "IL", "Indiana" => "IN", "Iowa" => "IA",
  "Kansas" => "KS", "Kentucky" => "KY", "Louisiana" => "LA", "Maine" => "ME", "Maryland" => "MD",
  "Massachusetts" => "MA", "Michigan" => "MI", "Minnesota" => "MN", "Mississippi" => "MS", "Missouri" => "MO",
  "Montana" => "MT", "Nebraska" => "NE", "Nevada" => "NV", "New Hampshire" => "NH", "New Jersey" => "NJ",
  "New Mexico" => "NM", "New York" => "NY", "North Carolina" => "NC", "North Dakota" => "ND", "Ohio" => "OH",
  "Oklahoma" => "OK", "Oregon" => "OR", "Pennsylvania" => "PA", "Rhode Island" => "RI", "South Carolina" => "SC",
  "South Dakota" => "SD", "Tennessee" => "TN", "Texas" => "TX", "Utah" => "UT", "Vermont" => "VT",
  "Virginia" => "VA", "Washington" => "WA", "West Virginia" => "WV", "Wisconsin" => "WI", "Wyoming" => "WY",
}.freeze

FULL_PARTY = { "D" => "Democratic", "R" => "Republican", "L" => "Libertarian", "G" => "Green" }.freeze
PARTY_CODES = { "D" => "D", "R" => "R", "L" => "L", "G" => "G", "Independent" => "I", "Constitution" => "C", "Constitution Party" => "C" }.freeze

# States whose 2026 House map differs from the 2024 one (district numbers moved).
REDRAWN = %w[AL FL LA NC OH TN TX UT].freeze

# One line on how the race is decided, where it differs from a plain plurality vote.
STATE_NOTES = {
  "AK" => "Ranked-choice voting",
  "ME" => "Ranked-choice voting",
  "GA" => "If no one wins a majority, the top two meet in a Dec. 1 runoff.",
}.freeze
# Louisiana's House races on Nov. 3 are all-candidate primaries (its Senate race is a regular general election).
LOUISIANA_HOUSE = "All candidates run on one ballot. If no one wins a majority, the top two meet in a December runoff."
NOT_ON_BALLOT = "Unopposed. Florida doesn't print unopposed races, so this one isn't on the Nov. 3 ballot."
SENATE_SPECIALS = {
  "FL" => "Special election for the last two years of the term Marco Rubio won in 2022.",
  "OH" => "Special election for the last two years of the term JD Vance won in 2022.",
}.freeze

# --- Members of Congress, by Ballotpedia page and by Senate LIS ID -----------------
legislators = %w[current historical].flat_map { |k| JSON.parse(File.read(File.join(opts["legislators"], "legislators-#{k}.json"))) }
# Only people who served in the 119th Congress (2025-) can have these votes.
legislators.select! { |l| l["terms"].any? { |t| t["end"] >= "2025-01-03" } }
by_ballotpedia = legislators.select { |l| l.dig("id", "ballotpedia") }.to_h { |l| [l.dig("id", "ballotpedia"), l] }
by_lis = legislators.select { |l| l.dig("id", "lis") }.to_h { |l| [l.dig("id", "lis"), l] }

def page_title(href)
  CGI.unescape(href.to_s.sub(%r{\A(https?://ballotpedia\.org)?/}, "")).tr("_", " ")
end

SUFFIXES = /\A(Jr\.?|Sr\.?|II|III|IV|V)\z/
def sort_name(name, legislator)
  return legislator.dig("name", "last") if legislator
  parts = name.sub(/\s*\(.*\)\z/, "").split
  parts.pop while parts.size > 1 && parts.last.match?(SUFFIXES)
  parts.last.delete(",")
end

# --- Official votes and cosponsorships ------------------------------------------
votes = Hash.new { |h, k| h[k] = [] }
VOTE_VALUES = { "Yea" => "yes", "Aye" => "yes", "Nay" => "no", "No" => "no", "Not Voting" => "did_not_vote" }.freeze

def house_roll(votes, path, yardstick)
  doc = REXML::Document.new(File.read(path))
  doc.elements.each("//recorded-vote") do |rv|
    id = rv.elements["legislator"].attributes["name-id"]
    value = VOTE_VALUES[rv.elements["vote"].text.strip] or next
    votes[id] << { "yardstick" => yardstick, "position" => value }
  end
end

house_roll(votes, File.join(opts["rolls"], "h2025-145.xml"), "moratorium_2025")
house_roll(votes, File.join(opts["rolls"], "h2025-104.xml"), "take_it_down_act")
kids = Dir[File.join(opts["rolls"], "kids_act.xml")].first
house_roll(votes, kids, "kids_act") if kids

File.read(opts["senate"]).strip.split(",").each do |pair|
  lis, vote = pair.split(":")
  member = by_lis[lis] or abort("unknown senator #{lis}")
  votes[member.dig("id", "bioguide")] << { "yardstick" => "senate_moratorium_2025", "position" => VOTE_VALUES.fetch(vote) }
end

{ "guard_act" => %w[s3062], "ai_risk_evaluation_act" => %w[s2938], "guardrails_act" => %w[hr8031 s4216] }.each do |yardstick, bills|
  bills.each do |b|
    doc = REXML::Document.new(File.read(File.join(opts["bills"], "bs_#{b}.xml")))
    doc.elements.each("//bill/sponsors/item") { |i| votes[i.elements["bioguideId"].text] << { "yardstick" => yardstick, "position" => "sponsor" } }
    doc.elements.each("//bill/cosponsors/item") do |i|
      next if i.elements["sponsorshipWithdrawnDate"]&.text.to_s != ""
      votes[i.elements["bioguideId"].text] << { "yardstick" => yardstick, "position" => "cosponsor" }
    end
  end
end

# --- Races -----------------------------------------------------------------------
rows = JSON.parse(File.read(opts["ballotpedia"]))
races = Hash.new { |h, k| h[k] = [] }
on_ballot = Set.new
unmatched_incumbents = []
name_matched = []

rows.each do |head, not_on_ballot, people|
  if (m = head.match(/U\.S\. Senate (.+?)\z/))
    office, state, district = "us_senate", STATES.fetch(m[1].strip), nil
  elsif (m = head.match(/U\.S\. House (.+?) (?:District (\d+)|At-large District)\z/i))
    office, state, district = "us_house", STATES.fetch(m[1].strip), (m[2] ? m[2].to_i : 0)
  else
    abort("can't read race name #{head.inspect}")
  end
  next if state == "CA" && office == "us_house" # California's House races are hand-written in races.yml

  candidates = people.map do |name, path, party, incumbent|
    legislator = by_ballotpedia[page_title(path)]
    # A few Ballotpedia page names differ from the ones congress-legislators records;
    # for sitting members, fall back to the same state, chamber and last name.
    if !legislator && incumbent == 1
      chamber = office == "us_senate" ? "sen" : "rep"
      matches = legislators.select { |l| (t = l["terms"].last)["state"] == state && t["type"] == chamber && t["end"] > "2026-10-01" && name.include?(l.dig("name", "last")) }
      legislator = matches.first if matches.size == 1
    end
    # Members running for the other chamber (a House member running for Senate): same state and full name.
    if !legislator
      matches = legislators.select do |l|
        n = l["name"]
        l["terms"].last["state"] == state && [n["official_full"], "#{n['first']} #{n['last']}", "#{n['nickname']} #{n['last']}"].include?(name)
      end
      if matches.size == 1
        legislator = matches.first
        name_matched << "#{name} (#{state}) = #{legislator.dig('id', 'bioguide')}"
      end
    end
    unmatched_incumbents << "#{name} (#{state})" if incumbent == 1 && !legislator
    bioguide = legislator&.dig("id", "bioguide")
    on_ballot << bioguide if bioguide
    # Ballotpedia's incumbent marker isn't on every page, so incumbency comes from the member's
    # current term: same chamber and state, and the same district unless the state redrew its map.
    if legislator && (t = legislator["terms"].last)["end"] > "2026-10-01"
      same_seat = office == "us_senate" ? t["type"] == "sen" : t["type"] == "rep" && (t["district"] == district || REDRAWN.include?(state))
      incumbent = 1 if t["state"] == state && same_seat
    end
    party = party.to_s.strip
    {
      "name" => name,
      "sort_name" => sort_name(name, legislator),
      "party" => PARTY_CODES[party],
      # Fusion tickets (e.g. "R / Conservative Party") are written out in full.
      "party_name" => (party.split(" / ").map { |p| FULL_PARTY[p] || p }.join(" / ") unless PARTY_CODES.key?(party) || party.empty?),
      "incumbent" => (true if incumbent == 1),
      "bioguide" => bioguide,
      "ballotpedia" => "https://ballotpedia.org#{path}",
      "status" => "not_reviewed",
    }.compact
  end
  abort("no candidates in #{head}") if candidates.empty?
  candidates.first["unopposed"] = true if candidates.size == 1

  note = office == "us_senate" ? SENATE_SPECIALS[state] : nil
  note = [note, STATE_NOTES[state]].compact.join(" ") if STATE_NOTES[state]
  note = LOUISIANA_HOUSE if state == "LA" && office == "us_house"
  note = NOT_ON_BALLOT if not_on_ballot == 1
  races[state] << { "office" => office, "state" => state, "district" => district, "note" => (note unless note.to_s.empty?), "candidates" => candidates }.compact
end

dir = File.join(DATA, "federal")
Dir.mkdir(dir) unless Dir.exist?(dir)
written = 0
races.each do |state, list|
  path = File.join(dir, "#{state.downcase}.yml")
  next if File.exist?(path) && !opts["force"]
  list.sort_by! { |r| [r["office"] == "us_senate" ? 0 : 1, r["district"].to_i] }
  File.write(path, "# U.S. Senate and House races in #{STATES.key(state)}. Imported from Ballotpedia by\n# scripts/import_federal.rb, then edited by hand: see README \"Editing the data\".\n" + list.to_yaml.sub(/\A---\n/, ""))
  written += 1
end

# Only keep official records for people on the ballot (California's are matched by bioguide in races.yml).
ca_bioguides = YAML.load_file(File.join(DATA, "races.yml")).flat_map { |r| r["candidates"].filter_map { |c| c["bioguide"] } }
kept = votes.select { |id, _| on_ballot.include?(id) || ca_bioguides.include?(id) }
File.write(File.join(DATA, "federal_votes.yml"), "# Generated by scripts/import_federal.rb from House Clerk and Senate roll calls and\n# GovInfo bill status files. Don't edit by hand: re-run the script.\n" + kept.sort.to_h.to_yaml.sub(/\A---\n/, ""))

puts "#{races.values.sum(&:size)} races in #{races.size} states (#{written} files written), #{kept.size} candidates with official records"
puts "Matched by name and state (check these): #{name_matched.join(', ')}" if name_matched.any?
puts "Incumbents with no Bioguide match: #{unmatched_incumbents.join(', ')}" if unmatched_incumbents.any?
