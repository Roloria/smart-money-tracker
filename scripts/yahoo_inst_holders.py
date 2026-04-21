#!/usr/bin/env python3
"""
Yahoo Finance Institutional Holders Scraper
Fetches top institutional holders for given tickers.
Data source: Yahoo Finance (free, no API key required)
"""
import json
import time
import urllib.request
import urllib.parse

TICKERS = [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "JPM", "GS", "V",
    "JNJ", "UNH", "PFE", "XOM", "KO",
    "00700.HK", "09988.HK", "01810.HK", "03690.HK",
    "600519", "600036", "601318", "300866",
]


def fetch_inst_holders(ticker: str) -> list[dict]:
    """Fetch top institutional holders for a ticker from Yahoo Finance."""
    url = f"https://query2.finance.yahoo.com/v6/finance/insights/{ticker}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        
        holder_data = data.get("instrumentInfo", {}).get("holderSummary", {})
        topHolders = holder_data.get("top Holders", [])
        
        results = []
        for h in topHolders[:10]:  # Top 10 holders
            results.append({
                "name": h.get("holder", {}).get("name", "Unknown"),
                "ticker": ticker,
                "shares": h.get("shares", 0),
                "percent": h.get("holdingsPercent", {}).get("raw", 0),
                "type": h.get("holderType", "Institutional"),
                "date": h.get("date", ""),
            })
        return results
    except Exception as e:
        print(f"  [WARN] Yahoo Finance failed for {ticker}: {e}")
        return []


def fetch_recommendation_trend(ticker: str) -> dict:
    """Fetch analyst recommendations and trend from Yahoo Finance."""
    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=3mo"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        
        res = data.get("chart", {}).get("result", [{}])[0]
        meta = res.get("meta", {})
        return {
            "ticker": ticker,
            "currentPrice": meta.get("regularMarketPrice", 0),
            "targetPrice": meta.get("targetPrice", {}).get("targetMean", 0),
            "recommendation": meta.get("recommendationKey", "none"),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e)}


def main():
    print("[Yahoo Finance Institutional Holders] Starting data collection...")
    print(f"Target tickers: {len(TICKERS)}")
    
    all_holders = []
    all_recommendations = []
    
    for i, ticker in enumerate(TICKERS):
        print(f"  [{i+1}/{len(TICKERS)}] Fetching {ticker}...", end=" ")
        
        holders = fetch_inst_holders(ticker)
        rec = fetch_recommendation_trend(ticker)
        
        if holders:
            print(f"✅ {len(holders)} holders")
            all_holders.extend(holders)
        else:
            print("⚠️  no data")
        
        if "error" not in rec:
            all_recommendations.append(rec)
        
        time.sleep(0.5)  # Rate limiting
    
    # Save holders data
    os.makedirs("data", exist_ok=True)
    with open("data/yahoo_inst_holders.json", "w", encoding="utf-8") as f:
        json.dump({
            "updated": time.strftime("%Y-%m-%d %H:%M:%S"),
            "count": len(all_holders),
            "holders": all_holders,
        }, f, ensure_ascii=False, indent=2)
    print(f"\n[DONE] Saved {len(all_holders)} holder records → data/yahoo_inst_holders.json")
    
    # Save recommendations
    with open("data/yahoo_recommendations.json", "w", encoding="utf-8") as f:
        json.dump({
            "updated": time.strftime("%Y-%m-%d %H:%M:%S"),
            "count": len(all_recommendations),
            "recommendations": all_recommendations,
        }, f, ensure_ascii=False, indent=2)
    print(f"[DONE] Saved {len(all_recommendations)} recommendations → data/yahoo_recommendations.json")


if __name__ == "__main__":
    import os
    main()
