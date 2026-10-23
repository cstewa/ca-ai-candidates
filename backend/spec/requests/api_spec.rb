require "rails_helper"

RSpec.describe "API", type: :request do
  it "lists every race with candidates" do
    get "/api/v1/races"
    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body.size).to eq(171)
    expect(body.first["slug"]).to eq("governor")
    expect(body.first["candidates"].map { |c| c["name"] }).to eq(["Xavier Becerra", "Steve Hilton"])
  end

  it "shows one race with positions and items" do
    get "/api/v1/races/us-house-11"
    wiener = response.parsed_body["candidates"].find { |c| c["name"] == "Scott Wiener" }
    expect(wiener["positions"].map { |p| [p["yardstick"], p["value"]] }).to eq([["sb1047", "author"], ["sb53", "author"], ["sb813", "yes"]])
    expect(wiener["items"]).not_to be_empty
  end

  it "shows a candidate with their race" do
    get "/api/v1/candidates/rebecca-bauer-kahan"
    expect(response.parsed_body.dig("race", "slug")).to eq("assembly-16")
  end

  it "returns 404 for unknown slugs" do
    get "/api/v1/races/nope"
    expect(response).to have_http_status(:not_found)
    get "/api/v1/candidates/nope"
    expect(response).to have_http_status(:not_found)
  end

  it "lists yardsticks in order" do
    get "/api/v1/yardsticks"
    expect(response.parsed_body.first["key"]).to eq("sb1047")
  end
end
