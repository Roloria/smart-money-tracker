/**
 * InstitutionDetailPage — 机构详情全屏页
 * 从机构 Tab 点击进入，展示完整持仓分析 + 与同类机构对比
 */

import { useMemo, useState } from 'react';
import { ArrowLeft, Globe, TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, Users } from 'lucide-react';
import { institutions as allInstitutions } from '../data/mockData';
import { getAllHoldings } from '../data/realData';

const C = {
  card: '#141414', border: '#1e1e1e', bg: '#0a0a0a',
  text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  blue: '#38bdf8', green: '#22c55e', red: '#ef4444',
  yellow: '#f59e0b', purple: '#a78bfa',
};

const SECTOR_COLORS: Record<string, string> = {
  '科技': '#3b82f6', '消费': '#f59e0b', '金融': '#22c55e',
  '医疗': '#ec4899', '能源': '#f97316', '新能源': '#84cc16',
  'ETF': '#64748b', '工业': '#06b6d4', '通信': '#38bdf8',
  '其他': '#52525b',
};

const FX: Record<string, number> = { USD: 1, HKD: 1/7.78, CNY: 1/7.25 };
function getFx(t: string) {
  if (t.includes('.HK')) return FX.HKD;
  if (/^\d{6}$/.test(t)) return FX.CNY;
  return FX.USD;
}

const SAME_TYPE_COLORS: Record<string, string> = {
  hedge: '#6366f1', bank: '#facc15', asset_manager: '#0ea5e9', sovereign: '#84cc16',
};

interface Props {
  institutionId: number | null;
  onBack: () => void;
}

export default function InstitutionDetailPage({ institutionId, onBack }: Props) {
  const [tab, setTab] = useState<'overview' | 'sectors' | 'peers' | 'changes'>('overview');

  const holdings = getAllHoldings();
  const inst = allInstitutions.find(x => x.id === institutionId);

  const instHoldings = useMemo(() =>
    holdings.filter(h => h.institutionId === institutionId),
    [institutionId, holdings]
  );

  const totalValue = useMemo(() =>
    instHoldings.reduce((s, h) => s + h.marketValue * getFx(h.stockTicker), 0),
    [instHoldings]
  );

  // Sector breakdown
  const sectorData = useMemo(() => {
    const map = new Map<string, number>();
    instHoldings.forEach(h => {
      const s = h.sector || '其他';
      map.set(s, (map.get(s) || 0) + h.marketValue * getFx(h.stockTicker));
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value, pct: totalValue > 0 ? (value / totalValue) * 100 : 0, color: SECTOR_COLORS[name] || '#52525b' }))
      .sort((a, b) => b.value - a.value);
  }, [instHoldings, totalValue]);

  // Top holdings by value
  const topHoldings = useMemo(() =>
    [...instHoldings]
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 15),
    [instHoldings]
  );

  // Peer institutions (same type)
  const peers = useMemo(() =>
    allInstitutions.filter(x => x.type === inst?.type && x.id !== institutionId).slice(0, 4),
    [inst]
  );

  // Overlap with peers
  const peerOverlap = useMemo(() => {
    const instTickers = new Set(instHoldings.map(h => h.stockTicker));
    return peers.map(peer => {
      const peerHoldings = holdings.filter(h => h.institutionId === peer.id);
      const overlapTickers = peerHoldings.filter(h => instTickers.has(h.stockTicker));
      const overlapValue = overlapTickers.reduce((s, h) => s + h.marketValue * getFx(h.stockTicker), 0);
      return { peer, overlapCount: overlapTickers.length, overlapValue, overlapPct: totalValue > 0 ? (overlapValue / totalValue) * 100 : 0 };
    }).filter(x => x.overlapCount > 0);
  }, [peers, instHoldings, holdings, totalValue]);

  if (!inst) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>
        未找到该机构
        <button onClick={onBack} style={{ marginLeft: 16, color: C.blue, background: 'none', border: 'none', cursor: 'pointer' }}>
          返回
        </button>
      </div>
    );
  }

  const typeLabel: Record<string, string> = {
    hedge: '对冲基金', bank: '投资银行', asset_manager: '资产管理', sovereign: '主权基金',
  };

  return (
    <div style={{ padding: '24px 0', maxWidth: 1100 }}>
      {/* Back */}
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer',
        color: C.text3, fontSize: 13, marginBottom: 20,
        padding: '6px 0',
      }}>
        <ArrowLeft size={14} /> 返回机构列表
      </button>

      {/* Header */}
      <div style={{
        background: C.card, border: `1px solid ${inst.color}30`,
        borderRadius: 16, padding: '24px 28px', marginBottom: 20,
        display: 'flex', alignItems: 'flex-start', gap: 20,
      }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: `${inst.color}20`,
          border: `2px solid ${inst.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 900, color: inst.color,
          fontFamily: 'JetBrains Mono, monospace', flexShrink: 0,
        }}>
          {inst.name[0]}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>{inst.name}</h2>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: `${SAME_TYPE_COLORS[inst.type]}20`,
              color: SAME_TYPE_COLORS[inst.type],
              border: `1px solid ${SAME_TYPE_COLORS[inst.type]}40`,
            }}>
              {typeLabel[inst.type] || inst.type}
            </span>
          </div>
          <div style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>{inst.nameEn} · {inst.country}</div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: '披露持仓', value: `$${(totalValue / 1e9).toFixed(1)}B`, color: C.blue },
              { label: '持股数量', value: `${instHoldings.length}只`, color: C.yellow },
              { label: '覆盖市场', value: instHoldings.filter(h => h.stockTicker.includes('.HK')).length > 0 ? '美国+港股+A' : '美国为主', color: C.purple },
              { label: '本季增持', value: `${instHoldings.filter(h => h.changePercent > 0).length}只`, color: C.green },
              { label: '本季减持', value: `${instHoldings.filter(h => h.changePercent < 0).length}只`, color: C.red },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: C.text3, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { key: 'overview', label: '持仓概览', Icon: BarChart3 },
          { key: 'sectors', label: '行业分布', Icon: PieIcon },
          { key: 'peers', label: '同类对比', Icon: Users },
          { key: 'changes', label: '本季异动', Icon: TrendingUp },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key as any)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10, border: 'none',
            background: tab === key ? `${C.blue}20` : 'transparent',
            color: tab === key ? C.blue : C.text3,
            fontWeight: tab === key ? 700 : 400, fontSize: 13, cursor: 'pointer',
          }}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: '#0d0d0d', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.text3 }}>
              TOP 15 持仓（按市值排序）
            </div>
            {topHoldings.map((h, idx) => {
              const fx = getFx(h.stockTicker);
              const valUsd = h.marketValue * fx;
              const pct = totalValue > 0 ? (valUsd / totalValue) * 100 : 0;
              const market = h.market === 'HK' ? '🇭🇰' : h.market === 'CN' ? '🇨🇳' : '🇺🇸';
              return (
                <div key={h.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px',
                  borderBottom: idx < topHoldings.length - 1 ? `1px solid ${C.border}` : 'none',
                  background: idx % 2 === 0 ? 'transparent' : '#0d0d0d10',
                }}>
                  <div style={{ width: 24, fontSize: 11, fontWeight: 700, color: idx < 3 ? C.yellow : C.text3, textAlign: 'center' }}>{idx + 1}</div>
                  <div style={{ width: 80 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{h.stockTicker}</span>
                    <span style={{ marginLeft: 4, fontSize: 11 }}>{market}</span>
                  </div>
                  <div style={{ flex: 1 }}><span style={{ fontSize: 12, color: C.text3 }}>{h.stockName}</span></div>
                  <div style={{ width: 80, textAlign: 'right', fontSize: 12, color: C.text3 }}>{h.shares.toLocaleString()}股</div>
                  <div style={{ width: 60, textAlign: 'right', fontSize: 12, fontWeight: 700, color: h.changePercent >= 0 ? C.green : C.red }}>
                    {h.changePercent >= 0 ? '+' : ''}{h.changePercent.toFixed(1)}%
                  </div>
                  <div style={{ width: 120 }}>
                    <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${Math.max(pct, 0.5)}%`, background: inst.color }} />
                    </div>
                  </div>
                  <div style={{ width: 80, textAlign: 'right', fontSize: 13, fontWeight: 800, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                    ${(valUsd / 1e9).toFixed(2)}B
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Sectors */}
      {tab === 'sectors' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Pie */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text3, marginBottom: 16 }}>行业占比</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sectorData.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>
                        ${(s.value / 1e9).toFixed(2)}B · {s.pct.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${s.pct}%`, background: s.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Changes */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text3, marginBottom: 16 }}>本季增减持 TOP 5</div>
            {[...instHoldings].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5).map((h, idx) => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: idx < 4 ? `1px solid ${C.border}` : 'none',
              }}>
                {h.changePercent >= 0 ? <TrendingUp size={13} color={C.green} /> : <TrendingDown size={13} color={C.red} />}
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{h.stockTicker}</span>
                  <span style={{ fontSize: 11, color: C.text3, marginLeft: 6 }}>{h.stockName}</span>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 800,
                  color: h.changePercent >= 0 ? C.green : C.red,
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {h.changePercent >= 0 ? '+' : ''}{h.changePercent.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Peers */}
      {tab === 'peers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {peerOverlap.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>
              暂无同类机构持仓重叠数据
            </div>
          )}
          {peerOverlap.map(({ peer, overlapCount, overlapPct }) => (
            <div key={peer.id} style={{
              background: C.card, border: `1px solid ${peer.color}30`,
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${peer.color}20`, border: `1px solid ${peer.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, color: peer.color,
              }}>
                {peer.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{peer.name}</div>
                <div style={{ fontSize: 12, color: C.text3 }}>与 {inst.name} 共同持有 {overlapCount} 只股票</div>
                <div style={{ height: 4, background: C.border, borderRadius: 2, marginTop: 8 }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${overlapPct}%`, background: peer.color }} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: peer.color, fontFamily: 'JetBrains Mono, monospace' }}>{overlapPct.toFixed(1)}%</div>
                <div style={{ fontSize: 10, color: C.text3 }}>持仓重叠</div>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
            同类机构：{typeLabel[inst.type] || inst.type} · 共 {allInstitutions.filter(x => x.type === inst.type).length} 家
          </div>
        </div>
      )}

      {/* Tab: Changes */}
      {tab === 'changes' && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: '#0d0d0d', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.text3 }}>
            本季全部 {instHoldings.length} 只持仓变动
          </div>
          {[...instHoldings].sort((a, b) => b.changePercent - a.changePercent).map((h, idx) => {
            const isNew = h.changePercent > 20;
            const isCut = h.changePercent < -15;
            return (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px',
                borderBottom: idx < instHoldings.length - 1 ? `1px solid ${C.border}` : 'none',
                background: isNew ? `${C.green}08` : isCut ? `${C.red}08` : 'transparent',
              }}>
                <div style={{ width: 24, fontSize: 11, color: C.text3 }}>{idx + 1}</div>
                <div style={{ width: 80 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{h.stockTicker}</span>
                </div>
                <div style={{ flex: 1 }}><span style={{ fontSize: 12, color: C.text3 }}>{h.stockName}</span></div>
                <div style={{ width: 80, textAlign: 'right', fontSize: 11, color: C.text3 }}>
                  {h.shares.toLocaleString()}股
                </div>
                <div style={{ width: 80, textAlign: 'right', fontSize: 12, color: C.text3 }}>
                  → {(h.shares * (1 + h.changePercent / 100)).toLocaleString()}股
                </div>
                <div style={{ width: 80, textAlign: 'right', fontSize: 13, fontWeight: 800, color: h.changePercent >= 0 ? C.green : C.red }}>
                  {h.changePercent >= 0 ? '+' : ''}{h.changePercent.toFixed(1)}%
                  {isNew ? ' 🆕' : isCut ? ' 🔻' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Page footer */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8,marginTop:20,padding:'0 4px'}}>
        <span style={{fontSize:10,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>数据来源</span>
        <span style={{fontSize:10,color:'#38bdf8',fontFamily:'JetBrains Mono,monospace',fontWeight:600}}>SEC EDGAR 13F · 港交所披露易 · 东方财富 QFII</span>
        <span style={{fontSize:10,color:'#3f3f46'}}>|</span>
        <span style={{fontSize:10,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>2026 Q1</span>
      </div>
    </div>
  );
}
