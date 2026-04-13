#!/usr/bin/env python3
"""
Merge all data sources into one holdings dataset.
Priority: SEC EDGAR (authoritative) > HKEX > Eastmoney QFII > Mock

The merged output is used by the frontend via src/data/realData.ts
"""

import json
import os
from datetime import datetime

# Institution name mapping: display name → ID (matches mockData.ts)
INSTITUTION_ID_MAP = {
    "TCI Fund Management": 1,
    "Bridgewater Associates": 2,
    "Goldman Sachs Group": 3,
    "Goldman Sachs": 3,
    "JPMorgan Chase": 4,
    "BlackRock": 5,
    "Fidelity Investments": 6,
    "Neuberger Berman": 7,
    "AllianceBernstein": 8,
    "ADIA (Abu Dhabi IA)": 9,
    "Abu Dhabi IA": 9,
    "KIA (Kuwait IA)": 10,
    "Kuwait IA": 10,
}

# CIK → institution ID
CIK_TO_ID = {
    "0001786255": 1,   # TCI
    "0001360868": 2,    # Bridgewater
    "0000886982": 3,    # Goldman
    "0000019617": 4,    # JPMorgan
    "0001364742": 5,    # BlackRock
    "0000711642": 6,    # Fidelity
    "0000032023": 7,    # Neuberger
    "0001101982": 8,    # AllianceBernstein
    "0001623440": 9,    # ADIA
    "0001474042": 10,   # KIA
}

# Ticker → sector mapping
SECTOR_MAP = {
    "AAPL": "科技", "MSFT": "科技", "GOOGL": "科技", "GOOG": "科技",
    "AMZN": "消费", "META": "科技", "NVDA": "科技", "TSLA": "新能源",
    "JPM": "金融", "GS": "金融", "V": "金融", "MA": "金融",
    "JNJ": "医疗", "UNH": "医疗", "PFE": "医疗", "LLY": "医疗",
    "XOM": "能源", "CVX": "能源", "COP": "能源",
    "BRK.B": "金融", "BRK-A": "金融",
    "KO": "消费", "PG": "消费", "PEP": "消费",
    "0700.HK": "科技", "9988.HK": "消费", "9618.HK": "消费",
    "3690.HK": "消费", "1810.HK": "科技", "09624.HK": "科技",
    "600519.SH": "消费", "600036.SH": "金融", "601318.SH": "金融",
    "000858.SZ": "消费", "000333.SZ": "消费", "002415.SZ": "科技",
    "600030.SH": "金融", "300750.SZ": "新能源", "002594.SZ": "新能源",
    "601888.SH": "消费", "600009.SH": "消费",
    "601166.SH": "金融", "600028.SH": "能源",
    "000858": "消费",
}


def merge_sec_edgar() -> dict:
    """Load and merge SEC EDGAR 13F data."""
    holdings = {}
    try:
        with open("data/holdings_latest.json") as f:
            sec_data = json.load(f)

        holding_id = 1000
        for inst_name, inst_data in sec_data.items():
            inst_id = INSTITUTION_ID_MAP.get(inst_name, 0)
            quarter = inst_data.get("quarter", "2025Q4")
            filed_at = inst_data.get("filedAt", "")

            for h in inst_data.get("holdings", []):
                ticker = h.get("ticker", "N/A")
                if not ticker or ticker == "N/A":
                    ticker = h.get("cusip", "N/A")

                # Skip zero-value holdings
                if h.get("market_value", 0) <= 0 and h.get("shares", 0) <= 0:
                    continue

                key = f"{inst_id}_{ticker}"
                if key in holdings:
                    # Update if newer
                    existing_mv = holdings[key]["marketValue"]
                    if h.get("market_value", 0) > existing_mv:
                        holdings[key]["marketValue"] = h.get("market_value", 0)
                        holdings[key]["shares"] = h.get("shares", 0)
                    continue

                sector = SECTOR_MAP.get(str(ticker).upper(), "其他")
                holdings[key] = {
                    "id": holding_id,
                    "institutionId": inst_id,
                    "stockTicker": str(ticker).upper(),
                    "stockName": h.get("name", ticker),
                    "sector": sector,
                    "shares": h.get("shares", 0),
                    "marketValue": h.get("market_value", 0),
                    "ownershipPercent": round(h.get("market_value", 0) / 1e9, 4),  # placeholder
                    "market": "US",
                    "quarter": quarter,
                    "filedAt": filed_at,
                    "dataSource": "SEC_EDGAR",
                    "changeShares": 0,
                    "changePercent": 0,
                }
                holding_id += 1

        print(f"[✓] SEC EDGAR: {len(holdings)} US holdings from {len(sec_data)} institutions")
    except FileNotFoundError:
        print("[!] data/holdings_latest.json not found — skipping SEC EDGAR")
    except Exception as e:
        print(f"[!] SEC EDGAR merge error: {e}")

    return holdings


def merge_hk_holdings(existing: dict) -> dict:
    """Merge HKEX / HK stock holdings."""
    try:
        with open("data/hk_holdings.json") as f:
            hk_data = json.load(f)

        holding_id = 2000
        for h in hk_data:
            ticker = h.get("ticker", "")
            key = f"HK_{ticker}"
            if key in existing:
                continue  # Don't override

            inst_name = h.get("institution", "")
            inst_id = INSTITUTION_ID_MAP.get(inst_name, 0)

            existing[key] = {
                "id": holding_id,
                "institutionId": inst_id,
                "stockTicker": ticker,
                "stockName": h.get("stockName", ticker),
                "sector": SECTOR_MAP.get(ticker, "其他"),
                "shares": h.get("shares", 0),
                "marketValue": h.get("marketValue", 0),
                "ownershipPercent": h.get("ownershipPercent", 0),
                "market": "HK",
                "quarter": h.get("quarter", "2025Q4"),
                "dataSource": "HKEX_MOCK",
                "changeShares": 0,
                "changePercent": 0,
            }
            holding_id += 1

        print(f"[✓] HKEX: +{len(hk_data)} HK holdings")
    except FileNotFoundError:
        print("[!] data/hk_holdings.json not found — skipping HKEX")
    except Exception as e:
        print(f"[!] HKEX merge error: {e}")

    return existing


def merge_qfii_holdings(existing: dict) -> dict:
    """Merge QFII A-share holdings from Eastmoney."""
    try:
        with open("data/qfii_holdings.json") as f:
            qfii_data = json.load(f)

        holding_id = 3000
        for h in qfii_data:
            ticker = h.get("ticker", "")
            key = f"CN_{ticker}"
            if key in existing:
                continue

            inst_name = h.get("institution", "")
            inst_id = INSTITUTION_ID_MAP.get(inst_name, 0)

            existing[key] = {
                "id": holding_id,
                "institutionId": inst_id,
                "stockTicker": ticker,
                "stockName": h.get("stockName", ""),
                "sector": SECTOR_MAP.get(h.get("tickerRaw", ""), "其他"),
                "shares": h.get("shares", 0),
                "marketValue": h.get("marketValue", 0),
                "ownershipPercent": h.get("ownershipPercent", 0),
                "market": "CN",
                "quarter": h.get("quarter", "2025Q4"),
                "dataSource": "EASTMONEY_QFII",
                "changeShares": 0,
                "changePercent": 0,
            }
            holding_id += 1

        print(f"[✓] QFII: +{len(qfii_data)} CN A-share holdings")
    except FileNotFoundError:
        print("[!] data/qfii_holdings.json not found — skipping QFII")
    except Exception as e:
        print(f"[!] QFII merge error: {e}")

    return existing


def build_changes(holdings: dict) -> list[dict]:
    """Build holdingChanges list from merged holdings."""
    changes = []
    for h in holdings.values():
        if h.get("changePercent", 0) == 0:
            continue
        change_type = "increase" if h["changePercent"] > 0 else "decrease"
        changes.append({
            "id": h["id"],
            "institutionId": h["institutionId"],
            "stockTicker": h["stockTicker"],
            "stockName": h["stockName"],
            "changeType": change_type,
            "changePercent": h["changePercent"],
            "previousShares": h.get("previousShares", 0),
            "currentShares": h["shares"],
            "quarter": h["quarter"],
        })
    return changes


def main():
    print("=" * 60)
    print("  Smart Money — Data Merge Pipeline")
    print("=" * 60)

    os.makedirs("data", exist_ok=True)

    holdings = {}
    holdings = merge_sec_edgar()
    holdings = merge_hk_holdings(holdings)
    holdings = merge_qfii_holdings(holdings)

    # Build changes
    changes = build_changes(holdings)

    # Build metadata
    meta = {
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "totalHoldings": len(holdings),
        "usHoldings": sum(1 for h in holdings.values() if h["market"] == "US"),
        "hkHoldings": sum(1 for h in holdings.values() if h["market"] == "HK"),
        "cnHoldings": sum(1 for h in holdings.values() if h["market"] == "CN"),
        "dataSources": list(set(h.get("dataSource", "UNKNOWN") for h in holdings.values())),
        "quarter": "2025Q4",
    }

    output = {
        "meta": meta,
        "holdings": list(holdings.values()),
        "changes": changes,
    }

    with open("data/merged_holdings.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n[DONE] Merged {len(holdings)} total holdings → data/merged_holdings.json")
    print(f"       US: {meta['usHoldings']} | HK: {meta['hkHoldings']} | CN: {meta['cnHoldings']}")
    print(f"       Sources: {', '.join(meta['dataSources'])}")


if __name__ == "__main__":
    main()
