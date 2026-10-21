require "rails_helper"

RSpec.describe "Sign-ups", type: :request do
  let(:sent) { [] }

  before do
    GoogleForm.reset!
    GoogleForm.fetcher = ->(_) { '[246121946,"Email",null,0,[[1127785954,null,1]]],[555,"ZIP code",null,0,[[222333,null,0]]]' }
    GoogleForm.poster = ->(_url, data) { sent << data; "200" }
  end

  after do
    GoogleForm.poster = nil
    GoogleForm.fetcher = nil
    GoogleForm.reset!
  end

  it "forwards the email and ZIP to the Google Form" do
    post "/api/v1/signups", params: { email: "maria@gmail.com", zip: "94110", source: "results" }
    expect(response).to have_http_status(:created)
    expect(sent).to eq([{ "entry.1127785954" => "maria@gmail.com", "entry.222333" => "94110" }])
  end

  it "rejects an invalid email without contacting Google" do
    post "/api/v1/signups", params: { email: "not-an-email" }
    expect(response).to have_http_status(:unprocessable_entity)
    expect(sent).to be_empty
  end

  it "quietly drops bot submissions" do
    post "/api/v1/signups", params: { email: "bot@spam.com", website: "http://spam" }
    expect(response).to have_http_status(:created)
    expect(sent).to be_empty
  end

  it "reports when Google is unavailable" do
    GoogleForm.poster = ->(*) { "500" }
    post "/api/v1/signups", params: { email: "maria@gmail.com" }
    expect(response).to have_http_status(:bad_gateway)
  end
end
