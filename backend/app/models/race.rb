class Race < ApplicationRecord
  has_many :candidates, -> { order(:sort_name) }, dependent: :destroy

  # office => [label, category, slug prefix]
  OFFICES = {
    "governor"               => ["Governor", "statewide", "governor"],
    "lieutenant_governor"    => ["Lieutenant Governor", "statewide", "lieutenant-governor"],
    "secretary_of_state"     => ["Secretary of State", "statewide", "secretary-of-state"],
    "controller"             => ["Controller", "statewide", "controller"],
    "treasurer"              => ["Treasurer", "statewide", "treasurer"],
    "attorney_general"       => ["Attorney General", "statewide", "attorney-general"],
    "insurance_commissioner" => ["Insurance Commissioner", "statewide", "insurance-commissioner"],
    "superintendent"         => ["Superintendent of Public Instruction", "statewide", "superintendent"],
    "board_of_equalization"  => ["Board of Equalization", "board_of_equalization", "boe"],
    "us_house"               => ["U.S. House", "us_house", "us-house"],
    "state_senate"           => ["State Senate", "state_senate", "state-senate"],
    "state_assembly"         => ["State Assembly", "state_assembly", "assembly"],
  }.freeze

  validates :slug, :office, presence: true
  validates :office, inclusion: { in: OFFICES.keys }
  validates :slug, uniqueness: true

  default_scope { order(:sort_order) }

  def self.slug_for(office, district)
    [OFFICES.fetch(office)[2], district].compact.join("-")
  end

  def office_label = OFFICES.fetch(office)[0]
  def category     = OFFICES.fetch(office)[1]

  def title
    district ? "#{office_label}, District #{district}" : office_label
  end

  def as_json(*)
    slice(:slug, :office, :district, :note).merge(
      "office_label" => office_label,
      "category" => category,
      "title" => title,
      "candidates" => candidates.map(&:as_json),
    )
  end
end
