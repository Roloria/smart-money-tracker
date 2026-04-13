import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Filter } from 'lucide-react';
import { institutions, formatNumber, typeLabels, typeColors } from '../data/mockData';
import { holdings } from '../data/mockData';

const filters = ['全部', '对冲基金', '主权基金', '资产管理', '银行'];
const filterMap: Record<string, string | undefined> = {
  '全部': undefined,
  '对冲基金': 'hedge',
  '主权基金': 'sovereign',
  '资产管理': 'asset_manager',
  '银行': 'bank',
};

export default function Institutions() {
  const [activeFilter, setActiveFilter] = useState('全部');
  const typeKey = filterMap[activeFilter];
  const filtered = typeKey ? institutions.filter(i => i.type === typeKey) : institutions;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fafafa', margin: 0 }}>机构列表</h1>
        <p style={{ fontSize: 14, color: '#71717a', margin: '4px 0 0' }}>浏览所有追踪的机构及其最新持仓</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <Filter size={14} color="#71717a" />
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`tag-filter ${activeFilter === f ? 'active' : ''}`}
          >
            {f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#52525b', fontFamily: 'JetBrains Mono, monospace' }}>
          {filtered.length} / {institutions.length}
        </span>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map(inst => {
          const instHoldings = holdings.filter(h => h.institutionId === inst.id);
          const totalVal = instHoldings.reduce((s, h) => s + h.marketValue, 0);
          const gains = instHoldings.filter(h => h.changePercent > 0).length;
          const losses = instHoldings.filter(h => h.changePercent < 0).length;
          return (
            <Link to={`/institutions/${inst.id}`} key={inst.id} style={{ textDecoration: 'none' }}>
              <div className="card-base" style={{ padding: 20, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${inst.color}22`, border: `1px solid ${inst.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: inst.color, fontFamily: 'JetBrains Mono, monospace' }}>{inst.name[0]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', marginBottom: 2 }}>{inst.name}</div>
                    <div style={{ fontSize: 12, color: '#71717a', marginBottom: 6 }}>{inst.nameEn}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Globe size={11} color="#52525b" />
                      <span style={{ fontSize: 11, color: '#52525b' }}>{inst.country}</span>
                      <span style={{ width: 1, height: 10, background: '#333', margin: '0 2px' }} />
                      <span style={{ fontSize: 11, color: typeColors[inst.type], background: typeColors[inst.type] + '18', padding: '1px 6px', borderRadius: 9999, border: `1px solid ${typeColors[inst.type]}33` }}>
                        {typeLabels[inst.type]}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: '#0f0f0f', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#52525b', marginBottom: 2 }}>持仓市值</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#fafafa' }}>{formatNumber(inst.totalValue)}</div>
                  </div>
                  <div style={{ background: '#0f0f0f', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#52525b', marginBottom: 2 }}>持股数</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#fafafa' }}>{inst.holdingCount}</div>
                  </div>
                  <div style={{ background: '#0f0f0f', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#52525b', marginBottom: 2 }}>本季异动</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                      <span style={{ color: '#22c55e' }}>↑{gains}</span>
                      <span style={{ color: '#3f3f46', margin: '0 2px' }}>/</span>
                      <span style={{ color: '#ef4444' }}>↓{losses}</span>
                    </div>
                  </div>
                </div>

                {/* Top holdings preview */}
                <div style={{ fontSize: 11, color: '#52525b', marginBottom: 4 }}>重仓股</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {instHoldings.slice(0, 4).map(h => (
                    <div key={h.id} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#a1a1aa' }}>
                      {h.stockTicker}
                      <span style={{ color: h.changePercent > 0 ? '#22c55e' : h.changePercent < 0 ? '#ef4444' : '#71717a', marginLeft: 4 }}>
                        {h.changePercent > 0 ? '↑' : '↓'}{Math.abs(h.changePercent).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
