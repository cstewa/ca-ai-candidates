require "rails_helper"

RSpec.describe "ZIP lookup", type: :request do
  it "returns every district for a ZIP inside one district per office" do
    get "/api/v1/zips/94110"
    body = response.parsed_body
    expect(body["districts"]["us_house"]).to eq([{ "district" => 11, "share" => 1.0 }])
    expect(body["districts"]["state_assembly"].first["district"]).to eq(17)
    expect(body["cities"]).to eq([])
  end

  it "lists split districts largest first" do
    get "/api/v1/zips/90210"
    house = response.parsed_body["districts"]["us_house"].map { |d| d["district"] }
    expect(house).to eq([36, 32])
  end

  it "includes mayor races the ZIP overlaps, with the share inside the city" do
    get "/api/v1/zips/90210"
    city = response.parsed_body["cities"].first
    expect(city).to include("race" => "mayor-los-angeles", "city" => "Los Angeles")
    expect(city["share"]).to be_between(0.3, 0.5)
  end

  it "404s for non-California and malformed ZIPs" do
    get "/api/v1/zips/10001"
    expect(response).to have_http_status(:not_found)
    get "/api/v1/zips/abc"
    expect(response).to have_http_status(:not_found)
  end
end
