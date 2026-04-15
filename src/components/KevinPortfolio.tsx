/**
 * KevinPortfolio — Kevin 真实持仓追踪
 * 显示 Kevin 个人持仓与聪明钱机构持仓的对比分析
 * 数据来源：MEMORY.md Investment Portfolio（2026-03-18）
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Loader2 } from 'lucide-react';

interface PriceData {
  price: number;
  change: number;
  changePct: number;
  currency: string;
  market: 'CN' | 'HK' | 'US';
  loading: boolean;
  error?: string;
}

interface Holding {
  ticker: string;
  name: string;
  market: 'CN' | 'HK';
  shares: number | null;
  cost: number | null;    // CNY per share
  sector: string;
  allocation: number;     // fraction of invested capital (total = 70% of 60万)
}

const C = {
  card: '#141414', border: '#1e1e1e',
  text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  blue: '#38bdf8', green: '#22c55e', red: '#ef4444',
  yellow: '#f59e0b', purple: '#a78bfa',
};

const TOTAL_CAPITAL = 600000;   // 60万总资金
const INVESTED_RATIO = 0.70;    // 70%仓位
const INVESTED_CAPITAL = TOTAL_CAPITAL * INVESTED_RATIO; // 42万

// Kevin 真实持仓（来源：MEMORY.md Investment Portfolio）
// 分配：安克创新40%·乖宝宠物10%·东芯股份10%·阿里巴巴5%·小米5%·世纪华通5% = 75% ≈ 70%
const KEVIN_HOLDINGS: Holding[] = [
  { ticker: '300866', name: '安克创新', market: 'CN', shares: 800,  cost: 116.25, sector: '消费电子/出海',  allocation: 0.40 },
  { ticker: '301498', name: '乖宝宠物', market: 'CN', shares: null, cost: null,  sector: '宠物经济',       allocation: 0.10 },
  { ticker: '688110', name: '东芯股份', market: 'CN', shares: null, cost: null,  sector: 'AI存储芯片',     allocation: 0.10 },
  { ticker: '9988.HK', name: '阿里巴巴', market: 'HK', shares: null, cost: null,  sector: '电商/AI',        allocation: 0.05 },
  { ticker: '1810.HK', name: '小米集团',  market: 'HK', shares: null, cost: null,  sector: 'AI硬件',        allocation: 0.05 },
  { ticker: '002602', name: '世纪华通', market: 'CN', shares: null, cost: null,  sector: '游戏/AI算力',   allocation: 0.05 },
];

// 汇率
const FX: Record<string, number> = { CNY: 1, HKD: 0.93, USD: 7.25 };

function getYahooTicker(ticker: string): string {
  if (ticker.endsWith('.HK')) return ticker;
  if (/^\d{6}$/.test(ticker)) return `${ticker}.SS`;
  return ticker;
}

function toCNY(amount: number, currency: string): number {
  return amount * (FX[currency] ?? 1);
}

async function fetchPrice(ticker: string, market: string): Promise<Omit<PriceData, 'ticker' | 'loading'>> {
  const yahoo = getYahooTicker(ticker);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahoo}?interval=1d&range=5d`;
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No data');
    const closes = result.indicators?.quote?.[0]?.close;
    if (!closes || closes.length < 2) throw new Error('No close prices');
    const curr = closes[closes.length - 1];
    const prev = closes[closes.length - 2];
    const currencyMap: Record<string, string> = { CN: 'CNY', HK: 'HKD', US: 'USD' };
    return {
      price: curr,
      change: curr - prev,
      changePct: ((curr - prev) / prev) * 100,
      currency: currencyMap[market] ?? 'CNY',
      market: market as 'CN' | 'HK' | 'US',
    };
  } catch (err: unknown) {
    throw new Error((err as Error).message);
  }
}

export default function KevinPortfolio() {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('—');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const newPrices = new Map<string, PriceData>();
      const tickers = KEVIN_HOLDINGS.map(h => h.ticker);

      const results = await Promise.allSettled(
        tickers.map(async (ticker) => {
          const holding = KEVIN_HOLDINGS.find(h => h.ticker === ticker)!;
          const result = await fetchPrice(ticker, holding.market);
          return { ticker, ...result };
        })
      );

      results.forEach((r, i) => {
        const ticker = tickers[i];
        if (r.status === 'fulfilled') {
          newPrices.set(ticker, { loading: false, ...r.value });
        } else {
          newPrices.set(ticker, {
            loading: false, price: 0, change: 0,
            changePct: 0, currency: 'CNY', market: 'CN',
            error: (r.reason as Error)?.message ?? 'Failed',
          });
        }
      });

      if (!cancelled) {
        setPrices(newPrices);
        setLastUpdated(new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit', minute: '2-digit',
        }));
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Calculate totals
  const totalInvestedValue = KEVIN_HOLDINGS.reduce((sum, h) => {
    const p = prices.get(h.ticker);
    if (p && p.price > 0 && h.shares) {
      return sum + toCNY(h.shares * p.price, p.currency);
    }
    return sum + INVESTED_CAPITAL * h.allocation;
  }, 0);

  const totalCostBasis = KEVIN_HOLDINGS.reduce((sum, h) => {
    if (h.shares && h.cost) {
      return sum + h.shares * h.cost;
    }
    return sum + INVESTED_CAPITAL * h.allocation;
  }, 0);

  // Day P&L: sum of (position_value × day_change%) for each holding with live price
  const totalDayPnL = KEVIN_HOLDINGS.reduce((sum, h) => {
    const p = prices.get(h.ticker);
    if (p && p.price > 0 && h.shares) {
      const posValue = toCNY(h.shares * p.price, p.currency);
      return sum + (posValue * p.changePct / 100);
    }
    return sum;
  }, 0);
  const totalDayPnLPct = totalInvestedValue > 0 ? (totalDayPnL / totalInvestedValue) * 100 : 0;
  const dayColor = totalDayPnL >= 0 ? C.green : C.red;

  const totalPnl = totalInvestedValue - totalCostBasis;
  const totalPnlPct = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;
  const posColor = totalPnl >= 0 ? C.green : C.red;
  const cashAmount = TOTAL_CAPITAL - INVESTED_CAPITAL;

  const fmtCNY = (v: number) => `¥${(v / 10000).toFixed(1)}万`;

  return (
    <div style={{ padding: '24px 0', maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
            我的持仓追踪
          </h2>
          <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>
            个人持仓 vs 聪明钱机构 · 实时行情 · 资金总规模 ¥60万
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text3, fontSize: 12 }}>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              加载中...
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text3, fontSize: 11 }}>
              <RefreshCw size={11} />
              {lastUpdated}
            </div>
          )}
          <div style={{
            padding: '4px 10px', borderRadius: 8,
            background: `${C.blue}12`, border: `1px solid ${C.blue}30`,
            fontSize: 11, fontWeight: 700, color: C.blue,
          }}>
            总仓位 {Math.round(INVESTED_RATIO * 100)}%
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
        <StatBox label="持仓市值" value={fmtCNY(totalInvestedValue)} sub={`≈ $${(totalInvestedValue / 7.25 / 10000).toFixed(1)}K`} color={C.blue} />
        <StatBox label="成本基准" value={fmtCNY(totalCostBasis)} sub="参考买入价累计" color={C.text3} />
        <StatBox
          label="持仓盈亏"
          value={`${totalPnl >= 0 ? '+' : ''}${fmtCNY(totalPnl)}`}
          sub={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`}
          color={posColor}
        />
        <StatBox
          label="今日盈亏"
          value={`${totalDayPnL >= 0 ? '+' : ''}${fmtCNY(totalDayPnL)}`}
          sub={`${totalDayPnLPct >= 0 ? '+' : ''}${totalDayPnLPct.toFixed(2)}%`}
          color={dayColor}
        />
        <StatBox
          label="现金备用"
          value={fmtCNY(cashAmount)}
          sub={`总资金 ${((1 - INVESTED_RATIO) * 100).toFixed(0)}%`}
          color={C.yellow}
        />
      </div>

      {/* Holdings table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 90px 90px 90px 80px 90px 1fr',
          gap: 8, padding: '10px 16px',
          background: '#0d0d0d',
          borderBottom: `1px solid ${C.border}`,
          fontSize: 11, fontWeight: 700, color: C.text3,
        }}>
          <div>股票</div>
          <div style={{ textAlign: 'right' }}>持仓</div>
          <div style={{ textAlign: 'right' }}>成本价</div>
          <div style={{ textAlign: 'right' }}>现价</div>
          <div style={{ textAlign: 'right' }}>今日</div>
          <div style={{ textAlign: 'right' }}>市值</div>
          <div>仓位权重</div>
        </div>

        {KEVIN_HOLDINGS.map((holding, idx) => {
          const priceData = prices.get(holding.ticker);
          const isLoading = !priceData;
          const price = priceData?.price ?? 0;
          const changePct = priceData?.changePct ?? 0;
          const currency = priceData?.currency ?? (holding.market === 'CN' ? 'CNY' : 'HKD');

          const positionValue = (() => {
            if (price > 0 && holding.shares) {
              return toCNY(holding.shares * price, currency);
            }
            return INVESTED_CAPITAL * holding.allocation;
          })();

          const marketLabel = holding.market === 'CN' ? '🇨🇳 A股' : '🇭🇰 港股';
          const weight = holding.allocation * 100;

          return (
            <div key={holding.ticker} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 90px 90px 90px 80px 90px 1fr',
              gap: 8, padding: '12px 16px',
              alignItems: 'center',
              borderBottom: idx < KEVIN_HOLDINGS.length - 1 ? `1px solid ${C.border}` : 'none',
              background: idx % 2 === 0 ? 'transparent' : '#0d0d0d20',
            }}>
              {/* Stock */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                    {holding.ticker}
                  </span>
                  <span style={{ fontSize: 12, color: C.text2 }}>{holding.name}</span>
                  <span style={{ fontSize: 10, color: C.text3 }}>{marketLabel}</span>
                </div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{holding.sector}</div>
              </div>

              {/* Shares */}
              <div style={{ textAlign: 'right', fontSize: 12, color: C.text2, fontFamily: 'JetBrains Mono, monospace' }}>
                {holding.shares ? `${holding.shares.toLocaleString()}股` : '—'}
              </div>

              {/* Cost per share */}
              <div style={{ textAlign: 'right', fontSize: 12, color: C.text3, fontFamily: 'JetBrains Mono, monospace' }}>
                {holding.cost ? `¥${holding.cost}` : '—'}
              </div>

              {/* Current price */}
              <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                {isLoading ? (
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', display: 'inline' }} />
                ) : priceData?.error ? (
                  <span style={{ fontSize: 10, color: C.red }}>失败</span>
                ) : (
                  `${currency === 'CNY' ? '¥' : 'HK$'}${price.toFixed(2)}`
                )}
              </div>

              {/* Day change */}
              <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: changePct >= 0 ? C.green : C.red, fontFamily: 'JetBrains Mono, monospace' }}>
                {isLoading || priceData?.error ? '—' : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                    {changePct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                  </span>
                )}
              </div>

              {/* Market value */}
              <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                {isLoading ? '—' : fmtCNY(positionValue)}
              </div>

              {/* Weight bar */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 6, background: '#1e1e1e', borderRadius: 3 }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${weight}%`,
                      background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text3, width: 36, textAlign: 'right' }}>
                    {weight}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
        数据来源：Yahoo Finance 实时行情 · 成本价为参考买入价（安克创新持仓800股@¥116.25）· 汇率：USD/CNY 7.25、HKD/CNY 0.93 · 仅供个人追踪，不构成投资建议
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
      <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{sub}</div>
    </div>
  );
}
