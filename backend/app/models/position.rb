class Position < ApplicationRecord
  belongs_to :candidate
  belongs_to :yardstick

  VALUES = %w[yes no did_not_vote author coauthor sponsor cosponsor signed].freeze

  validates :value, inclusion: { in: VALUES }
  validates :yardstick_id, uniqueness: { scope: :candidate_id }

  def as_json(*)
    { "yardstick" => yardstick.key, "value" => value, "detail" => detail }
  end
end
