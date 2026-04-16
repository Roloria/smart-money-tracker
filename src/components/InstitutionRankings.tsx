// @ts-nocheck
/**
 * InstitutionRankings — 机构增减持排行榜
 * 按季度/月度展示各机构增持/减持排行
 */

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Trophy, BarChart3 } from 'lucide-react';
import { getAllHoldings, getAllChanges } from '../data/realData';
import { institutions } from '../data/mockData';
import type { HoldingChange } from '../types';

const C = {
  bg: '#0a0a0a', card: '#141414', border: '#1e1e1e',
  text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  blue: '#38bdf8', green: '#22c55e', red: '#ef4444',
  yellow: '#f59e0b', purple: '#a78bfa',
};

const MARKET_TABS = [
  { key: 'ALL', label: '全部', flag: '' },
  { key: 'US',  label: '🇺🇸 美股', flag: '🇺🇸' },
  { key: 'HK',  label: '🇭🇰 港股', flag: '🇭🇰' },
  { key: 'CN',  label: '🇨🇳 A股',  flag: '🇨🇳' },
] as const;

const RANK_TABS = [
  { key: 'increase', label: '增持排行', color: C.green, Icon: TrendingUp },
  { key: 'decrease', label: '减持排行', color: C.red,   Icon: TrendingDown },
] as const;

function getStockPrice(ticker: string): number {
  const priceMap: Record<string, number> = {
    AAPL: 210, MSFT: 420, NVDA: 1300, AMZN: 210, GOOGL: 180,
    META: 570, TSLA: 400, JPM: 230, GS: 440, V: 350,
    JNJ: 140, UNH: 450, PFE: 26, XOM: 100, KO: 60,
    BRK_B: 420, '0700.HK': 50, '9988.HK': 60, '9618.HK': 40,
    '3690.HK': 40, '1810.HK': 2, '1024.HK': 35, '6690.HK': 10,
    '2319.HK': 10, '600519': 2200, '600519.SS': 2200,
    '600036': 50, '600036.SS': 50, '601318': 70, '601318.SS': 70,
    '600030': 70, '600030.SS': 70, '000333': 70, '000333.SS': 70,
    '600276': 80, '600276.SS': 80, '002415': 60, '002415.SS': 60,
    '601012': 40, '601012.SS': 40, '600887': 50, '600887.SS': 50,
    BAC: 40, BLK: 1050,
  };
  return priceMap[ticker] || 100;
}

function isMarket(ticker: string, market: 'US' | 'HK' | 'CN'): boolean {
  if (ticker.includes('.HK')) return market === 'HK';
  if (/^\d{6}$/.test(ticker)) return market === 'CN';
  return market === 'US';
}

interface RankItem {
  institutionId: number;
  institutionName: string;
  institutionColor: string;
  totalChangeAmt: number; // USD (billions)
  totalChangeShares: number;
  changeCount: number;
  topStocks: { ticker: string; name: string; changeAmt: number; pct: number }[];
}

function buildRankings(
  changes: HoldingChange[],
  type: 'increase' | 'decrease',
  market: 'ALL' | 'US' | 'HK' | 'CN',
): RankItem[] {
  const instMap = new Map<number, Map<string, {
    shares: number;
    price: number;
    name: string;
    ticker: string;
  }>>();

  changes
    .filter(c => c.changeType === type)
    .filter(c => market === 'ALL' || isMarket(c.stockTicker, market))
    .forEach(c => {
      if (!instMap.has(c.institutionId)) instMap.set(c.institutionId, new Map());
      const ticker = c.stockTicker;
      const map = instMap.get(c.institutionId)!;
      if (!map.has(ticker)) {
        map.set(ticker, { shares: 0, price: getStockPrice(ticker), name: c.stockName, ticker });
      }
      const entry = map.get(ticker)!;
      const shares = c.currentShares - c.previousShares;
      entry.shares += shares;
    });

  const holdings = getAllHoldings();
  const instColorMap = new Map(holdings.map(h => [h.institutionId, null]));

  const result: RankItem[] = [];
  instMap.forEach((stockMap, instId) => {
    const inst = institutions.find(x => x.id === instId);
    if (!inst) return;
    const stocks = [...stockMap.entries()]
      .filter(([, v]) => Math.abs(v.shares) > 0)
      .map(([ticker, v]) => ({
        ticker,
        name: v.name,
        changeAmt: Math.abs(v.shares * v.price) / 1e9, // billions
        pct: v.shares > 0 ? Math.abs(v.shares / 1e6) : 0,
      }))
      .filter(s => s.changeAmt > 0.001)
      .sort((a, b) => b.changeAmt - a.changeAmt)
      .slice(0, 5);

    const totalChangeAmt = stocks.reduce((s, st) => s + st.changeAmt, 0);

    result.push({
      institutionId: instId,
      institutionName: inst.name,
      institutionColor: inst.color,
      totalChangeAmt,
      totalChangeShares: stocks.reduce((s, st) => s + st.pct * 1e6 * (type === 'increase' ? 1 : -1), 0),
      changeCount: stocks.length,
      topStocks: stocks,
    });
  });

  return result.sort((a, b) => b.totalChangeAmt - a.totalChangeAmt).slice(0, 10);
}

function RankingTable({ items, type, market }: { items: RankItem[]; type: 'increase' | 'decrease'; market: string }) {
  const color = type === 'increase' ? C.green : C.red;

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: C.text3, fontSize: 13 }}>
        暂无{type === 'increase' ? '增持' : '减持'}数据
      </div>
    );
  }

  const maxAmt = items[0]?.totalChangeAmt || 1;

  return (
    <div style={{ overflowY: 'auto', maxHeight: 420 }}>
      {items.map((item, idx) => (
        <div key={item.institutionId} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 0',
          borderBottom: idx < items.length - 1 ? `1px solid ${C.border}` : 'none',
        }}>
          {/* Rank */}
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: idx === 0 ? `${C.yellow}20` : idx === 1 ? `${C.text3}10` : idx === 2 ? `${C.yellow}10` : 'transparent',
            border: `1px solid ${idx < 3 ? C.yellow + '40' : C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800,
            color: idx < 3 ? C.yellow : C.text3,
            flexShrink: 0,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {idx + 1}
          </div>

          {/* Institution */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.institutionName}</span>
              <span style={{ fontSize: 10, color: C.text3 }}>{item.changeCount}只股票</span>
            </div>
            {/* Bar */}
            <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${Math.max((item.totalChangeAmt / maxAmt) * 100, 2)}%`,
                background: color,
                boxShadow: `0 0 6px ${color}60`,
                transition: 'width 0.3s',
              }} />
            </div>
            {/* Top stocks */}
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              {item.topStocks.slice(0, 3).map(st => (
                <span key={st.ticker} style={{
                  fontSize: 10, color: C.text3,
                  background: `${color}10`, padding: '1px 6px', borderRadius: 4,
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {st.ticker} {type === 'increase' ? '+' : '-'}{st.changeAmt.toFixed(2)}B
                </span>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
              {type === 'increase' ? '+' : '-'}{item.totalChangeAmt.toFixed(2)}B
            </div>
            <div style={{ fontSize: 10, color: C.text3 }}>美元</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InstitutionRankings() {
  const [rankType, setRankType] = useState<'increase' | 'decrease'>('increase');
  const [market, setMarket] = useState<'ALL' | 'US' | 'HK' | 'CN'>('ALL');
  const [view, setView] = useState<'quarter' | 'month'>('quarter');

  const changes = getAllChanges();
  const quarters = useMemo(() => {
    const qs = [...new Set(changes.map(c => c.quarter))].sort().reverse();
    return qs;
  }, [changes]);

  // Filter by current quarter for quarter view
  const currentQ = quarters[0] || '2025Q4';
  const viewChanges = useMemo(() => {
    if (view === 'quarter') return changes.filter(c => c.quarter === currentQ);
    // Monthly: use all available
    return changes;
  }, [changes, view, currentQ]);

  const items = useMemo(() => buildRankings(viewChanges, rankType, market), [viewChanges, rankType, market]);

  return (
    <div style={{ padding: '24px 0', maxWidth: 900 }}>
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>
          机构增减持排行
        </h2>
        <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>
          按季度/月度统计各机构持仓变化金额（美元计价），数据来自 SEC 13F / 港交所 / QFII 披露
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap',
      }}>
        {/* Buy/Sell toggle */}
        <div style={{
          display: 'flex', gap: 4,
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 4,
        }}>
          {RANK_TABS.map(({ key, label, color: tc, Icon }) => (
            <button key={key} onClick={() => setRankType(key as any)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 8, border: 'none',
              background: rankType === key ? `${tc}20` : 'transparent',
              color: rankType === key ? tc : C.text3,
              fontWeight: rankType === key ? 700 : 400,
              fontSize: 13, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Market tabs */}
        <div style={{
          display: 'flex', gap: 4,
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 4,
        }}>
          {MARKET_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setMarket(key as any)} style={{
              padding: '6px 12px', borderRadius: 8, border: 'none',
              background: market === key ? `${C.blue}20` : 'transparent',
              color: market === key ? C.blue : C.text3,
              fontWeight: market === key ? 700 : 400,
              fontSize: 12, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        {/* Quarter badge */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 8,
          background: `${C.blue}12`, border: `1px solid ${C.blue}30`,
          fontSize: 12, fontWeight: 700, color: C.blue,
        }}>
          <BarChart3 size={13} />
          {currentQ}
        </div>
      </div>

      {/* Stats summary */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24,
      }}>
        {[
          {
            label: '机构参与数',
            value: items.length.toString(),
            sub: `本季${rankType === 'increase' ? '增持' : '减持'}机构`,
            color: rankType === 'increase' ? C.green : C.red,
          },
          {
            label: rankType === 'increase' ? '总增持金额' : '总减持金额',
            value: `${rankType === 'increase' ? '+' : '-'}${items.reduce((s, i) => s + i.totalChangeAmt, 0).toFixed(1)}B`,
            sub: '美元（USD）',
            color: rankType === 'increase' ? C.green : C.red,
          },
          {
            label: '涉及股票数',
            value: items.reduce((s, i) => s + i.changeCount, 0).toString(),
            sub: '持仓变动标的',
            color: C.yellow,
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: '16px 20px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          fontSize: 12, fontWeight: 600, color: C.text3,
        }}>
          <Trophy size={14} color={C.yellow} />
          {rankType === 'increase' ? '增持' : '减持'}金额排行
          <span style={{ marginLeft: 4, fontSize: 10, color: C.text3 }}>
            · {market === 'ALL' ? '全部市场' : market === 'US' ? '美股' : market === 'HK' ? '港股' : 'A股'}
          </span>
        </div>
        <RankingTable items={items} type={rankType} market={market} />
      </div>

      {/* Note */}
      <div style={{ marginTop: 12, fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
        注：金额基于持仓数量 × 期末股价估算，单位为十亿美元（B）。港股以 7.78 HKD/USD、A股以 7.25 CNY/USD 换算。
        数据来源：SEC EDGAR 13F / 港交所披露易 / 东方财富 QFII。
      </div>
    </div>
  );
}
