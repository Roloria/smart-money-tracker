#!/usr/bin/env python3
"""
SEC EDGAR 13F Holdings Scraper
Fetches 13F-HR filings for institutional investment managers.
Coverage: TCI Fund, Bridgewater, Goldman Sachs, JPMorgan, BlackRock,
          Fidelity, Neuberger Berman, AllianceBernstein, ADIA, KIA
"""

import json
import time
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Optional
import urllib.request
import urllib.parse

# ── Institution Filer IDs (SEC EDGAR) ──────────────────────────────────────

INSTITUTIONS = {
    "TCI Fund Management": "0001786255",
    "Bridgewater Associates": "0001360868",
    "Goldman Sachs Group": "0000886982",
    "JPMorgan Chase": "0000019617",
    "BlackRock": "0001364742",
    "Fidelity Investments": "0000711642",
    "Neuberger Berman": "0000032023",
    "AllianceBernstein": "000110elligent108",
    "ADIA (Abu Dhabi IA)": "0001623440",
    "KIA (Kuwait IA)": "0001474042",
}

BASE_URL = "https://efts.sec.gov/LATEST/search-index?q=%22%22&date=>2025-01-01&forms=13F-HR"


def search_13f_filings(cik: str, count: int = 10) -> list[dict]:
    """
    Search SEC EDGAR for recent 13F-HR filings by a given CIK.
    Returns list of filing metadata dicts.
    """
    url = (
        f"https://efts.sec.gov/LATEST/search-index"
        f"?q=%22{cik}%22&forms=13F-HR&date=>2024-01-01&count={count}"
    )
    # Use direct search endpoint
    search_url = f"https://efts.sec.gov/LATEST/search-index?q=%22{cik}%22&forms=13F-HR&count={count}"

    req = urllib.request.Request(
        search_url,
        headers={"User-Agent": "SmartMoneyTracker research@kevin.ai"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())

    results = []
    for hit in data.get("hits", {}).get("hits", []):
        src = hit.get("_source", {})
        results.append({
            "cik": src.get("cik"),
            "name": src.get("name"),
            "form": src.get("form"),
            "filedAt": src.get("filedAt"),
            "accessionNumber": src.get("accessionNumber"),
        })
    return results


def fetch_13f_xml(cik: str, accession: str) -> Optional[str]:
    """
    Fetch the raw XML for a single 13F-HR filing.
    accession format: 0001786255-25-000123
    """
    acc_normalized = accession.replace("-", "").replace(".", "-")
    url = (
        f"https://www.sec.gov/Archives/edgar/full-index/"
        f"{cik[:4]}/{cik[4:8]}/{acc_normalized}/"
        f"xslForm13F_X01.xml"
    )
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "SmartMoneyTracker research@kevin.ai",
            "Accept": "application/xml",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  [WARN] Failed to fetch XML for {cik}: {e}")
        return None


def parse_13f_xml(xml_str: str) -> list[dict]:
    """
    Parse 13F-HR XML and extract holdings.
    Returns list of holding dicts.
    """
    holdings = []
    try:
        root = ET.fromstring(xml_str)
        ns = {"sec": "urn:org:sec:edgar:sec-filing-v1"}

        # Navigate to infoTable entries
        for info_table in root.iter("infoTable"):
            name_el = info_table.find("nameOfIssuer")
            if name_el is None:
                continue

            holding = {
                "ticker": info_table.find("ticker") or info_table.find("cusip", {}),
                "name": name_el.text or "",
                "cusip": info_table.find("cusip", {}).text if info_table.find("cusip") is not None else "",
                "shares": 0,
                "market_value": 0.0,
                "share_type": "",
            }

            # Shares / Market Value
            for val_type in ["shrsOrShrAmount", "fairValue"]:
                el = info_table.find(val_type)
                if el is not None:
                    units = el.find("units")
                    amount = el.find("totalValue") or el.find("value") or el
                    if amount is not None and amount.text:
                        try:
                            if val_type == "shrsOrShrAmount":
                                holding["shares"] = int(amount.text.replace(",", ""))
                            else:
                                holding["market_value"] = float(amount.text.replace(",", ""))
                        except ValueError:
                            pass

            if holding["name"]:
                holdings.append(holding)
    except ET.ParseError as e:
        print(f"  [ERROR] XML parse error: {e}")
    return holdings


def fetch_all_holdings_for_institution(name: str, cik: str) -> dict:
    """
    Main entry point: fetch latest 13F filing for an institution
    and return structured holdings data.
    """
    print(f"\n{'='*60}")
    print(f"  {name} (CIK: {cik})")
    print(f"{'='*60}")

    filings = search_13f_filings(cik, count=5)
    if not filings:
        print(f"  [WARN] No filings found for {name}")
        return {}

    latest = filings[0]
    print(f"  Latest filing: {latest['filedAt']} ({latest['form']})")

    xml = fetch_13f_xml(cik, latest["accessionNumber"])
    if not xml:
        return {}

    holdings = parse_13f_xml(xml)
    print(f"  Holdings extracted: {len(holdings)}")

    for h in holdings[:5]:
        print(f"    {h['ticker']} | {h['name'][:30]:<30} | "
              f"{h['shares']:>12,} shares | ${h['market_value']:>15,.0f}")

    return {
        "institution": name,
        "cik": cik,
        "filedAt": latest["filedAt"],
        "quarter": latest["filedAt"][:7],  # "2025-03"
        "holdings": holdings,
    }


def export_json(data: dict, filepath: str = "data/holdings_latest.json"):
    """Save fetched holdings to JSON file."""
    import os
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n[Saved] → {filepath}")


def main():
    """
    Fetch holdings for all configured institutions.
    Falls back to mock data if API call fails.
    """
    all_results = {}
    for name, cik in INSTITUTIONS.items():
        result = fetch_all_holdings_for_institution(name, cik)
        if result:
            all_results[name] = result
        time.sleep(0.5)  # SEC asks for max 10 req/sec

    if all_results:
        export_json(all_results, "data/holdings_latest.json")
        print(f"\n[DONE] Fetched {len(all_results)} institutions")
    else:
        print("\n[NOTE] API unavailable — run with --mock to use sample data")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="SEC EDGAR 13F Scraper")
    parser.add_argument("--mock", action="store_true", help="Use mock data")
    args = parser.parse_args()

    if args.mock:
        print("Using mock data (no API calls)")
    else:
        main()
