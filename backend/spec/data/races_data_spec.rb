require "rails_helper"

# Guards the hand-edited YAML in db/data against typos.
RSpec.describe "db/data" do
  let(:guide) { Guide.new }

  it "loads and validates without errors" do
    expect { guide }.not_to raise_error
    expect(guide.races.size).to eq(171)
    expect(guide.candidates.size).to eq(352)
  end

  it "cites a source link in every record item" do
    unsourced = guide.candidates.flat_map do |c|
      c["items"].reject { |i| i["body"] =~ /\]\(https?:\/\// }.map { |i| "#{c['name']}: #{i['body']}" }
    end
    expect(unsourced).to be_empty
  end

  it "only marks candidates with something on record as on_record or ai_other" do
    guide.candidates.each do |c|
      next if c["status"] == "none_found"
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

  it "ties each mayor race to a city that the ZIP lookup knows" do
    places = JSON.parse(File.read(ZipLookup::PATH))["zips"].values.flat_map { |z| (z["places"] || []).map(&:first) }.uniq
    guide.races.select { |r| Guide::CITY_OFFICES.include?(r["office"]) }.each do |r|
      expect(places).to include(r["place_fips"]), r["slug"]
    end
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
