# Which districts and cities a California ZIP code falls in, from
# db/data/zip_lookup.json (built by scripts/build_zip_lookup.py).
#
# A ZIP can straddle district lines, so each office lists every district with
# its share of the ZIP's residents, largest first.
class ZipLookup
  PATH = Rails.root.join("db", "data", "zip_lookup.json")
  OFFICE_KEYS = { "cd" => "us_house", "sd" => "state_senate", "ad" => "state_assembly", "boe" => "board_of_equalization" }.freeze

  def self.current = @current ||= new

  def initialize(path = PATH)
    @zips = JSON.parse(File.read(path)).fetch("zips")
  end

  # nil when the ZIP isn't a residential California ZIP code.
  def find(zip, guide)
    entry = @zips[zip] or return nil
    city_races = guide.races.select { |r| Guide::CITY_OFFICES.include?(r["office"]) }.group_by { |r| r["place_fips"] }

    {
      "zip" => zip,
      "population" => entry["pop"],
      "districts" => OFFICE_KEYS.to_h do |key, office|
        [office, entry[key].map { |district, share| { "district" => district, "share" => share } }]
      end,
      # Covered cities the ZIP overlaps, each with its citywide races (mayor, council).
      "cities" => (entry["places"] || []).filter_map do |fips, share|
        races = city_races[fips] or next
        { "city" => races.first["city"], "slug" => races.first["city"].parameterize, "share" => share, "races" => races.map { |r| r["slug"] } }
      end,
    }
  end
end
