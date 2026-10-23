require "rails_helper"

RSpec.describe "ZIP lookup", type: :request do
  it "returns California's federal and state districts" do
    get "/api/v1/zips/94110"
    body = response.parsed_body
    expect(body["state"]).to eq("CA")
    expect(body["districts"]["us_house"]).to eq([{ "state" => "CA", "district" => 11, "share" => 1.0 }])
    expect(body["districts"]["state_assembly"].first["district"]).to eq(17)
  end

  it "lists split districts largest first" do
    get "/api/v1/zips/90210"
    house = response.parsed_body["districts"]["us_house"].map { |d| d["district"] }
    expect(house).to eq([36, 32])
  end

  it "finds congressional districts in other states, with no California districts" do
    get "/api/v1/zips/78701" # Austin, on Texas's 2026 map
    body = response.parsed_body
    expect(body["state"]).to eq("TX")
    expect(body["districts"]["us_house"].map { |d| d["state"] }.uniq).to eq(["TX"])
    expect(body["districts"]["state_assembly"]).to eq([])
  end

  it "uses district 0 for at-large states" do
    get "/api/v1/zips/19901" # Dover, Delaware
    expect(response.parsed_body["districts"]["us_house"]).to eq([{ "state" => "DE", "district" => 0, "share" => 1.0 }])
  end

  it "404s for uncovered and malformed ZIPs" do
    get "/api/v1/zips/20001" # Washington, D.C.
    expect(response).to have_http_status(:not_found)
    get "/api/v1/zips/abc"
    expect(response).to have_http_status(:not_found)
  end
end
