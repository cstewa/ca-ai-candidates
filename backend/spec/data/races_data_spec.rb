require "rails_helper"

# Guards the hand-edited YAML in db/data against typos.
RSpec.describe "db/data" do
  races      = YAML.load_file(Rails.root.join("db/data/races.yml"))
  yardsticks = YAML.load_file(Rails.root.join("db/data/yardsticks.yml"))
  candidates = races.flat_map { |r| r["candidates"].map { |c| [r, c] } }
  link       = /\]\(https?:\/\//

  it "uses known offices and unique race slugs" do
    expect(races.map { |r| r["office"] } - Race::OFFICES.keys).to be_empty
    slugs = races.map { |r| Race.slug_for(r["office"], r["district"]) }
    expect(slugs.tally.select { |_, n| n > 1 }).to be_empty
  end

  it "has at least one candidate in every race" do
    expect(races.select { |r| r["candidates"].empty? }).to be_empty
  end

  it "uses known parties and statuses" do
    candidates.each do |race, c|
      where = "#{c['name']} (#{race['office']} #{race['district']})"
      expect(Candidate::PARTIES.keys + [nil]).to include(c["party"]), where
      expect(Candidate::STATUSES).to include(c["status"]), where
      expect(c["sort_name"]).to be_present, where
    end
  end

  it "only references yardsticks that exist, with known position values" do
    keys = yardsticks.map { |y| y["key"] }
    candidates.each do |_, c|
      (c["positions"] || []).each do |p|
        expect(keys).to include(p["yardstick"]), c["name"]
        expect(Position::VALUES).to include(p["position"]), c["name"]
      end
    end
  end

  it "cites a source link in every record item" do
    unsourced = candidates.flat_map { |_, c| (c["items"] || []).reject { |i| i["text"] =~ link }.map { |i| "#{c['name']}: #{i['text']}" } }
    expect(unsourced).to be_empty
  end

  it "marks candidates with no record as none_found" do
    candidates.each do |_, c|
      next if c["status"] == "none_found"
      expect(c["positions"].present? || c["items"].present?).to be(true), c["name"]
    end
  end

  it "seeds cleanly" do
    expect { load Rails.root.join("db/seeds.rb") }.to output(/Seeded/).to_stdout
    expect(Candidate.count).to eq(candidates.size)
  end
end
