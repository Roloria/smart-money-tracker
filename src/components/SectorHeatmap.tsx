/**
 * SectorHeatmap — 持仓板块热力图
 * 以 Treemap 形式展示各板块持仓占比与涨跌情况
 */

import { useMemo } from 'react';
import type { Holding } from '../types';

const C = {
  card: '#141414', border: '#1e1e1e',
  text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  green: '#22c55e', red: '#ef4444', blue: '#38bdf8', yellow: '#f59e0b',
};

const SECTOR_COLORS: Record<string, string> = {
  '科技':    '#3b82f6',
  '消费':    '#f59e0b',
  '金融':    '#22c55e',
  '医疗':    '#ec4899',
  '能源':    '#f97316',
  '新能源':  '#84cc16',
  '工业':    '#06b6d4',
  '房地产':  '#a78bfa',
  'ETF':     '#64748b',
  '通信':    '#38bdf8',
  '其他':    '#52525b',
};

const FX_RATES: Record<string, number> = {
  USD: 1, HKD: 1/7.78, CNY: 1/7.25,
};

function getFx(ticker: string): number {
  if (ticker.includes('.HK')) return FX_RATES.HKD;
  if (/^\d{6}$/.test(ticker)) return FX_RATES.CNY;
  return FX_RATES.USD;
}

interface SectorNode {
  name: string;
  value: number;       // total market value in USD
  count: number;        // number of holdings
  pct: number;          // % of total portfolio
  color: string;
  children?: StockNode[];
}

interface StockNode {
  name: string;         // ticker
  ticker: string;
  fullName: string;
  value: number;        // USD
  pct: number;
  color: string;
}

export default function SectorHeatmap({ holdings }: { holdings: Holding[] }) {
  const { sectors, total } = useMemo(() => {
    const map = new Map<string, { value: number; stocks: StockNode[] }>();
    let grand = 0;

    holdings.forEach((h: any) => {
      const fx = getFx(h.stockTicker);
      const valUsd = h.marketValue * fx;
      grand += valUsd;
      const sector = h.sector || '其他';
      if (!map.has(sector)) map.set(sector, { value: 0, stocks: [] });
      const entry = map.get(sector)!;
      entry.value += valUsd;
      entry.stocks.push({
        name: h.stockTicker,
        ticker: h.stockTicker,
        fullName: h.stockName,
        value: valUsd,
        pct: 0,
        color: SECTOR_COLORS[sector] || '#52525b',
      });
    });

    const sectorList = [...map.entries()].map(([name, { value, stocks }]) => {
      const color = SECTOR_COLORS[name] || '#52525b';
      const children = stocks
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
        .map(s => ({ ...s, pct: grand > 0 ? (s.value / grand) * 100 : 0 }));
      return {
        name,
        value,
        count: stocks.length,
        pct: grand > 0 ? (value / grand) * 100 : 0,
        color,
        children,
      };
    }).sort((a, b) => b.value - a.value);

    return { sectors: sectorList, total: grand };
  }, [holdings]);

  if (sectors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: C.text3, fontSize: 13 }}>
        暂无持仓数据
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {sectors.map(s => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
            <span style={{ fontSize: 11, color: C.text3 }}>{s.name}</span>
            <span style={{ fontSize: 10, color: C.text3, opacity: 0.6 }}>{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      {/* Sector blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sectors.map(sector => (
          <div key={sector.name}>
            {/* Sector row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 4,
            }}>
              <div style={{ width: 80, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: sector.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{sector.name}</span>
              </div>

              {/* Bar background */}
              <div style={{ flex: 1, height: 22, background: '#111', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(sector.pct, 1)}%`,
                  background: sector.color + '30',
                  borderRight: `2px solid ${sector.color}`,
                  transition: 'width 0.3s',
                }} />
              </div>

              <div style={{ width: 80, textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: sector.color, fontFamily: 'JetBrains Mono, monospace' }}>
                  ${(sector.value / 1e9).toFixed(1)}B
                </span>
              </div>
              <div style={{ width: 40, textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: C.text3 }}>{sector.pct.toFixed(1)}%</span>
              </div>
            </div>

            {/* Stock chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 88 }}>
              {sector.children?.slice(0, 6).map(stock => (
                <div key={stock.ticker} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 5,
                  background: '#0d0d0d', border: `1px solid ${sector.color}20`,
                  fontSize: 10,
                }}>
                  <span style={{ color: C.text2, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                    {stock.ticker}
                  </span>
                  <span style={{ color: C.text3 }}>
                    ${(stock.value / 1e9).toFixed(2)}B
                  </span>
                </div>
              ))}
              {sector.count > 6 && (
                <div style={{
                  padding: '2px 8px', borderRadius: 5,
                  background: 'transparent', fontSize: 10, color: C.text3,
                }}>
                  +{sector.count - 6} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Grand total */}
      <div style={{
        marginTop: 16, padding: '10px 14px',
        background: '#0d0d0d', borderRadius: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        border: `1px solid ${C.border}`,
      }}>
        <span style={{ fontSize: 12, color: C.text3 }}>合计持仓市值</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: C.blue, fontFamily: 'JetBrains Mono, monospace' }}>
          ${(total / 1e12).toFixed(2)}T
        </span>
      </div>
    </div>
  );
}
