// @ts-nocheck
/**
 * SmallCapPage — 小盘股追踪详情页
 * Phase 6: 小盘股建仓/加仓信号 + 机构持仓详情
 */
import { useState } from 'react';
import { Star, TrendingUp, TrendingDown, Clock, Building2, ExternalLink } from 'lucide-react';
// recharts dynamically imported (see dynamic import pattern in SmartMoney.tsx)
import { getSmallCapSignals, SMALL_CAP_TRACKED } from '../data/aiChain';
import { getAllHoldings, getDataSources } from '../data/realData';
import type { Holding } from '../types';

const C = {
  card: '#141414', cardHover: '#1a1a1a', border: '#1e1e1e',
  text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  green: '#22c55e', red: '#ef4444', yellow: '#f59e0b', purple: '#a78bfa', blue: '#38bdf8',
};

const fmt$ = (v: number) => {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v}`;
};
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

function SourceTag({ source }: { source: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    HKEX: { color: C.yellow, label: '港交所' },
    EASTMONEY_QFII: { color: C.green, label: 'QFII' },
    SEC_EDGAR: { color: C.blue, label: 'SEC 13F' },
    TUSHARE_HSGT: { color: C.purple, label: 'Tushare' },
    MOCK: { color: C.red, label: '模拟数据' },
  };
  const c = cfg[source] || { color: C.text3, label: source };
  return (
    <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30` }}>
      {c.label}
    </span>
  );
}

const SIGNAL_ORDER = { new_position: 0, accumulating: 1, momentum: 2, distributing: 3 };

function SignalRow({ sig, onClick }: { sig: ReturnType<typeof getSmallCapSignals>[0]; onClick: () => void }) {
  const sigColor = sig.signal === 'new_position' ? C.red : sig.signal === 'accumulating' ? C.green : sig.signal === 'momentum' ? C.yellow : C.text3;
  const marketColor = { US: C.blue, HK: C.yellow, CN: C.red }[sig.market as 'US' | 'HK' | 'CN'] || C.text3;
  const holdings = getAllHoldings().filter(h => h.stockTicker === sig.ticker);

  return (
    <div
      onClick={onClick}
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = sigColor + '40'; e.currentTarget.style.background = C.cardHover; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* 股票信息 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{sig.ticker}</span>
            <span style={{ fontSize: 12, color: C.text3 }}>{sig.name}</span>
            <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: `${marketColor}15`, color: marketColor }}>
              {{ US: '🇺🇸US', HK: '🇭🇰HK', CN: '🇨🇳A股' }[sig.market] || sig.market}
            </span>
            <SourceTag source={(holdings[0] as any)?._dataSource || 'MOCK'} />
          </div>
          <div style={{ fontSize: 12, color: C.text2, marginBottom: 8, lineHeight: 1.5 }}>{sig.description}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {sig.institutions.map(inst => (
              <span key={inst} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 10, color: C.text3 }}>
                <Building2 size={9} />{inst}
              </span>
            ))}
          </div>
        </div>

        {/* 信号 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, background: `${sigColor}15`, color: sigColor, border: `1px solid ${sigColor}30` }}>
            {sig.signal === 'new_position' ? '🆕 新建仓' : sig.signal === 'accumulating' ? '📈 持续买入' : sig.signal === 'momentum' ? '⚡ Momentum' : '📉 减仓中'}
          </span>
          <span style={{ fontSize: 11, color: C.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} />{sig.lastUpdated}
          </span>
        </div>
      </div>

      {/* 持仓统计条 */}
      {holdings.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          {[
            { label: '持仓市值', value: fmt$(holdings.reduce((s, h) => s + h.marketValue, 0)) },
            { label: '机构数', value: `${[...new Set(holdings.map(h => h.institutionId))].length}家` },
            { label: '平均变化', value: pct(holdings.reduce((s, h) => s + h.changePercent, 0) / holdings.length) },
          ].map(item => (
            <div key={item.label} style={{ flex: 1, textAlign: 'center', background: '#0d0d0d', borderRadius: 6, padding: '6px 8px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{item.value}</div>
              <div style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 二跳：个股详情
function StockDetailPanel({ ticker }: { ticker: string }) {
  const holdings = getAllHoldings().filter(h => h.stockTicker === ticker);
  const meta = SMALL_CAP_TRACKED.find(s => s.ticker === ticker);
  const signals = getSmallCapSignals().filter(s => s.ticker === ticker);

  if (holdings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>暂无持仓数据</div>
        <div style={{ fontSize: 13 }}>该股票暂无机构持仓记录</div>
      </div>
    );
  }

  const totalValue = holdings.reduce((s, h) => s + h.marketValue, 0);
  const avgChange = holdings.reduce((s, h) => s + h.changePercent, 0) / holdings.length;
  const marketColor = { US: C.blue, HK: C.yellow, CN: C.red }[(holdings[0] as any).market as 'US' | 'HK' | 'CN'] || C.text3;
  const src = getDataSources().find(s => s.source === (holdings[0] as any)._dataSource) || getDataSources()[getDataSources().length - 1];

  return (
    <div>
      <button
        onClick={() => history.back()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', color: C.text3, fontSize: 12, marginBottom: 16 }}
      >
        ← 返回小盘股
      </button>

      {/* 概览 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{ticker}</span>
              <span style={{ fontSize: 15, color: C.text3 }}>{meta?.name || holdings[0].stockName}</span>
              <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: marketColor }}>
                {String(holdings[0].market)}
              </span>
              <SourceTag source={(holdings[0] as any)._dataSource || 'MOCK'} />
            </div>
            <div style={{ fontSize: 12, color: C.text3, marginBottom: 4 }}>{meta?.notes}</div>
            <div style={{ fontSize: 11, color: C.text3 }}>市值：{meta?.marketCap}亿美元</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{fmt$(totalValue)}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: avgChange >= 0 ? C.green : C.red, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
              {avgChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {pct(avgChange)}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: '总持仓市值', value: fmt$(totalValue) },
            { label: '持有机构', value: `${[...new Set(holdings.map(h => h.institutionId))].length}家` },
            { label: '持股总量', value: holdings.reduce((s, h) => s + h.shares, 0).toLocaleString() },
            { label: '信号状态', value: signals[0]?.signal === 'new_position' ? '🆕新建仓' : signals[0]?.signal === 'accumulating' ? '📈加仓中' : signals[0]?.signal || '—', color: signals[0]?.signal === 'new_position' ? C.red : C.green },
          ].map(item => (
            <div key={item.label} style={{ background: '#0d0d0d', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: (item as any).color || C.text }}>{item.value}</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 机构持仓明细 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={14} color={C.text3} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>机构持仓明细</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: C.text3 }}>数据来源：{src.label} · {src.lastUpdated}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['机构名称', '持仓市值', '持股数量', '持股比例', '季度变化', '变化类型'].map(h => (
                <th key={h} style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map(h => (
              <tr key={h.id} style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => (e.currentTarget.style.background = C.cardHover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px', fontSize: 12, color: C.text }}>机构{h.institutionId}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: C.text }}>{fmt$(h.marketValue)}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text2 }}>{h.shares.toLocaleString()}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text2 }}>{h.ownershipPercent.toFixed(2)}%</td>
                <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: h.changePercent >= 0 ? C.green : C.red }}>{pct(h.changePercent)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: h.changePercent > 0 ? `${C.green}15` : h.changePercent < 0 ? `${C.red}15` : `${C.yellow}15`, color: h.changePercent > 0 ? C.green : h.changePercent < 0 ? C.red : C.yellow }}>
                    {h.changePercent > 0 ? '增持' : h.changePercent < 0 ? '减持' : '持平'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 机构异动历史 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>季度异动历史</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 0.8, -0.5, 0.3].map((change, i) => (
            <div key={i} style={{ flex: 1, background: '#0d0d0d', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: change >= 0 ? C.green : C.red }}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </div>
              <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>Q{4 - i + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SmallCapPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const signals = getSmallCapSignals();
  const newSignals = signals.filter(s => s.signal === 'new_position');
  const accSignals = signals.filter(s => s.signal === 'accumulating');

  if (selected) return (
    <div style={{ padding: '0 4px' }}>
      <StockDetailPanel ticker={selected} />
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fafafa', margin: 0 }}>小盘股追踪</h1>
        <p style={{ fontSize: 13, color: '#71717a', margin: '4px 0 0' }}>
          专注小市值股票建仓信号 · {newSignals.length}只新建仓 · {accSignals.length}只持续买入
        </p>
      </div>

      {/* 信号概览 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: '🆕 新建仓', value: newSignals.length, color: C.red, sub: '机构首次买入' },
          { label: '📈 持续买入', value: accSignals.length, color: C.green, sub: '连续增持中' },
          { label: '⚡ Momentum', value: signals.filter(s => s.signal === 'momentum').length, color: C.yellow, sub: '强劲动量' },
        ].map(item => (
          <div key={item.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 4 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* 数据来源 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '10px 14px', background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {getDataSources().filter(s => s.isRealData).map(s => (
          <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: `${s.color}12`, border: `1px solid ${s.color}25`, fontSize: 11 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.freshness === 'live' ? C.green : s.freshness === 'recent' ? C.yellow : C.text3 }} />
            <span style={{ fontWeight: 700, color: s.color }}>{s.labelShort}</span>
            <span style={{ color: C.text3 }}>{s.lastUpdated}</span>
          </div>
        ))}
      </div>

      {/* 信号列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {signals.map(sig => (
          <SignalRow key={sig.ticker} sig={sig} onClick={() => setSelected(sig.ticker)} />
        ))}
      </div>
    </div>
  );
}
