require "rails_helper"

# Guards the hand-edited YAML in db/data against typos.
RSpec.describe "db/data" do
  let(:guide) { Guide.new }

  it "loads and validates without errors" do
    expect { guide }.not_to raise_error
    ca = guide.races.select { |r| r["state"] == "CA" }
    expect(ca.size).to eq(164)
    expect(ca.sum { |r| r["candidates"].size }).to eq(324)
  end

  it "covers every House seat and every Senate race on the 2026 ballot" do
    expect(guide.races.count { |r| r["office"] == "us_house" }).to eq(435)
    expect(guide.races.count { |r| r["office"] == "us_senate" }).to eq(35)
  end

  it "gives each member of Congress one candidate entry" do
    ids = guide.candidates.filter_map { |c| c["bioguide"] }
    expect(ids.tally.select { |_, n| n > 1 }).to be_empty
  end

  it "only keeps official votes for candidates on the ballot" do
    ids = guide.candidates.filter_map { |c| c["bioguide"] }
    expect(YAML.load_file(Guide::DATA_DIR.join("federal_votes.yml")).keys - ids).to be_empty
  end

  it "keeps California's original race slugs and gives other states their own" do
    expect(guide.race("us-house-11")["title"]).to eq("U.S. House, California District 11")
    expect(guide.race("us-house-de-at-large")["title"]).to eq("U.S. House, Delaware At-large")
    expect(guide.race("us-senate-tx")["title"]).to eq("U.S. Senate, Texas")
  end

  it "cites a source link in every record item" do
    unsourced = guide.candidates.flat_map do |c|
      c["items"].reject { |i| i["body"] =~ /\]\(https?:\/\// }.map { |i| "#{c['name']}: #{i['body']}" }
    end
    expect(unsourced).to be_empty
  end

  it "only marks candidates with something on record as on_record or ai_other" do
    guide.candidates.each do |c|
      next if %w[none_found not_reviewed].include?(c["status"])
      expect(c["positions"].any? || c["items"].any?).to be(true), c["name"]
    end
  end

  it "gives every candidate a unique slug" do
    slugs = guide.candidates.map { |c| c["slug"] }
    expect(slugs.uniq.size).to eq(slugs.size)
  end

  it "lists candidates alphabetically by last name" do
    expect(guide.race("assembly-72")["candidates"].map { |c| c["name"] }).to eq(["Chris Kluwe", "Gracey Van Der Mark"])
  end

  it "gives every record item a type label" do
    kinds = guide.candidates.flat_map { |c| c["items"].map { |i| i["kind"] } }
    expect(kinds - Guide::ITEM_KINDS).to be_empty
  end

  it "rejects bad values" do
    Dir.mktmpdir do |dir|
      dir = Pathname(dir)
      FileUtils.cp(Guide::DATA_DIR.join("yardsticks.yml"), dir)
      races = YAML.load_file(Guide::DATA_DIR.join("races.yml"))
      races.first["candidates"].first["party"] = "Whig"
      File.write(dir.join("races.yml"), races.to_yaml)
      expect { Guide.new(dir) }.to raise_error(Guide::InvalidData, /unknown party "Whig"/)
    end
  end
end
