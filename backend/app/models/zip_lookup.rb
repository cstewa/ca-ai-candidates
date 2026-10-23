# Which districts a U.S. ZIP code falls in, from db/data/zip_lookup.json
# (built by scripts/build_zip_lookup.py).
#
# A ZIP can straddle district lines, so each office lists every district with
# its share of the ZIP's residents, largest first. Congressional districts carry
# their state, since a few ZIPs cross state lines. California ZIPs also list
# State Senate, Assembly and Board of Equalization districts.
class ZipLookup
  PATH = Rails.root.join("db", "data", "zip_lookup.json")
  CA_KEYS = { "sd" => "state_senate", "ad" => "state_assembly", "boe" => "board_of_equalization" }.freeze

  def self.current = @current ||= new

  def initialize(path = PATH)
    @zips = JSON.parse(File.read(path)).fetch("zips")
  end

  # nil when the ZIP isn't a residential ZIP code in a covered state.
  def find(zip)
    entry = @zips[zip] or return nil
    return nil unless Guide::STATES.key?(entry["st"])

    districts = { "us_house" => (entry["cd"] || []).map { |state, district, share| { "state" => state, "district" => district, "share" => share } } }
    CA_KEYS.each do |key, office|
      districts[office] = (entry[key] || []).map { |district, share| { "district" => district, "share" => share } }
    end

    { "zip" => zip, "population" => entry["pop"], "state" => entry["st"], "state_name" => Guide::STATES[entry["st"]], "districts" => districts }
  end
end
