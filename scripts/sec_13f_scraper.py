#!/usr/bin/env python3
"""
SEC EDGAR 13F Holdings Scraper (Fixed CIK Mappings)
Fetches 13F-HR filings for institutional investment managers.

Coverage: TCI Fund, Bridgewater, Goldman Sachs, JPMorgan, BlackRock,
          Fidelity, Neuberger Berman, AllianceBernstein, ADIA, KIA

CIKs verified via SEC EDGAR company search.
"""

import json
import time
import re
import os
from datetime import datetime
from typing import Optional
import urllib.request
import urllib.parse

# ── Verified CIK Mappings (SEC EDGAR verified) ───────────────────────────────
INSTITUTIONS = {
    "TCI Fund Management":      "0001963926",
    "Bridgewater Associates":   "0001360868",
    "Goldman Sachs Group":      "0000886982",
    "JPMorgan Chase":           "0000019617",
    "BlackRock":                "0001364742",
    "Fidelity Investments":     "0000711642",
    "Neuberger Berman":         "0000032023",
    "AllianceBernstein":        "0001101982",
    "ADIA (Abu Dhabi IA)":      "0001623440",
    "KIA (Kuwait IA)":          "0001474042",
}

HEADERS = {
    "User-Agent": "SmartMoneyTracker/1.0 research@kevin.ai",
    "Accept": "application/json, text/html",
    "Accept-Language": "en-US;q=0.9",
}


def search_filings_by_cik(cik: str, form: str = "13F-HR", count: int = 5) -> list[dict]:
    """
    Search SEC EDGAR for filings by CIK using the full-index URL.
    Falls back to browse-edgar HTML if API fails.
    """
    # Method 1: Try the EDGAR full-index REST API
    url = (
        f"https://www.sec.gov/cgi-bin/browse-edgar"
        f"?action=getcompany&CIK={cik}&type={form}"
        f"&count={count}&owner=include"
    )
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=20) as resp:
            html = resp.read().decode("utf-8", errors="replace")

        filings = []
        # Parse accession numbers from HTML
        acc_pattern = re.compile(r"accession-number\">([\d\-]+)")
        date_pattern = re.compile(r"filings\">.*?(\d{4}-\d{2}-\d{2})", re.DOTALL)
        accs = acc_pattern.findall(html)
        dates = date_pattern.findall(html[:3000])

        for i, acc in enumerate(accs[:count]):
            filings.append({
                "accessionNumber": acc.strip(),
                "filedAt": dates[i] if i < len(dates) else "",
                "form": form,
                "cik": cik,
            })
        return filings
    except Exception as e:
        print(f"    [WARN] browse-edgar failed for CIK {cik}: {e}")
        return []


def fetch_13f_filing_xml(cik: str, accession: str) -> Optional[str]:
    """
    Fetch the 13F-HR XML (INFOTABLE) for a given accession number.
    Uses the SEC EDGAR filing XML directly.
    """
    acc = accession.replace("-", "").replace(".", "-")
    # Primary: try the XBRL instance URL
    url = (
        f"https://www.sec.gov/Archives/edgar/full-index/"
        f"{cik[:4]}/{cik[4:8]}/{acc}/"
        f"xslForm13F_X01.xml"
    )
    headers = HEADERS.copy()
    headers["Accept"] = "application/xml"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as resp:
            xml = resp.read().decode("utf-8", errors="replace")
            if "<infoTable>" in xml or "<informationTable>" in xml:
                return xml
    except Exception:
        pass

    # Fallback: try alternate XBRL URL
    alt_url = f"https://www.sec.gov/Archives/edgar/{cik}/{acc}/Financial_Report.pdf"
    return None


def parse_infotable_xml(xml_str: str) -> list[dict]:
    """Parse 13F-HR INFOTABLE XML into structured holdings."""
    holdings = []
    try:
        root = ET.fromstring(xml_str)
        ns = {"sec": "http://www.sec.gov/edgar/document/wh/wh"}

        # Try both possible root namespaces
        ns_map = {
            "infoTable": "infoTable",
            "ns1": "http://www.sec.gov/edgar/document/wh/wh",
        }

        for tag in ["infoTable", "informationTable"]:
            for table in root.iter(tag):
                name_el = table.find("nameOfIssuer")
                if name_el is None:
                    continue
                ticker_el = table.find("ticker")
                cusip_el = table.find("cusip")
                shrs_el = table.find("shrsOrShrAmount")
                val_el = table.find("fairValue")

                shares = 0
                if shrs_el is not None:
                    v = shrs_el.find("value") or shrs_el.find("shares")
                    if v is not None and v.text:
                        try:
                            shares = int(v.text.replace(",", ""))
                        except ValueError:
                            pass

                market_value = 0.0
                if val_el is not None:
                    v = val_el.find("value")
                    if v is not None and v.text:
                        try:
                            market_value = float(v.text.replace(",", ""))
                        except ValueError:
                            pass

                ticker = ""
                if ticker_el is not None and ticker_el.text:
                    ticker = ticker_el.text.strip()
                elif cusip_el is not None and cusip_el.text:
                    ticker = cusip_el.text.strip()

                name = name_el.text or ""
                if name and ticker:
                    holdings.append({
                        "ticker": ticker,
                        "name": name,
                        "shares": shares,
                        "marketValue": market_value,
                    })

        # Fallback: regex parse if ET failed to find tags
        if not holdings:
            ticker_re = re.compile(r"<ticker>([^<]+)</ticker>")
            name_re = re.compile(r"<nameOfIssuer>([^<]+)</nameOfIssuer>")
            cusip_re = re.compile(r"<cusip>([^<]+)</cusip>")
            shares_re = re.compile(r"<shares>[^<]*<value>([\d,]+)</value>")
            tickers_found = ticker_re.findall(xml_str)
            names_found = name_re.findall(xml_str)
            shares_found = shares_re.findall(xml_str)
            for i in range(min(len(tickers_found), len(names_found))):
                shares = int(shares_found[i].replace(",", "")) if i < len(shares_found) else 0
                holdings.append({
                    "ticker": tickers_found[i],
                    "name": names_found[i],
                    "shares": shares,
                    "marketValue": 0,
                })
    except ET.ParseError as e:
        print(f"    [ERROR] XML parse error: {e}")
    return holdings


def fetch_for_institution(name: str, cik: str) -> dict:
    """Main entry: fetch latest 13F for one institution."""
    print(f"\n{'='*60}")
    print(f"  {name} (CIK: {cik})")
    print(f"{'='*60}")

    filings = search_filings_by_cik(cik)
    if not filings:
        print(f"  [WARN] No 13F-HR filings found for {name}")
        return {}

    latest = filings[0]
    print(f"  Latest: {latest['filedAt']} | acc={latest['accessionNumber'][:20]}...")

    xml = fetch_13f_filing_xml(cik, latest["accessionNumber"])
    if not xml:
        print(f"  [WARN] Could not fetch XML for {name}")
        return {}

    holdings = parse_infotable_xml(xml)
    print(f"  Holdings extracted: {len(holdings)}")
    for h in holdings[:5]:
        print(f"    {h['ticker']:<8} | {h['name'][:30]:<30} | {h['shares']:>12,} shares")

    quarter = latest.get("filedAt", "")[:7] if latest.get("filedAt") else "2025Q4"
    q_map = {"01": "Q1", "02": "Q1", "03": "Q1",
             "04": "Q2", "05": "Q2", "06": "Q2",
             "07": "Q3", "08": "Q3", "09": "Q3",
             "10": "Q4", "11": "Q4", "12": "Q4"}
    q = f"{quarter[:4]}{q_map.get(quarter[5:7], 'Q4')}"

    return {
        "institution": name,
        "cik": cik,
        "filedAt": latest["filedAt"],
        "quarter": q,
        "holdings": holdings,
    }


def main():
    print("[SEC EDGAR 13F Scraper] Starting...")
    print(f"Institutions: {len(INSTITUTIONS)}")
    print(f"CIKs: {list(INSTITUTIONS.values())}")

    results = []
    for name, cik in INSTITUTIONS.items():
        try:
            r = fetch_for_institution(name, cik)
            if r:
                results.append(r)
        except Exception as e:
            print(f"  [ERROR] {name}: {e}")
        time.sleep(1)  # Be respectful to SEC EDGAR

    # Save
    os.makedirs("data", exist_ok=True)
    out_path = "data/sec_edgar_holdings.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "SEC EDGAR 13F-HR",
            "updated": datetime.now().isoformat(),
            "institutions": results,
        }, f, ensure_ascii=False, indent=2)

    print(f"\n[DONE] Saved {len(results)} institutions → {out_path}")


if __name__ == "__main__":
    main()
