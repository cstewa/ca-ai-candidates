class Candidate < ApplicationRecord
  belongs_to :race
  has_many :positions, dependent: :destroy
  has_many :record_items, -> { order(:sort_order) }, dependent: :destroy

  PARTIES = {
    "D" => "Democratic", "R" => "Republican", "NPP" => "No party preference",
    "L" => "Libertarian", "G" => "Green", "P&F" => "Peace and Freedom",
  }.freeze

  # Describes how much of a public record exists, not whether it is good or bad.
  STATUSES = %w[on_record ai_other none_found].freeze

  validates :name, :slug, :sort_name, presence: true
  validates :slug, uniqueness: true
  validates :party, inclusion: { in: PARTIES.keys }, allow_nil: true
  validates :status, inclusion: { in: STATUSES }

  def party_label = PARTIES[party]

  def as_json(*)
    slice(:slug, :name, :party, :incumbent, :incumbent_note, :unopposed, :status, :search_note).merge(
      "party_label" => party_label,
      "positions" => positions.sort_by { |p| p.yardstick.sort_order }.map(&:as_json),
      "items" => record_items.map(&:as_json),
    )
  end
end
