#!/usr/bin/env python3
"""Build backend/db/data/zip_lookup.json: for each U.S. ZIP code, the share of
its residents in each congressional district used on Nov. 3, 2026, plus
California's State Senate, Assembly and Board of Equalization districts.

ZIP codes don't follow district lines, so a ZIP lists every district it
touches, with the share of the ZIP in each. Three sources, by state:

  California      carried over from the California-only lookup, which was built
                  from 2020 census blocks weighted by population (Prop 50 map).
  The 8 other     AL, FL, LA, NC, OH, TN, TX, UT redrew their maps for 2026. Each
  redrawn states  census tract's population is split among districts by its blocks
                  (120th Congress block file, 2020 population), then each ZIP takes
                  its share of every tract it overlaps, by land area.
  Everyone else   maps unchanged since 2024, so the Census ZIP-to-district file for
                  the 119th Congress is used, weighted by land area. (Missouri is
                  here too: its new map is on hold, so the 2024 map is used.)

Inputs (download them first; see README "Rebuilding the ZIP lookup"):
  --ca       the California-only lookup: git show 1cbb604:backend/db/data/zip_lookup.json
  --cd119    tab20_cd11920_zcta520_natl.txt (Census ZCTA-to-119th-district file)
  --cd120    NationalCD120.txt (Census 120th Congress block equivalency file)
  --zcta     tab20_zcta520_tract20_natl.txt (Census 2020 ZCTA-to-tract file)
  --geo-dir  folder holding xxgeo2020.pl (2020 P.L. 94-171 headers) for the 8 redrawn states

Usage:
  python3 scripts/build_zip_lookup.py --ca ... --cd119 ... --cd120 ... --zcta ... \\
      --geo-dir ... --out backend/db/data/zip_lookup.json
"""
import argparse
import csv
import json
import os
from collections import defaultdict

MIN_SHARE = 0.02  # districts with under 2% of a ZIP are dropped as slivers
REDRAWN = {"AL", "FL", "LA", "NC", "OH", "TN", "TX", "UT"}

STATE_FIPS = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE",
    "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA",
    "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
    "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM",
    "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
    "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
    "54": "WV", "55": "WI", "56": "WY",
}
FIPS_OF = {v: k for k, v in STATE_FIPS.items()}


def district(code):
    """Census district code: 00 = at-large (0); 98 = DC's delegate and ZZ = water (both skipped)."""
    return int(code) if code.isdigit() and code != "98" else None


def pipe_rows(path):
    with open(path, encoding="utf-8-sig") as f:
        yield from csv.DictReader(f, delimiter="|")


def shares(counter):
    total = sum(counter.values())
    out = sorted(((k, n / total) for k, n in counter.items() if n), key=lambda kv: -kv[1])
    return [(k, round(s, 3)) for k, s in out if s >= MIN_SHARE] or [(out[0][0], round(out[0][1], 3))]


def from_cd119(path):
    """ZIP -> {(state, district): land area} for states whose maps didn't change,
    and ZIP -> {state: land area} for every state (to place the redrawn states' shares)."""
    weights = defaultdict(lambda: defaultdict(int))
    state_area = defaultdict(lambda: defaultdict(int))
    for r in pipe_rows(path):
        geoid, zcta = r["GEOID_CD119_20"], r["GEOID_ZCTA5_20"]
        st = STATE_FIPS.get(geoid[:2])
        if not zcta or not st:
            continue
        area = int(r["AREALAND_PART"] or 0)
        state_area[zcta][st] += area
        d = district(geoid[2:])
        if st not in REDRAWN and st != "CA" and d is not None:
            weights[zcta][(st, d)] += area
    return weights, state_area


def from_tracts(cd120_path, zcta_path, geo_dir):
    """ZIP -> {(state, district): estimated residents}, for the redrawn states."""
    wanted = {FIPS_OF[s] for s in REDRAWN}
    pop = {}
    for st in REDRAWN:
        with open(os.path.join(geo_dir, f"{st.lower()}geo2020.pl"), encoding="latin-1") as f:
            for line in f:
                fields = line.rstrip("\n").split("|")
                if fields[2] == "750":  # summary level 750 = census block
                    pop[fields[9]] = int(fields[90])  # GEOID, POP100
    # Each tract's residents by district (a block's first 11 digits are its tract).
    tract_cd = defaultdict(lambda: defaultdict(int))
    with open(cd120_path, newline="") as f:
        for r in csv.DictReader(f):
            block = r["GEOID"]
            if block[:2] in wanted and district(r["CDFP"]) is not None and pop.get(block):
                tract_cd[block[:11]][(STATE_FIPS[block[:2]], district(r["CDFP"]))] += pop[block]
    weights = defaultdict(lambda: defaultdict(float))
    for r in pipe_rows(zcta_path):
        tract, zcta = r["GEOID_TRACT_20"], r["GEOID_ZCTA5_20"]
        if not zcta or tract not in tract_cd:
            continue
        part = int(r["AREALAND_PART"] or 0) / max(int(r["AREALAND_TRACT_20"] or 0), 1)
        for key, n in tract_cd[tract].items():
            weights[zcta][key] += n * part
    return weights


def main():
    ap = argparse.ArgumentParser()
    for name in ["ca", "cd119", "cd120", "zcta", "geo-dir", "out"]:
        ap.add_argument(f"--{name}", required=True)
    args = ap.parse_args()

    with open(args.ca) as f:
        ca = json.load(f)["zips"]
    weights, state_area = from_cd119(args.cd119)
    blocks = from_tracts(args.cd120, args.zcta, args.geo_dir)
    # Within a redrawn state, a ZIP splits by population. A few ZIPs cross a state line, so each
    # state's part is scaled to its land area in the ZIP, the unit the other states use.
    for zcta, w in blocks.items():
        for st in {s for s, _ in w}:
            in_state = {k: n for k, n in w.items() if k[0] == st}
            total = sum(in_state.values())
            area = state_area[zcta][st] or 1
            for key, n in in_state.items():
                weights[zcta][key] += area * n / total

    lookup = {}
    for zcta, entry in ca.items():
        lookup[zcta] = {"pop": entry["pop"], "st": "CA", "cd": [["CA", d, s] for d, s in entry["cd"]],
                        "sd": entry["sd"], "ad": entry["ad"], "boe": entry["boe"]}
    for zcta in sorted(weights):
        if zcta in lookup or not sum(weights[zcta].values()):
            continue
        cds = shares(weights[zcta])
        lookup[zcta] = {"st": cds[0][0][0], "cd": [[st, d, s] for (st, d), s in cds]}

    meta = {
        "description": "Share of each U.S. ZIP code in each congressional district used in 2026, and in California's state districts. Built by scripts/build_zip_lookup.py.",
        "min_share": MIN_SHARE,
        "zip_count": len(lookup),
    }
    with open(args.out, "w") as f:
        json.dump({"meta": meta, "zips": dict(sorted(lookup.items()))}, f, separators=(",", ":"))
    by_state = defaultdict(int)
    for e in lookup.values():
        by_state[e["st"]] += 1
    print(f"{len(lookup)} ZIP codes; states: {dict(sorted(by_state.items()))}")


if __name__ == "__main__":
    main()
