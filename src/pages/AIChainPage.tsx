// @ts-nocheck
/**
 * AIChainPage — AI产业链追踪详情页
 * 支持：按产业链层筛选 → 股票列表 → 机构持仓详情（二跳）
 */
import { useState } from 'react';
import { Cpu, Cloud, AppWindow, Bot, Flag, ArrowLeft, TrendingUp, TrendingDown, Building2, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAIChainSummary, getLayerStats, AI_LAYERS, type AILayer, type AIStockSummary } from '../data/aiChain';
import { getAllHoldings, getDataSources } from '../data/realData';
import { institutions } from '../data/mockData';

const C = {
  bg: '#0a0a0a', card: '#141414', cardHover: '#1a1a1a',
  border: '#1e1e1e', text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  blue: '#38bdf8', green: '#22c55e', red: '#ef4444', yellow: '#f59e0b', purple: '#a78bfa',
};

const LAYER_ICONS: Record<AILayer, any> = {
  chip: Cpu, cloud: Cloud, app: AppWindow, robot: Bot, china_ai: Flag,
};

const fmt$ = (v: number) => {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v}`;
};
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
const fmtN = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return `${v}`;
};

// ── 数据来源 Badge ─────────────────────────────────────────────────────────────
function SourceBadge({ ticker }: { ticker: string }) {
  const allHoldings = getAllHoldings();
  const h = allHoldings.find(h => h.stockTicker === ticker);
  if (!h) return null;
  const src = getDataSources().find(s => {
    if ((h as any).market === 'HK') return s.source === 'HKEX';
    if ((h as any).market === 'CN') return s.source === 'QFII';
    return s.source === 'SEC_EDGAR';
  });
  if (!src) return null;
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700,
      background: `${src.color}15`, color: src.color, border: `1px solid ${src.color}30`,
    }}>
      {src.labelShort}
    </span>
  );
}

// ── Layer Overview Cards ───────────────────────────────────────────────────────
function LayerOverview({ stats, onSelectLayer }: { stats: any[]; onSelectLayer: (l: AILayer) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
      {stats.map(s => {
        const Icon = LAYER_ICONS[s.layer.layer];
        return (
          <div key={s.layer.layer} onClick={() => onSelectLayer(s.layer.layer)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.layer.color + '50'; e.currentTarget.style.background = C.cardHover; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.layer.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={s.layer.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.layer.color }}>{s.layer.label}</div>
                <div style={{ fontSize: 10, color: C.text3 }}>{s.instCount}条持仓 · {s.stocks}只股票</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#0d0d0d', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{fmt$(s.totalValue)}</div>
                <div style={{ fontSize: 9, color: C.text3 }}>总持仓</div>
              </div>
              <div style={{ background: '#0d0d0d', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: s.avgChange >= 0 ? C.green : C.red }}>
                  {pct(s.avgChange)}
                </div>
                <div style={{ fontSize: 9, color: C.text3 }}>季度变化</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Stock Row ─────────────────────────────────────────────────────────────────
function StockRow({ stock, onClick }: { stock: AIStockSummary; onClick: () => void }) {
  const marketColor = stock.market === 'US' ? C.blue : stock.market === 'HK' ? C.yellow : stock.market === 'CN' ? C.red : C.text3;
  const holdings = getAllHoldings().filter(h => h.stockTicker === stock.ticker);

  return (
    <tr onClick={onClick}
      style={{ cursor: 'pointer', borderBottom: `1px solid ${C.border}`, transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.background = C.cardHover)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{stock.ticker}</span>
          <span style={{ fontSize: 11, color: C.text3 }}>{stock.name}</span>
        </div>
      </td>
      <td style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {stock.layers.map(l => {
            const info = AI_LAYERS.find(x => x.layer === l)!;
            return (
              <span key={l} style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: `${info.color}15`, color: info.color }}>
                {info.label}
              </span>
            );
          })}
          {stock.isSmallCap && (
            <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: `${C.purple}15`, color: C.purple }}>小盘</span>
          )}
        </div>
      </td>
      <td style={{ padding: '10px 14px' }}>
        <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: `${marketColor}15`, color: marketColor }}>
          {{ US: '🇺🇸 US', HK: '🇭🇰 HK', CN: '🇨🇳 A股' }[stock.market]}
        </span>
        <div style={{ marginTop: 3 }}><SourceBadge ticker={stock.ticker} /></div>
      </td>
      <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 800, color: C.text }}>{fmt$(stock.totalValue)}</td>
      <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text2 }}>{holdings.length}家</td>
      <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: stock.avgChange >= 0 ? C.green : C.red }}>
        {stock.avgChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {pct(stock.avgChange)}
      </td>
      <td style={{ padding: '10px 14px', fontSize: 12 }}>
        {stock.isNewPosition && <span style={{ color: C.red, fontWeight: 700 }}>🆕新建仓</span>}
        {stock.accumulating && !stock.isNewPosition && <span style={{ color: C.green }}>📈加仓中</span>}
        {!stock.accumulating && !stock.isNewPosition && <span style={{ color: C.text3 }}>—</span>}
      </td>
    </tr>
  );
}

// ── Stock Detail View ─────────────────────────────────────────────────────────
function StockDetail({ stock, onBack }: { stock: AIStockSummary; onBack: () => void }) {
  const allHoldings = getAllHoldings();
  const stockHoldings = allHoldings.filter(h => h.stockTicker === stock.ticker);

  return (
    <div>
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
        background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8,
        cursor: 'pointer', color: C.text3, fontSize: 12, marginBottom: 16,
      }}>
        <ArrowLeft size={13} />返回股票列表
      </button>

      {/* Stock header */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: C.text, marginBottom: 4 }}>{stock.ticker}</div>
            <div style={{ fontSize: 15, color: C.text3, marginBottom: 8 }}>{stock.name}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {stock.layers.map(l => {
                const info = AI_LAYERS.find(x => x.layer === l)!;
                return <span key={l} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${info.color}20`, color: info.color, border: `1px solid ${info.color}40` }}>{info.label}</span>;
              })}
              <SourceBadge ticker={stock.ticker} />
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{fmt$(stock.totalValue)}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: stock.avgChange >= 0 ? C.green : C.red, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              {stock.avgChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />} {pct(stock.avgChange)}
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{stockHoldings.length}家机构持有</div>
          </div>
        </div>
      </div>

      {/* Institution holdings for this stock */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={13} color={C.blue} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>持有机构</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: C.text3 }}>{stockHoldings.length} 家</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['机构', '股票', '持股数量', '持仓市值', '持股比例', '季度变化'].map(h => (
                <th key={h} style={{ padding: '8px 14px', fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stockHoldings.map(h => {
              const inst = institutions.find(i => i.id === h.institutionId);
              return (
                <tr key={h.id} style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.cardHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${inst?.color || C.blue}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: inst?.color || C.blue }}>{inst?.name?.[0] || '?'}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{inst?.name || `机构${h.institutionId}`}</div>
                        <div style={{ fontSize: 10, color: C.text3 }}>{inst?.nameEn}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.text2 }}>{h.stockTicker}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text }}>{fmtN(h.shares)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: C.text }}>{fmt$(h.marketValue)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text2 }}>{h.ownershipPercent}%</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: h.changePercent >= 0 ? C.green : C.red }}>
                    {h.changePercent >= 0 ? '+' : ''}{h.changePercent.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function AIChainPage() {
  const [activeLayer, setActiveLayer] = useState<AILayer | null>(null);
  const [detailStock, setDetailStock] = useState<AIStockSummary | null>(null);

  const layerStats = getLayerStats();
  const allSummary = getAIChainSummary();

  const filteredSummary = activeLayer
    ? allSummary.filter(s => s.layers.includes(activeLayer))
    : allSummary;

  if (detailStock) {
    return <StockDetail stock={detailStock} onBack={() => setDetailStock(null)} />;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: '0 0 4px' }}>AI产业链追踪</h2>
        <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>追踪全球机构在 AI 芯片、云基础设施、应用层、终端等产业链的持仓动向</p>
      </div>

      {/* Layer filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={() => setActiveLayer(null)} style={{
          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          background: !activeLayer ? `${C.blue}20` : 'transparent',
          border: `1px solid ${!activeLayer ? C.blue + '50' : C.border}`,
          color: !activeLayer ? C.blue : C.text3, transition: 'all 0.15s',
        }}>
          全部产业链
        </button>
        {AI_LAYERS.map(l => {
          const Icon = LAYER_ICONS[l.layer];
          return (
            <button key={l.layer} onClick={() => setActiveLayer(activeLayer === l.layer ? null : l.layer)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: activeLayer === l.layer ? `${l.color}20` : 'transparent',
              border: `1px solid ${activeLayer === l.layer ? l.color + '50' : C.border}`,
              color: activeLayer === l.layer ? l.color : C.text3, transition: 'all 0.15s',
            }}>
              <Icon size={13} color={l.color} />{l.label}
            </button>
          );
        })}
      </div>

      {/* Layer Overview (when no filter) */}
      {!activeLayer && (
        <LayerOverview stats={layerStats} onSelectLayer={setActiveLayer} />
      )}

      {/* Stock Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>AI持仓明细</span>
          <span style={{ fontSize: 11, color: C.text3, background: '#0d0d0d', padding: '2px 8px', borderRadius: 4 }}>{filteredSummary.length} 只股票</span>
          {activeLayer && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: C.text3 }}>
              {AI_LAYERS.find(l => l.layer === activeLayer)?.label}
            </span>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['股票', '所属层', '市场', '持仓市值', '机构数', '季度变化', '状态'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSummary.map(s => (
                <StockRow key={s.ticker} stock={s} onClick={() => setDetailStock(s)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
