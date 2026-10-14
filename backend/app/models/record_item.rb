class RecordItem < ApplicationRecord
  belongs_to :candidate

  KINDS = %w[record funding].freeze

  validates :body, presence: true
  validates :kind, inclusion: { in: KINDS }

  def as_json(*)
    { "body" => body, "kind" => kind }
  end
end
