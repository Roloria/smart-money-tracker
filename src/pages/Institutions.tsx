import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Filter, Clock } from 'lucide-react';
import { institutions, formatNumber, typeLabels, typeColors } from '../data/mockData';
import { holdings as mockHoldings } from '../data/mockData';
import { getAllHoldings } from '../data/realData';
import { getInstitutionSourceInfo } from '../data/realData';

const C = {
  green: '#22c55e', yellow: '#f59e0b', red: '#ef4444',
  text3: '#52525b', text2: '#a1a1aa', border: '#1e1e1e',
};

const filters = ['全部', '对冲基金', '主权基金', '资产管理', '银行'];
const filterMap: Record<string, string | undefined> = {
  '全部': undefined,
  '对冲基金': 'hedge',
  '主权基金': 'sovereign',
  '资产管理': 'asset_manager',
  '银行': 'bank',
};

// Merge mock holdings + real holdings from realData.ts
const ALL_HOLDINGS = getAllHoldings();

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
          // Use ALL_HOLDINGS (merged mock + real) so institutions with real data show correct holdings
          const instHoldings = ALL_HOLDINGS.filter((h: any) => h.institutionId === inst.id);
          const totalVal = instHoldings.reduce((s: number, h: any) => s + h.marketValue, 0);
          const gains = instHoldings.filter((h: any) => h.changePercent > 0).length;
          const losses = instHoldings.filter((h: any) => h.changePercent < 0).length;
          const srcInfo = getInstitutionSourceInfo(inst.id);
          const freshnessColor = srcInfo.freshness === 'live' ? C.green : srcInfo.freshness === 'recent' ? C.yellow : C.text3;

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
                      <span style={{ fontSize: 11, color: '#71717a' }}>{inst.country}</span>
                      <span style={{ width: 1, height: 10, background: '#333', margin: '0 2px' }} />
                      <span style={{ fontSize: 11, color: typeColors[inst.type], background: typeColors[inst.type] + '18', padding: '1px 6px', borderRadius: 9999, border: `1px solid ${typeColors[inst.type]}33` }}>
                        {typeLabels[inst.type]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 数据来源标签 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '6px 10px', background: '#0d0d0d', borderRadius: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: freshnessColor, flexShrink: 0, boxShadow: `0 0 5px ${freshnessColor}` }} />
                  <Clock size={10} color={C.text3} />
                  <span style={{ fontSize: 10, color: '#71717a' }}>
                    数据来源: <span style={{ fontWeight: 700, color: srcInfo.freshness === 'live' ? '#38bdf8' : srcInfo.freshness === 'recent' ? C.yellow : C.text3 }}>{srcInfo.source === 'SEC_EDGAR' ? 'SEC EDGAR 13F' : srcInfo.source === 'HKEX' ? '港交所披露易' : srcInfo.source === 'EASTMONEY_QFII' ? '东方财富 QFII' : '东方财富 QFII'}</span>
                  </span>
                  <span style={{ width: 1, height: 10, background: '#333', margin: '0 2px' }} />
                  <span style={{ fontSize: 10, color: C.text3, fontFamily: 'JetBrains Mono, monospace' }}>{srcInfo.lastUpdated}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 9, padding: '1px 6px', borderRadius: 4, background: freshnessColor + '18', color: freshnessColor, fontWeight: 700 }}>
                    {srcInfo.freshness === 'live' ? '实时' : srcInfo.freshness === 'recent' ? '近期' : '历史'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: '#0f0f0f', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#52525b', marginBottom: 2 }}>持仓市值</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#fafafa' }}>{formatNumber(totalVal || inst.totalValue)}</div>
                  </div>
                  <div style={{ background: '#0f0f0f', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#52525b', marginBottom: 2 }}>持股数</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#fafafa' }}>{instHoldings.length || inst.holdingCount}</div>
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
                  {instHoldings.slice(0, 4).map((h: any) => (
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
