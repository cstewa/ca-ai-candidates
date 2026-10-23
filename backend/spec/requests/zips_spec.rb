require "rails_helper"

RSpec.describe "ZIP lookup", type: :request do
  it "returns every district for a ZIP inside one district per office" do
    get "/api/v1/zips/94110"
    body = response.parsed_body
    expect(body["districts"]["us_house"]).to eq([{ "district" => 11, "share" => 1.0 }])
    expect(body["districts"]["state_assembly"].first["district"]).to eq(17)
  end

  it "lists split districts largest first" do
    get "/api/v1/zips/90210"
    house = response.parsed_body["districts"]["us_house"].map { |d| d["district"] }
    expect(house).to eq([36, 32])
  end

  it "404s for non-California and malformed ZIPs" do
    get "/api/v1/zips/10001"
    expect(response).to have_http_status(:not_found)
    get "/api/v1/zips/abc"
    expect(response).to have_http_status(:not_found)
  end
end
