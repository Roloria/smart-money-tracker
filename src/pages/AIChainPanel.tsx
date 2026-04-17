/**
 * AIChainPanel — AI产业链 & 小盘股 追踪面板
 * Phase 6: 细拆 AI 产业链各层 + 小盘股建仓监测
 */
import { useState } from 'react';
import { TrendingUp, TrendingDown, Cpu, Cloud, AppWindow, Bot, Flag, Star, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import {
  getAIChainSummary, getLayerStats, getSmallCapSignals,
  AI_LAYERS, type AILayer, type AIStockSummary, type SmallCapSignal, type LayerStats
} from '../data/aiChain';

const C = {
  bg: '#0a0a0a', card: '#141414', cardHover: '#1a1a1a',
  border: '#1e1e1e', text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  blue: '#38bdf8', green: '#22c55e', red: '#ef4444',
  yellow: '#f59e0b', purple: '#a78bfa',
};

const fmt$ = (v: number) => {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
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

// ── Layer Icon ─────────────────────────────────────────────────────────────────
const LAYER_ICONS: Record<AILayer, any> = {
  chip: Cpu, cloud: Cloud, app: AppWindow, robot: Bot, china_ai: Flag,
};

// ── Signal Badge ───────────────────────────────────────────────────────────────
function SignalBadge({ s }: { s: SmallCapSignal }) {
  const cfg = {
    new_position:  { color: '#f43f5e', label: '🆕 新建仓', bg: '#f43f5e15' },
    accumulating:  { color: '#22c55e', label: '📈 持续买入', bg: '#22c55e15' },
    distributing:  { color: '#ef4444', label: '📉 减仓中', bg: '#ef444415' },
    momentum:      { color: '#f59e0b', label: '⚡ Momentum', bg: '#f59e0b15' },
  }[s.signal];
  return (
    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

// ── AI Layer Tab ──────────────────────────────────────────────────────────────
function LayerCard({ stats }: { stats: LayerStats }) {
  const { layer, totalValue, instCount, avgChange, topStock, stocks } = stats;
  const Icon = LAYER_ICONS[layer.layer];
  const changeColor = avgChange >= 0 ? C.green : C.red;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: 18, cursor: 'pointer', transition: 'all 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = layer.color + '50'}
    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${layer.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={layer.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: layer.color, marginBottom: 2 }}>{layer.label}</div>
          <div style={{ fontSize: 10, color: C.text3 }}>{layer.description}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{fmt$(totalValue)}</div>
          <div style={{ fontSize: 11, color: changeColor, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            {avgChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {pct(avgChange)}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ background: '#0d0d0d', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{instCount}</div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>条持仓记录</div>
        </div>
        <div style={{ background: '#0d0d0d', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{stocks}</div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>只股票</div>
        </div>
        <div style={{ background: '#0d0d0d', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: layer.color, fontFamily: 'JetBrains Mono, monospace' }}>{topStock}</div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>重仓股</div>
        </div>
      </div>
    </div>
  );
}

// ── AI Stock Row ───────────────────────────────────────────────────────────────
function AIStockRow({ s, onClick }: { s: AIStockSummary; onClick: () => void }) {
  const marketColor = s.market === 'US' ? C.blue : s.market === 'HK' ? C.yellow : s.market === 'CN' ? C.red : C.text3;
  return (
    <tr onClick={onClick} style={{ cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}
      onMouseEnter={e => (e.currentTarget.style.background = C.cardHover)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{s.ticker}</span>
          <span style={{ fontSize: 11, color: C.text3 }}>{s.name}</span>
        </div>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {s.layers.map(l => {
            const info = AI_LAYERS.find(x => x.layer === l)!;
            return <span key={l} style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${info.color}15`, color: info.color }}>{info.label}</span>;
          })}
          {s.isSmallCap && <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${C.purple}15`, color: C.purple }}>小盘</span>}
        </div>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: `${marketColor}15`, color: marketColor }}>
          {{ US: '🇺🇸 US', HK: '🇭🇰 HK', CN: '🇨🇳 A股' }[s.market] || s.market}
        </span>
      </td>
      <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: C.text }}>
        {fmt$(s.totalValue)}
      </td>
      <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text2 }}>
        {s.instCount}家
      </td>
      <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: s.avgChange >= 0 ? C.green : C.red }}>
        {pct(s.avgChange)}
      </td>
      <td style={{ padding: '10px 12px' }}>
        {s.isNewPosition && <span style={{ color: C.red, fontSize: 11 }}>🆕新建仓</span>}
        {s.accumulating && !s.isNewPosition && <span style={{ color: C.green, fontSize: 11 }}>📈加仓中</span>}
        {!s.accumulating && !s.isNewPosition && <span style={{ color: C.text3, fontSize: 11 }}>持仓</span>}
      </td>
    </tr>
  );
}

// ── 小盘股信号卡片 ─────────────────────────────────────────────────────────────
function SmallCapCard({ signal }: { signal: SmallCapSignal }) {
  const severityColor = { high: C.red, medium: C.yellow, low: C.text3 }[signal.severity];
  const marketColor = { US: C.blue, HK: C.yellow, CN: C.red }[signal.market as 'US' | 'HK' | 'CN'] || C.text3;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{signal.ticker}</span>
            <span style={{ fontSize: 11, color: C.text3 }}>{signal.name}</span>
            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: `${marketColor}15`, color: marketColor, fontWeight: 700 }}>
              {{ US: '🇺🇸US', HK: '🇭🇰HK', CN: '🇨🇳A股' }[signal.market] || signal.market}
            </span>
          </div>
          <div style={{ fontSize: 11, color: C.text2, marginBottom: 6 }}>{signal.description}</div>
          <div style={{ fontSize: 10, color: C.text3 }}>持有机构：{signal.institutions.slice(0, 4).join(', ')}</div>
        </div>
        <SignalBadge s={signal} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: severityColor }} />
          <span style={{ fontSize: 10, color: severityColor, fontWeight: 600 }}>
            {{ high: '⚠️ 高信号', medium: '⚡ 中信号', low: '• 低信号' }[signal.severity]}
          </span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: C.text3, fontFamily: 'JetBrains Mono, monospace' }}>{signal.lastUpdated}</span>
      </div>
    </div>
  );
}

// ── Layer Bar Chart (机构分布) ────────────────────────────────────────────────
function LayerBarChart({ stats }: { stats: LayerStats[] }) {
  const data = stats.map(s => ({
    name: s.layer.label,
    value: s.totalValue / 1e9,
    color: s.layer.color,
    change: s.avgChange,
  })).sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2030" />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => `$${v}B`} />
        <Tooltip
          contentStyle={{ background: '#13141f', border: '1px solid #1e2030', borderRadius: 8, fontSize: 12 }}
          formatter={(val: any) => [`$${Number(val).toFixed(1)}B`, '总市值']}
          labelFormatter={(label: any) => label}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function AIChainPanel() {
  const [view, setView] = useState<'layers' | 'stocks' | 'smallcap'>('layers');
  const [activeLayer, setActiveLayer] = useState<AILayer | null>(null);
  const [signals] = useState(getSmallCapSignals());

  const layerStats = getLayerStats();
  const aiSummary = getAIChainSummary();

  const totalAIValue = aiSummary.reduce((s, x) => s + x.totalValue, 0);
  const newPositionStocks = aiSummary.filter(s => s.isNewPosition);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sub-nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {(['layers', 'stocks', 'smallcap'] as const).map(v => (
          <button key={v} onClick={() => { setView(v); setActiveLayer(null); }}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: view === v ? `${C.blue}20` : 'transparent',
              border: `1px solid ${view === v ? C.blue + '40' : 'transparent'}`,
              color: view === v ? C.blue : C.text3, transition: 'all 0.15s',
            }}>
            {{ layers: '📊 产业链分层', stocks: '🏢 AI持仓明细', smallcap: '🎯 小盘股信号' }[v]}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: C.text3 }}>
          AI持仓总规模 <span style={{ color: C.blue, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{fmt$(totalAIValue)}</span>
          {newPositionStocks.length > 0 && (
            <span style={{ marginLeft: 12, color: C.red, fontWeight: 700 }}>🆕 {newPositionStocks.length}只新建仓</span>
          )}
        </div>
      </div>

      {/* ══ LAYERS VIEW ══════════════════════════════════════════════════════ */}
      {view === 'layers' && (
        <div>
          {/* Layer Bar Chart */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 14 }}>各层总持仓分布（十亿美元）</div>
            <LayerBarChart stats={layerStats} />
          </div>
          {/* Layer Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {layerStats.map(stats => (
              <LayerCard key={stats.layer.layer} stats={stats} />
            ))}
          </div>
        </div>
      )}

      {/* ══ STOCKS VIEW ════════════════════════════════════════════════════ */}
      {view === 'stocks' && (
        <div>
          {activeLayer === null ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>AI产业链 全股票一览</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: C.text3 }}>{aiSummary.length} 只股票</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['股票', '所属层', '市场', '持仓市值', '机构数', '季度变化', '状态'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {aiSummary.map(s => <AIStockRow key={s.ticker} s={s} onClick={() => setActiveLayer(s.layers[0] as AILayer)} />)}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <button onClick={() => setActiveLayer(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', color: C.text3, fontSize: 12, marginBottom: 12 }}>
                ← 返回全部
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {aiSummary.filter(s => s.layers.includes(activeLayer!)).map(s => (
                  <div key={s.ticker} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{s.ticker}</div>
                        <div style={{ fontSize: 12, color: C.text3 }}>{s.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{fmt$(s.totalValue)}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: s.avgChange >= 0 ? C.green : C.red }}>{pct(s.avgChange)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.text3 }}>{s.instCount}家机构持有 · {s.market}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ SMALL CAP VIEW ══════════════════════════════════════════════════ */}
      {view === 'smallcap' && (
        <div>
          {/* 信号概览 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: '🆕 新建仓信号', value: signals.filter(s => s.signal === 'new_position').length, color: C.red },
              { label: '📈 持续买入', value: signals.filter(s => s.signal === 'accumulating').length, color: C.green },
              { label: '⚡ Momentum', value: signals.filter(s => s.signal === 'momentum').length, color: C.yellow },
            ].map(item => (
              <div key={item.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.label}</div>
              </div>
            ))}
          </div>
          {/* 信号列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {signals.map(sig => <SmallCapCard key={sig.ticker} signal={sig} />)}
          </div>
        </div>
      )}
    </div>
  );
}
