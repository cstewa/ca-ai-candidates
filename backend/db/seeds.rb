# db/seeds.rb
#
# db/data/*.yml is the source of truth. Seeding replaces every row with the
# YAML contents, so it is safe to run on every deploy.
require "yaml"

data_dir = Rails.root.join("db", "data")
yardsticks = YAML.load_file(data_dir.join("yardsticks.yml"))
races      = YAML.load_file(data_dir.join("races.yml"))

puts "Seeding database..."

ActiveRecord::Base.transaction do
  [RecordItem, Position, Candidate, Race, Yardstick].each(&:delete_all)

  yardsticks.each_with_index { |y, i| Yardstick.create!(y.merge("sort_order" => i)) }
  by_key = Yardstick.all.index_by(&:key)

  office_order = Race::OFFICES.keys
  used_slugs = Set.new

  races.each do |r|
    race = Race.create!(
      office: r["office"],
      district: r["district"],
      note: r["note"],
      slug: Race.slug_for(r["office"], r["district"]),
      sort_order: office_order.index(r["office"]) * 1000 + r["district"].to_i,
    )

    r["candidates"].each do |c|
      slug = c["name"].parameterize
      slug = "#{slug}-#{race.slug}" if used_slugs.include?(slug)
      used_slugs << slug

      candidate = race.candidates.create!(
        c.slice("name", "sort_name", "party", "incumbent_note", "status", "search_note").merge(
          "slug" => slug,
          "incumbent" => !!c["incumbent"],
          "unopposed" => !!c["unopposed"],
        )
      )
      (c["positions"] || []).each do |p|
        candidate.positions.create!(yardstick: by_key.fetch(p["yardstick"]), value: p["position"], detail: p["detail"])
      end
      (c["items"] || []).each_with_index do |item, i|
        candidate.record_items.create!(body: item["text"], kind: item["kind"] || "record", sort_order: i)
      end
    end
  end
end

puts "Seeded #{Yardstick.count} yardsticks, #{Race.count} races, #{Candidate.count} candidates."
