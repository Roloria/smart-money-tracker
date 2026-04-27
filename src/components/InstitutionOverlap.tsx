/**
 * InstitutionOverlap — 机构持仓重叠分析
 * 识别哪些股票被多家机构共同持有，发现资金合力方向
 */

import { useMemo, useState } from 'react';
import { getAllHoldings } from '../data/realData';
import type { Holding } from '../types';
import { institutions } from '../data/mockData';

const C = {
  bg: '#0a0a0a', card: '#141414', border: '#1e1e1e',
  text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  blue: '#38bdf8', green: '#22c55e', red: '#ef4444',
  yellow: '#f59e0b', purple: '#a78bfa',
};

interface OverlapStock {
  ticker: string;
  name: string;
  market: string;
  instCount: number;
  totalValue: number; // USD
  instNames: string[];
  sectors: string[];
  changePercent: number;
  consensusSignal: 'strong_buy' | 'buy' | 'neutral' | 'sell';
}

const SIGNAL_CONFIG = {
  strong_buy: { label: '强烈买入', color: '#22c55e', bg: '#22c55e15', border: '#22c55e30' },
  buy:        { label: '买入',     color: '#4ade80', bg: '#4ade8015', border: '#4ade8030' },
  neutral:    { label: '中性',     color: '#64748b', bg: '#64748b15', border: '#64748b30' },
  sell:       { label: '卖出',     color: '#ef4444', bg: '#ef444415', border: '#ef444430' },
};

const FX_RATES: Record<string, number> = { USD: 1, HKD: 1/7.78, CNY: 1/7.25 };
function getFx(ticker: string) {
  if (ticker.includes('.HK')) return FX_RATES.HKD;
  if (/^\d{6}$/.test(ticker)) return FX_RATES.CNY;
  return FX_RATES.USD;
}

function getSignal(changePercent: number, instCount: number): OverlapStock['consensusSignal'] {
  const avgChange = changePercent;
  if (avgChange >= 15 && instCount >= 3) return 'strong_buy';
  if (avgChange >= 5) return 'buy';
  if (avgChange <= -10) return 'sell';
  return 'neutral';
}

export default function InstitutionOverlap() {
  const [minOverlap, setMinOverlap] = useState(2);

  const { stocks, instCountMap } = useMemo(() => {
    const holdings = getAllHoldings();
    const tickerMap = new Map<string, {
      ticker: string;
      name: string;
      market: string;
      sector: string;
      instIds: Set<number>;
      instNames: string[];
      values: number[];
      changes: number[];
    }>();

    holdings.forEach((h: Holding) => {
      const fx = getFx(h.stockTicker);
      const valUsd = h.marketValue * fx;
      if (!tickerMap.has(h.stockTicker)) {
        tickerMap.set(h.stockTicker, {
          ticker: h.stockTicker,
          name: h.stockName,
          market: h.market || 'US',
          sector: h.sector,
          instIds: new Set(),
          instNames: [],
          values: [],
          changes: [],
        });
      }
      const entry = tickerMap.get(h.stockTicker)!;
      entry.instIds.add(h.institutionId);
      entry.instNames.push(
        institutions.find(x => x.id === h.institutionId)?.name || `机构${h.institutionId}`
      );
      entry.values.push(valUsd);
      entry.changes.push(h.changePercent);
    });

    const overlapStocks: OverlapStock[] = [...tickerMap.entries()]
      .filter(([, v]) => v.instIds.size >= minOverlap)
      .map(([, v]) => {
        const instCount = v.instIds.size;
        const totalValue = v.values.reduce((a, b) => a + b, 0);
        const avgChange = v.changes.reduce((a, b) => a + b, 0) / v.changes.length;
        const uniqueSectors = [...new Set(v.instNames)];
        return {
          ticker: v.ticker,
          name: v.name,
          market: v.market,
          instCount,
          totalValue,
          instNames: [...new Set(v.instNames)],
          sectors: [v.sector],
          changePercent: avgChange,
          consensusSignal: getSignal(avgChange, instCount),
        } as OverlapStock;
      })
      .sort((a, b) => {
        // Sort by: more institutions first, then higher value
        if (b.instCount !== a.instCount) return b.instCount - a.instCount;
        return b.totalValue - a.totalValue;
      });

    // Count how many institutions each stock has (for badge)
    const instCountMap = new Map<string, number>();
    overlapStocks.forEach(s => instCountMap.set(s.ticker, s.instCount));

    return { stocks: overlapStocks, instCountMap };
  }, [minOverlap]);

  const marketBadge = (m: string) => {
    const map: Record<string, string> = { US: '🇺🇸', HK: '🇭🇰', CN: '🇨🇳' };
    return map[m] || '';
  };

  return (
    <div style={{ padding: '24px 0', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>
          机构持仓重叠分析
        </h2>
        <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>
          发现被多家机构共同持有的股票，识别资金合力方向。重叠度越高，说明机构对该股票的关注度越高。
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: C.text3 }}>最少机构数：</span>
        {[2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setMinOverlap(n)} style={{
            padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: minOverlap === n ? `${C.blue}20` : 'transparent',
            border: `1px solid ${minOverlap === n ? C.blue + '40' : C.border}`,
            color: minOverlap === n ? C.blue : C.text3,
            cursor: 'pointer',
          }}>
            ≥{n}家
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {Object.entries(SIGNAL_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 6,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              fontSize: 11, color: cfg.color, fontWeight: 600,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24,
      }}>
        {[
          { label: '重叠股票', value: stocks.length, color: C.blue, sub: `≥${minOverlap}家机构共同持有` },
          { label: '涉及机构', value: [...new Set(stocks.flatMap(s => s.instNames))].length, color: C.yellow, sub: '覆盖机构数' },
          { label: '最强信号', value: stocks.filter(s => s.consensusSignal === 'strong_buy').length, color: C.green, sub: '强烈买入信号' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Stock list */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 2fr 80px 80px 80px 1fr',
          gap: 8,
          padding: '10px 16px',
          background: '#0d0d0d',
          borderBottom: `1px solid ${C.border}`,
          fontSize: 11, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <div>#</div>
          <div>股票</div>
          <div style={{ textAlign: 'center' }}>机构数</div>
          <div style={{ textAlign: 'right' }}>总市值</div>
          <div style={{ textAlign: 'right' }}>平均变化</div>
          <div>信号</div>
        </div>

        {stocks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.text3 }}>
            暂无满足条件的数据
          </div>
        )}

        {stocks.map((stock, idx) => {
          const sc = SIGNAL_CONFIG[stock.consensusSignal];
          const maxInst = Math.max(...stocks.map(s => s.instCount));
          const intensity = stock.instCount / maxInst;

          return (
            <div key={stock.ticker} style={{
              display: 'grid',
              gridTemplateColumns: '40px 2fr 80px 80px 80px 1fr',
          gap: 8,
              padding: '12px 16px',
              alignItems: 'center',
              borderBottom: idx < stocks.length - 1 ? `1px solid ${C.border}` : 'none',
              background: idx % 2 === 0 ? 'transparent' : '#0d0d0d20',
            }}>
              {/* Rank */}
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: idx < 3 ? `${C.yellow}20` : '#0d0d0d',
                border: `1px solid ${idx < 3 ? C.yellow + '40' : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                color: idx < 3 ? C.yellow : C.text3,
              }}>
                {idx + 1}
              </div>

              {/* Stock info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                    {stock.ticker}
                  </span>
                  <span style={{ fontSize: 12, color: C.text3 }}>{stock.name}</span>
                  <span style={{ fontSize: 11, color: C.text3 }}>{marketBadge(stock.market)}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                  {stock.instNames.slice(0, 4).map(name => (
                    <span key={name} style={{
                      fontSize: 10, color: C.text3,
                      background: '#0d0d0d', padding: '1px 6px', borderRadius: 4,
                    }}>
                      {name}
                    </span>
                  ))}
                  {stock.instNames.length > 4 && (
                    <span style={{ fontSize: 10, color: C.text3 }}>+{stock.instNames.length - 4}</span>
                  )}
                </div>
              </div>

              {/* Inst count with bar */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 28, borderRadius: 8,
                  background: C.blue + Math.round(intensity * 30).toString(16).padStart(2, '0'),
                  fontSize: 13, fontWeight: 800, color: C.text,
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {stock.instCount}
                </div>
              </div>

              {/* Market value */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                  ${(stock.totalValue / 1e9).toFixed(1)}B
                </div>
              </div>

              {/* Change */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: stock.changePercent >= 0 ? C.green : C.red,
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                </div>
              </div>

              {/* Signal */}
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 6,
                  background: sc.bg, border: `1px solid ${sc.border}`,
                  fontSize: 11, fontWeight: 700, color: sc.color,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: sc.color }} />
                  {sc.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <div style={{ marginTop: 12, fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
        信号说明：强烈买入 = ≥3家机构共同持有 + 平均变化≥15%；买入 = 平均变化≥5%；中性 = 变化在±10%之间；卖出 = 平均变化≤-10%。
        数据来源：SEC EDGAR 13F / 港交所披露易 / 东方财富 QFII。
      </div>

      {/* Page footer */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8,marginTop:16,padding:'0 4px'}}>
        <span style={{fontSize:10,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>数据来源</span>
        <span style={{fontSize:10,color:'#a78bfa',fontFamily:'JetBrains Mono,monospace',fontWeight:600}}>SEC EDGAR 13F · 港交所披露易 · 东方财富 QFII</span>
        <span style={{fontSize:10,color:'#3f3f46'}}>|</span>
        <span style={{fontSize:10,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>2026 Q1</span>
      </div>
    </div>
  );
}
