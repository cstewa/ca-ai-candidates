# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_10_14_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "candidates", force: :cascade do |t|
    t.bigint "race_id", null: false
    t.string "slug", null: false
    t.string "name", null: false
    t.string "sort_name", null: false
    t.string "party"
    t.boolean "incumbent", default: false
    t.string "incumbent_note"
    t.boolean "unopposed", default: false
    t.string "status", null: false
    t.text "search_note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["race_id"], name: "index_candidates_on_race_id"
    t.index ["slug"], name: "index_candidates_on_slug", unique: true
  end

  create_table "positions", force: :cascade do |t|
    t.bigint "candidate_id", null: false
    t.bigint "yardstick_id", null: false
    t.string "value", null: false
    t.string "detail"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["candidate_id", "yardstick_id"], name: "index_positions_on_candidate_id_and_yardstick_id", unique: true
    t.index ["candidate_id"], name: "index_positions_on_candidate_id"
    t.index ["yardstick_id"], name: "index_positions_on_yardstick_id"
  end

  create_table "races", force: :cascade do |t|
    t.string "slug", null: false
    t.string "office", null: false
    t.integer "district"
    t.string "note"
    t.integer "sort_order", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_races_on_slug", unique: true
  end

  create_table "record_items", force: :cascade do |t|
    t.bigint "candidate_id", null: false
    t.text "body", null: false
    t.string "kind", default: "record"
    t.integer "sort_order", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["candidate_id"], name: "index_record_items_on_candidate_id"
  end

  create_table "yardsticks", force: :cascade do |t|
    t.string "key", null: false
    t.string "name", null: false
    t.string "short_name"
    t.string "full_title"
    t.string "sponsors"
    t.string "year"
    t.string "level"
    t.string "kind"
    t.text "what_it_does"
    t.text "why_it_matters"
    t.text "outcome"
    t.text "caveat"
    t.string "url"
    t.integer "sort_order", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_yardsticks_on_key", unique: true
  end

  add_foreign_key "candidates", "races"
  add_foreign_key "positions", "candidates"
  add_foreign_key "positions", "yardsticks"
  add_foreign_key "record_items", "candidates"
end
