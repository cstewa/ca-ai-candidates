class Yardstick < ApplicationRecord
  has_many :positions, dependent: :destroy

  LEVELS = %w[state federal].freeze
  KINDS  = %w[bill letter vote].freeze

  validates :key, :name, presence: true
  validates :key, uniqueness: true
  validates :level, inclusion: { in: LEVELS }
  validates :kind,  inclusion: { in: KINDS }

  default_scope { order(:sort_order) }

  def as_json(*)
    slice(:key, :name, :short_name, :full_title, :sponsors, :year, :level, :kind,
          :what_it_does, :why_it_matters, :outcome, :caveat, :url)
  end
end
