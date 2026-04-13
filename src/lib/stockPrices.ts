/**
 * Stock Price Service
 * Fetches real-time stock prices using Yahoo Finance public API.
 * No API key required.
 * 
 * Coverage:
 * - US stocks: AAPL, MSFT, NVDA, etc.
 * - HK stocks: 0700.HK, 9988.HK, etc.
 * - A-shares: 600519.SS, 600036.SS, etc.
 */

export interface StockPrice {
  ticker: string;
  price: number;
  change: number;       // absolute change
  changePercent: number;
  currency: string;
  market: 'US' | 'HK' | 'CN';
  lastUpdated: string;
}

// ── Price fetching ────────────────────────────────────────────────────────────

const YAHOO_CHART = (ticker: string) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;

function parseTickerForYahoo(ticker: string): { yahoo: string; market: 'US' | 'HK' | 'CN'; currency: string } {
  if (ticker.endsWith('.HK')) {
    return { yahoo: ticker, market: 'HK', currency: 'HKD' };
  }
  if (/^\d{6}$/.test(ticker)) {
    // A-share: 600519 → 600519.SS (Shanghai)
    return { yahoo: `${ticker}.SS`, market: 'CN', currency: 'CNY' };
  }
  return { yahoo: ticker, market: 'US', currency: 'USD' };
}

async function fetchYahooPrice(ticker: string): Promise<StockPrice | null> {
  const { yahoo, market, currency } = parseTickerForYahoo(ticker);
  const url = YAHOO_CHART(yahoo);

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmartMoneyTracker/1.0)',
        'Accept': 'application/json',
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const quote = result.indicators?.quote?.[0];
    const meta = result.meta;
    if (!quote || !meta) return null;

    const closes = quote.close;
    if (!closes || closes.length < 2) return null;

    const currentPrice = closes[closes.length - 1];
    const prevPrice = closes[closes.length - 2];
    if (!currentPrice || !prevPrice) return null;

    const change = currentPrice - prevPrice;
    const changePercent = (change / prevPrice) * 100;

    return {
      ticker,
      price: currentPrice,
      change,
      changePercent,
      currency,
      market,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ── Batch price fetcher ──────────────────────────────────────────────────────

// Cache prices for 5 minutes to avoid rate limiting
let _priceCache: Map<string, StockPrice> = new Map();
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getStockPrices(tickers: string[]): Promise<Map<string, StockPrice>> {
  const now = Date.now();
  const cached = now - _cacheTime < CACHE_TTL && _priceCache.size > 0;
  if (cached) return _priceCache;

  const results = new Map<string, StockPrice>();
  const uniqueTickers = [...new Set(tickers)];

  // Fetch in batches of 4 (with 200ms delay to be polite)
  const BATCH = 4;
  const DELAY = 200;

  for (let i = 0; i < uniqueTickers.length; i += BATCH) {
    const batch = uniqueTickers.slice(i, i + BATCH);
    const prices = await Promise.all(batch.map(t => fetchYahooPrice(t)));
    prices.forEach((p, idx) => {
      if (p) results.set(batch[idx], p);
    });
    if (i + BATCH < uniqueTickers.length) {
      await new Promise(r => setTimeout(r, DELAY));
    }
  }

  _priceCache = results;
  _cacheTime = now;
  return results;
}

// ── Estimate cost basis & P&L ──────────────────────────────────────────────────

export interface PositionPnL {
  ticker: string;
  shares: number;
  avgCost?: number;       // if user configured
  currentPrice: number;
  currentValue: number;
  dayChange: number;
  dayChangePercent: number;
  currency: string;
  market: 'US' | 'HK' | 'CN';
  // If no avgCost, we estimate from holdings data
  estimatedCost?: number;
  estimatedPnL?: number;
  estimatedPnLPercent?: number;
}

export function calcPositionPnL(
  ticker: string,
  shares: number,
  marketValue: number,
  prices: Map<string, StockPrice>,
  // Optional cost basis per share
  costPerShare?: number,
): PositionPnL | null {
  const price = prices.get(ticker);
  if (!price) {
    // Fallback: use holdings data as estimate
    return {
      ticker,
      shares,
      currentPrice: marketValue / shares,
      currentValue: marketValue,
      dayChange: 0,
      dayChangePercent: 0,
      currency: 'USD',
      market: 'US',
    };
  }

  const currentValue = price.price * shares;
  const estimatedCost = costPerShare ? costPerShare * shares : undefined;
  const estimatedPnL = estimatedCost ? currentValue - estimatedCost : undefined;
  const estimatedPnLPercent = estimatedPnL && estimatedCost ? (estimatedPnL / estimatedCost) * 100 : undefined;

  return {
    ticker,
    shares,
    avgCost: costPerShare,
    currentPrice: price.price,
    currentValue,
    dayChange: price.change * shares,
    dayChangePercent: price.changePercent,
    currency: price.currency,
    market: price.market,
    estimatedCost,
    estimatedPnL,
    estimatedPnLPercent,
  };
}

// ── Currency conversion rates (fixed, updated periodically) ───────────────────
export const FX_RATES: Record<string, number> = {
  USD_HKD: 7.78,
  USD_CNY: 7.25,
  HKD_CNY: 0.93,
};

export function convertCurrency(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  if (from === 'USD' && to === 'HKD') return amount * FX_RATES.USD_HKD;
  if (from === 'USD' && to === 'CNY') return amount * FX_RATES.USD_CNY;
  if (from === 'HKD' && to === 'USD') return amount / FX_RATES.USD_HKD;
  if (from === 'HKD' && to === 'CNY') return amount * FX_RATES.HKD_CNY;
  if (from === 'CNY' && to === 'USD') return amount / FX_RATES.USD_CNY;
  if (from === 'CNY' && to === 'HKD') return amount / FX_RATES.HKD_CNY;
  return amount;
}
