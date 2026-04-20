/**
 * AIFlowPage — AI产业链追踪详情页
 * Phase 6: 每个产业链模块的机构持仓、异动统计、二跳详情
 */
import { useState } from 'react';
import { Cpu, Cloud, AppWindow, Bot, Flag, TrendingUp, TrendingDown, ChevronRight, Building2, ExternalLink } from 'lucide-react';
// recharts dynamically imported (see dynamic import pattern in SmartMoney.tsx)
import { getAIChainSummary, getLayerStats, AI_LAYERS, type AILayer } from '../data/aiChain';
import { getAllHoldings, getAllChanges, getDataSources, getDataSourceLabel } from '../data/realData';
import type { Holding } from '../types';

const C = {
  bg: '#0a0a0a', card: '#141414', cardHover: '#1a1a1a',
  border: '#1e1e1e', text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  green: '#22c55e', red: '#ef4444', yellow: '#f59e0b',
  blue: '#38bdf8', purple: '#a78bfa',
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

// 数据来源标签
function SourceTag({ source }: { source: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    HKEX:          { color: C.yellow, label: '港交所' },
    EASTMONEY_QFII:{ color: C.green,  label: 'QFII' },
    SEC_EDGAR:     { color: C.blue,   label: 'SEC 13F' },
    TUSHARE_HSGT:  { color: C.purple, label: 'Tushare' },
    MOCK:          { color: C.red,   label: '模拟数据' },
  };
  const c = cfg[source] || { color: C.text3, label: source };
  return (
    <span style={{
      padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
      background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30`,
    }}>
      {c.label}
    </span>
  );
}

// 单个产业链模块卡片
function LayerModuleCard({ layer, stats, onClick }: {
  layer: typeof AI_LAYERS[0];
  stats: ReturnType<typeof getLayerStats>[0];
  onClick: () => void;
}) {
  const Icon = LAYER_ICONS[layer.layer];
  const changeColor = stats.avgChange >= 0 ? C.green : C.red;
  const holdings = getAllHoldings().filter(h =>
    layer.keywords.some(k => h.stockTicker.includes(k))
  );

  return (
    <div
      onClick={onClick}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: 20, cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = layer.color + '50'; e.currentTarget.style.background = C.cardHover; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${layer.color}18`, border: `1px solid ${layer.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={layer.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: layer.color }}>{layer.label}</div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{layer.labelEn}</div>
        </div>
        <ChevronRight size={16} color={C.text3} />
      </div>

      <div style={{ fontSize: 11, color: C.text3, marginBottom: 12, lineHeight: 1.5 }}>{layer.description}</div>

      {/* 核心指标 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div style={{ background: '#0d0d0d', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{fmt$(stats.totalValue)}</div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>总持仓市值</div>
        </div>
        <div style={{ background: '#0d0d0d', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{stats.instCount}</div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>持仓记录</div>
        </div>
        <div style={{ background: '#0d0d0d', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: changeColor }}>
            {stats.avgChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {pct(stats.avgChange)}
          </div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>平均季度变化</div>
        </div>
      </div>

      {/* 持仓股票列表 */}
      <div style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>持仓个股</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {holdings.slice(0, 4).map(h => (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#0d0d0d', borderRadius: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.text, width: 70 }}>{h.stockTicker}</span>
            <span style={{ fontSize: 10, color: C.text3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.stockName}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: h.changePercent >= 0 ? C.green : C.red }}>
              {pct(h.changePercent)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 二跳：个股详情
function StockDetailPanel({ layerKey }: { layerKey: AILayer }) {
  const layer = AI_LAYERS.find(l => l.layer === layerKey)!;
  const Icon = LAYER_ICONS[layerKey];
  const holdings = getAllHoldings().filter(h =>
    layer.keywords.some(k => h.stockTicker.includes(k))
  );
  const changes = getAllChanges().filter(c =>
    holdings.some(h => h.stockTicker === c.stockTicker)
  );
  const stats = getLayerStats().find(s => s.layer.layer === layerKey)!;
  const changeColor = stats.avgChange >= 0 ? C.green : C.red;

  return (
    <div>
      {/* 返回按钮 */}
      <button
        onClick={() => history.back()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', color: C.text3, fontSize: 12, marginBottom: 16 }}
      >
        ← 返回产业链
      </button>

      {/* 产业概览 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: `${layer.color}18`, border: `1px solid ${layer.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={28} color={layer.color} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: layer.color }}>{layer.label}</div>
            <div style={{ fontSize: 13, color: C.text3 }}>{layer.labelEn}</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 4, lineHeight: 1.5 }}>{layer.description}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{fmt$(stats.totalValue)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: changeColor, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
              {stats.avgChange >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {pct(stats.avgChange)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: '持仓市值', value: fmt$(stats.totalValue), color: C.text },
            { label: '持仓记录', value: `${stats.instCount}条`, color: C.text },
            { label: '覆盖股票', value: `${stats.stocks}只`, color: C.text },
            { label: '平均变化', value: pct(stats.avgChange), color: changeColor },
          ].map(item => (
            <div key={item.label} style={{ background: '#0d0d0d', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 持仓明细表格 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>持仓明细</span>
          <SourceTag source={(holdings[0] as any)?._dataSource || 'MOCK'} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['股票代码', '股票名称', '持有机构', '持仓市值', '持股数量', '持股比例', '季度变化', '数据来源'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => {
                const inst = holdings.find((x: any) => x.institutionId === h.institutionId);
                const instName = (inst as any)?.institutionName || `机构${h.institutionId}`;
                return (
                  <tr key={h.id} style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.cardHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: C.text }}>{h.stockTicker}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: C.text2 }}>{h.stockName}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: C.text2 }}>{instName}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: C.text }}>{fmt$(h.marketValue)}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text2 }}>{fmtN(h.shares)}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text2 }}>{h.ownershipPercent.toFixed(2)}%</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: h.changePercent >= 0 ? C.green : C.red }}>
                      {pct(h.changePercent)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <SourceTag source={(h as any)._dataSource || 'MOCK'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 季度异动 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>近期异动</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {changes.slice(0, 6).map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#0d0d0d', borderRadius: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.changeType === 'increase' ? C.green : c.changeType === 'decrease' ? C.red : C.yellow, flexShrink: 0 }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: C.text }}>{c.stockTicker}</span>
              <span style={{ fontSize: 11, color: C.text3, flex: 1 }}>{c.stockName}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: c.changePercent >= 0 ? C.green : C.red }}>
                {c.changeType === 'increase' ? '增持' : c.changeType === 'decrease' ? '减持' : '新进'} {pct(c.changePercent)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AIFlowPage() {
  const [activeLayer, setActiveLayer] = useState<AILayer | null>(null);
  const layerStats = getLayerStats();
  const sources = getDataSources();

  if (activeLayer) {
    return (
      <div style={{ padding: '0 4px' }}>
        <StockDetailPanel layerKey={activeLayer} />
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fafafa', margin: 0 }}>AI 产业链追踪</h1>
        <p style={{ fontSize: 13, color: '#71717a', margin: '4px 0 0' }}>
          追踪全球顶级机构在 AI 产业链各层的持仓动向 · {getDataSourceLabel()}
        </p>
      </div>

      {/* 数据来源条 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, padding: '10px 14px', background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {sources.map(s => (
          <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: `${s.color}12`, border: `1px solid ${s.color}25`, fontSize: 11 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.freshness === 'live' ? C.green : s.freshness === 'recent' ? C.yellow : C.text3 }} />
            <span style={{ fontWeight: 700, color: s.color }}>{s.labelShort}</span>
            <span style={{ color: C.text3 }}>{s.lastUpdated}</span>
          </div>
        ))}
      </div>

      {/* 5大产业层 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {layerStats.map(stats => (
          <LayerModuleCard
            key={stats.layer.layer}
            layer={stats.layer}
            stats={stats}
            onClick={() => setActiveLayer(stats.layer.layer)}
          />
        ))}
      </div>
    </div>
  );
}
