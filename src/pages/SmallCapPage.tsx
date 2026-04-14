// @ts-nocheck
/**
 * SmallCapPage — 小盘股追踪详情页
 * 显示：信号列表 → 股票详情 → 机构持仓详情（二跳）
 */
import { useState } from 'react';
import { Star, ArrowLeft, TrendingUp, TrendingDown, Building2 } from 'lucide-react';
import { getSmallCapSignals, SMALL_CAP_TRACKED, type SmallCapSignal } from '../data/aiChain';
import { getAllHoldings, getDataSources } from '../data/realData';
import { institutions } from '../data/mockData';

const C = {
  card: '#141414', cardHover: '#1a1a1a', border: '#1e1e1e',
  text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  green: '#22c55e', red: '#ef4444', yellow: '#f59e0b', purple: '#a78bfa',
};

const fmt$ = (v: number) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v}`;
};

function SourceBadge({ market }: { market: string }) {
  const src = getDataSources().find(s =>
    market === 'HK' ? s.source === 'HKEX' :
    market === 'CN' ? s.source === 'QFII' :
    s.source === 'SEC_EDGAR'
  );
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

// ── Signal Row ────────────────────────────────────────────────────────────────
function SignalCard({ sig, onClick }: { sig: SmallCapSignal; onClick: () => void }) {
  const cfg = {
    new_position:  { color: C.red,    label: '🆕 新建仓',   bg: '#f43f5e15' },
    accumulating:  { color: C.green,  label: '📈 持续买入',  bg: '#22c55e15' },
    distributing:  { color: C.red,   label: '📉 减仓中',    bg: '#ef444415' },
    momentum:      { color: C.yellow, label: '⚡ Momentum',  bg: '#f59e0b15' },
  }[sig.signal];

  const marketColor = { US: C.blue, HK: C.yellow, CN: C.red }[sig.market as 'US' | 'HK' | 'CN'] || C.text3;

  return (
    <div onClick={onClick} style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: 16, cursor: 'pointer', transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color + '40'; e.currentTarget.style.background = C.cardHover; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{sig.ticker}</span>
            <span style={{ fontSize: 13, color: C.text3 }}>{sig.name}</span>
            <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: `${marketColor}15`, color: marketColor }}>
              {{ US: '🇺🇸US', HK: '🇭🇰HK', CN: '🇨🇳A股' }[sig.market] || sig.market}
            </span>
            <SourceBadge market={sig.market} />
          </div>
          <div style={{ fontSize: 12, color: C.text2, marginBottom: 8 }}>{sig.description}</div>
          <div style={{ fontSize: 11, color: C.text3 }}>持有机构：{sig.institutions.slice(0, 4).join('、')}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
            {cfg.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: { high: C.red, medium: C.yellow, low: C.text3 }[sig.severity] }} />
            <span style={{ fontSize: 10, color: C.text3 }}>
              {{ high: '高信号', medium: '中信号', low: '低信号' }[sig.severity]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail View ────────────────────────────────────────────────────────────────
function StockDetail({ ticker, name, onBack }: { ticker: string; name: string; onBack: () => void }) {
  const allHoldings = getAllHoldings();
  const stockHoldings = allHoldings.filter(h => h.stockTicker === ticker);

  return (
    <div>
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
        background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8,
        cursor: 'pointer', color: C.text3, fontSize: 12, marginBottom: 16,
      }}>
        <ArrowLeft size={13} />返回小盘股列表
      </button>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: C.text, marginBottom: 4 }}>{ticker}</div>
            <div style={{ fontSize: 14, color: C.text3 }}>{name}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>
              {fmt$(stockHoldings.reduce((s, h) => s + h.marketValue, 0))}
            </div>
            <div style={{ fontSize: 12, color: C.text3 }}>总持仓市值</div>
          </div>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={13} color={C.purple} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>持有机构</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: C.text3 }}>{stockHoldings.length} 家</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['机构', '持股数量', '持仓市值', '持股比例', '季度变化'].map(h => (
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
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${inst?.color || C.blue}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: inst?.color || C.blue }}>{inst?.name?.[0] || '?'}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{inst?.name || `机构${h.institutionId}`}</div>
                        <div style={{ fontSize: 10, color: C.text3 }}>{inst?.nameEn}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text }}>
                    {(h.shares / 1e6).toFixed(1)}M
                  </td>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SmallCapPage() {
  const [detailTicker, setDetailTicker] = useState<string | null>(null);

  const signals = getSmallCapSignals();
  const newSignals = signals.filter(s => s.signal === 'new_position');
  const accSignals = signals.filter(s => s.signal === 'accumulating');
  const otherSignals = signals.filter(s => s.signal !== 'new_position' && s.signal !== 'accumulating');

  if (detailTicker) {
    const sig = signals.find(s => s.ticker === detailTicker);
    return <StockDetail ticker={detailTicker} name={sig?.name || ''} onBack={() => setDetailTicker(null)} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: '0 0 4px' }}>小盘股追踪</h2>
        <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>监测机构在小市值股票的建仓、加仓、减仓信号，捕捉早期趋势</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: '🆕 新建仓', value: newSignals.length, color: C.red },
          { label: '📈 持续买入', value: accSignals.length, color: C.green },
          { label: '⚡ Momentum', value: signals.filter(s => s.signal === 'momentum').length, color: C.yellow },
          { label: '📊 总追踪', value: signals.length, color: C.purple },
        ].map(item => (
          <div key={item.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Signals list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {signals.map(sig => (
          <SignalCard key={sig.ticker} sig={sig} onClick={() => setDetailTicker(sig.ticker)} />
        ))}
      </div>
    </div>
  );
}
