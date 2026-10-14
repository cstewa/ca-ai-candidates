class CreateAllTables < ActiveRecord::Migration[7.1]
  def change
    # Benchmark bills, votes and letters used to compare candidates
    create_table :yardsticks do |t|
      t.string  :key,            null: false, index: { unique: true }  # sb1047, letter_107, ...
      t.string  :name,           null: false
      t.string  :short_name
      t.string  :full_title
      t.string  :sponsors
      t.string  :year
      t.string  :level                          # state, federal
      t.string  :kind                           # bill, letter, vote
      t.text    :what_it_does
      t.text    :why_it_matters
      t.text    :outcome
      t.text    :caveat
      t.string  :url
      t.integer :sort_order,     default: 0
      t.timestamps
    end

    # One contest on the ballot (an office, plus a district where there is one)
    create_table :races do |t|
      t.string  :slug,           null: false, index: { unique: true }
      t.string  :office,         null: false   # governor, us_house, state_assembly, ...
      t.integer :district
      t.string  :note
      t.integer :sort_order,     default: 0
      t.timestamps
    end

    create_table :candidates do |t|
      t.references :race,        null: false, foreign_key: true
      t.string  :slug,           null: false, index: { unique: true }
      t.string  :name,           null: false
      t.string  :sort_name,      null: false
      t.string  :party                          # D, R, NPP, L, G, P&F; nil for nonpartisan offices
      t.boolean :incumbent,      default: false
      t.string  :incumbent_note
      t.boolean :unopposed,      default: false
      t.string  :status,         null: false   # on_record, ai_other, none_found
      t.text    :search_note                    # e.g. "No public AI statements found."
      t.timestamps
    end

    # A candidate's recorded position on a yardstick
    create_table :positions do |t|
      t.references :candidate,   null: false, foreign_key: true
      t.references :yardstick,   null: false, foreign_key: true
      t.string  :value,          null: false   # yes, no, did_not_vote, author, coauthor, sponsor, cosponsor, signed
      t.string  :detail
      t.timestamps
    end
    add_index :positions, [:candidate_id, :yardstick_id], unique: true

    # Statements, actions and funding notes, with inline [label](url) source links
    create_table :record_items do |t|
      t.references :candidate,   null: false, foreign_key: true
      t.text    :body,           null: false
      t.string  :kind,           default: "record"   # record, funding
      t.integer :sort_order,     default: 0
      t.timestamps
    end
  end
end
