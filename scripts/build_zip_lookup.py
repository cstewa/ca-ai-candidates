#!/usr/bin/env python3
"""Build backend/db/data/zip_lookup.json: for each California ZIP code, the share
of its residents living in each district and city.

ZIP codes don't follow district lines, so this works at the census-block level:
every block has one ZIP (ZCTA), one population count, and one district per
office. Summing block populations gives each ZIP's split.

Inputs (download them first; see README "Rebuilding the ZIP lookup"):
  --zcta     California rows of tab20_zcta520_tabblock20_natl.txt, as
             "ZCTA|BLOCK_GEOID|AREALAND_PART" (Census 2020 relationship file)
  --geo      cageo2020.pl from the 2020 P.L. 94-171 file for California
  --cd       CD120_06.txt (Census 120th Congress block file; the Prop 50 map)
  --sd       06_CA_SLDU22.txt (Census 2022 State Senate block file)
  --ad       06_CA_SLDL22.txt (Census 2022 State Assembly block file)
  --boe      "BOE_Final equiv.csv" (2021 Citizens Redistricting Commission)
  --place    BlockAssign_ST06_CA_INCPLACE_CDP.txt (Census 2020 block assignment)

Usage:
  python3 scripts/build_zip_lookup.py --zcta ... --geo ... --cd ... --sd ... \
      --ad ... --boe ... --place ... --out backend/db/data/zip_lookup.json
"""
import argparse
import csv
import json
from collections import defaultdict

MIN_SHARE = 0.02  # districts with under 2% of a ZIP's residents are dropped as slivers


def read_population(path):
    """Block GEOID -> 2020 population, from the P.L. 94-171 geographic header."""
    pop = {}
    with open(path, encoding="latin-1") as f:
        for line in f:
            fields = line.rstrip("\n").split("|")
            if fields[2] == "750":  # summary level 750 = census block
                pop[fields[9]] = int(fields[90])  # GEOID, POP100
    return pop


def read_census_bef(path):
    """Census block equivalency file: header row, then GEOID,...,district (last column)."""
    with open(path, newline="") as f:
        rows = csv.reader(f)
        next(rows)
        return {r[0]: int(r[-1]) for r in rows if r[-1].strip().isdigit()}


def read_crc_bef(path):
    """Commission equivalency file: no header, "GEOID","district"."""
    with open(path, newline="") as f:
        return {r[0]: int(r[1]) for r in csv.reader(f) if r and r[1].strip().isdigit()}


def read_places(path):
    with open(path) as f:
        next(f)
        return {b: p for b, p in (line.rstrip("\n").split("|") for line in f) if p and p != "99999"}


def shares(counter, total):
    out = sorted(((k, n / total) for k, n in counter.items() if n), key=lambda kv: -kv[1])
    kept = [(k, round(s, 3)) for k, s in out if s >= MIN_SHARE] or [(out[0][0], round(out[0][1], 3))]
    return kept


def main():
    ap = argparse.ArgumentParser()
    for name in ["zcta", "geo", "cd", "sd", "ad", "boe", "place", "out"]:
        ap.add_argument(f"--{name}", required=True)
    args = ap.parse_args()

    pop = read_population(args.geo)
    districts = {
        "cd": read_census_bef(args.cd),
        "sd": read_census_bef(args.sd),
        "ad": read_census_bef(args.ad),
        "boe": read_crc_bef(args.boe),
    }
    places = read_places(args.place)

    # Each block belongs to at most one ZCTA; keep the part with the most land if listed twice.
    block_zip = {}
    best_area = {}
    with open(args.zcta) as f:
        for line in f:
            zcta, block, area = line.rstrip("\n").split("|")
            if not zcta:
                continue
            area = int(area or 0)
            if area >= best_area.get(block, -1):
                block_zip[block], best_area[block] = zcta, area

    totals = defaultdict(int)
    counts = {k: defaultdict(lambda: defaultdict(int)) for k in [*districts, "place"]}
    missing = defaultdict(int)
    for block, zcta in block_zip.items():
        n = pop.get(block, 0)
        if not n:
            continue
        totals[zcta] += n
        for key, table in districts.items():
            d = table.get(block)
            if d is None:
                missing[key] += n
            else:
                counts[key][zcta][d] += n
        if block in places:
            counts["place"][zcta][places[block]] += n

    lookup = {}
    for zcta in sorted(totals):
        total = totals[zcta]
        entry = {"pop": total}
        for key in districts:
            entry[key] = shares(counts[key][zcta], total)
        cities = counts["place"][zcta]
        if cities:
            entry["places"] = [(p, round(n / total, 3)) for p, n in sorted(cities.items(), key=lambda kv: -kv[1]) if n / total >= MIN_SHARE]
        lookup[zcta] = entry

    meta = {
        "description": "Share of each California ZIP code's 2020 residents in each district and city. Built by scripts/build_zip_lookup.py.",
        "min_share": MIN_SHARE,
        "zip_count": len(lookup),
        "population": sum(totals.values()),
    }
    with open(args.out, "w") as f:
        json.dump({"meta": meta, "zips": lookup}, f, separators=(",", ":"))

    print(f"{len(lookup)} ZIP codes, {meta['population']:,} residents covered of {sum(pop.values()):,}")
    for key, n in missing.items():
        print(f"  warning: {n:,} residents in blocks with no {key} district")


if __name__ == "__main__":
    main()
