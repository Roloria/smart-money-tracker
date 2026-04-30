import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Sparkles, XCircle, Filter, BarChart3, RefreshCw } from 'lucide-react';
import { institutions, formatNumber, formatPercent, formatShares, holdings } from '../data/mockData';
import { getAllChanges, getLastUpdated, getDataAgeLabel } from '../data/realData';

const typeFilters = [
  { label: '全部', value: 'all', icon: null },
  { label: '增持 ↑', value: 'increase', icon: TrendingUp },
  { label: '减持 ↓', value: 'decrease', icon: TrendingDown },
  { label: '新建仓', value: 'new', icon: Sparkles },
  { label: '清仓', value: 'exited', icon: XCircle },
];

// Derive sectors and markets dynamically from holdings data
const SECTORS = [...new Set(holdings.map(h => h.sector))].sort();
const MARKETS = [
  { label: '全部市场', value: 'all' },
  { label: '🇺🇸 美股', value: 'US' },
  { label: '🇭🇰 港股', value: 'HK' },
  { label: '🇨🇳 A股', value: 'CN' },
];

// Build ticker -> sector & market lookup from holdings
const TICKER_SECTOR: Record<string, string> = {};
const TICKER_MARKET: Record<string, string> = {};
holdings.forEach(h => {
  if (!TICKER_SECTOR[h.stockTicker]) TICKER_SECTOR[h.stockTicker] = h.sector;
  if (!TICKER_MARKET[h.stockTicker]) TICKER_MARKET[h.stockTicker] = h.market || 'US';
});

export default function Changes() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [instFilter, setInstFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');

  // Use realData (includes HK + CN changes from SEC EDGAR / HKEX / QFII)
  const allChanges = getAllChanges();
  const filtered = allChanges.filter(c => {
    if (typeFilter !== 'all' && c.changeType !== typeFilter) return false;
    if (instFilter !== 'all' && c.institutionId !== Number(instFilter)) return false;
    if (sectorFilter !== 'all' && TICKER_SECTOR[c.stockTicker] !== sectorFilter) return false;
    if (marketFilter !== 'all' && TICKER_MARKET[c.stockTicker] !== marketFilter) return false;
    return true;
  }).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  const chartData = filtered.slice(0, 8).map(c => ({
    name: c.stockTicker,
    value: c.changePercent,
    type: c.changeType,
  }));

  return (
    <div>
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:24,fontWeight:700,color:'#fafafa',margin:0}}>持仓异动</h1>
        <p style={{fontSize:14,color:'#71717a',margin:'4px 0 0'}}>追踪机构季度持仓大幅变化，发现聪明钱动向</p>
      </div>

      {/* Filters */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {/* Type filters */}
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <Filter size={13} color="#52525b" />
          <span style={{fontSize:11,color:'#52525b'}}>类型：</span>
          {typeFilters.map(f => {
            const Icon = f.icon;
            return (
              <button key={f.value} onClick={() => setTypeFilter(f.value)} className={`tag-filter ${typeFilter===f.value?'active':''}`} style={{display:'flex',alignItems:'center',gap:3,padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',transition:'all 0.15s',
                background: typeFilter===f.value ? 'rgba(56,189,248,0.12)' : 'transparent',
                border: `1px solid ${typeFilter===f.value ? 'rgba(56,189,248,0.35)' : '#1e1e1e'}`,
                color: typeFilter===f.value ? '#38bdf8' : '#71717a',
              }}>
                {Icon && <Icon size={10} />} {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary filters row */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24,flexWrap:'wrap'}}>
        {/* Sector filter */}
        <select className="input-base" style={{padding:'6px 10px',fontSize:12,background:'#141414',border:'1px solid #1e1e1e',color:'#a1a1aa',borderRadius:8,cursor:'pointer'}}
          value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
          <option value="all">全部板块</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Market filter */}
        <select className="input-base" style={{padding:'6px 10px',fontSize:12,background:'#141414',border:'1px solid #1e1e1e',color:'#a1a1aa',borderRadius:8,cursor:'pointer'}}
          value={marketFilter} onChange={e => setMarketFilter(e.target.value)}>
          {MARKETS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        {/* Institution filter */}
        <select className="input-base" style={{padding:'6px 10px',fontSize:12,background:'#141414',border:'1px solid #1e1e1e',color:'#a1a1aa',borderRadius:8,cursor:'pointer'}}
          value={instFilter} onChange={e => setInstFilter(e.target.value)}>
          <option value="all">全部机构</option>
          {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>

        <span style={{marginLeft:'auto',fontSize:12,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>{filtered.length} 条记录</span>
      </div>

      {/* Summary stats bar */}
      {filtered.length > 0 && (
        <div style={{display:'flex',gap:16,marginBottom:20,padding:'10px 16px',background:'#0d0d0d',borderRadius:10,border:'1px solid #1e1e1e'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <TrendingUp size={13} color="#22c55e" />
            <span style={{fontSize:11,color:'#71717a'}}>增持</span>
            <span style={{fontSize:13,fontWeight:700,color:'#22c55e',fontFamily:'JetBrains Mono,monospace'}}>{filtered.filter(c=>c.changeType==='increase'||c.changeType==='new').length}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <TrendingDown size={13} color="#ef4444" />
            <span style={{fontSize:11,color:'#71717a'}}>减持</span>
            <span style={{fontSize:13,fontWeight:700,color:'#ef4444',fontFamily:'JetBrains Mono,monospace'}}>{filtered.filter(c=>c.changeType==='decrease'||c.changeType==='exited').length}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <BarChart3 size={13} color="#38bdf8" />
            <span style={{fontSize:11,color:'#71717a'}}>平均幅度</span>
            <span style={{fontSize:13,fontWeight:700,color:'#38bdf8',fontFamily:'JetBrains Mono,monospace'}}>
              {filtered.length > 0 ? (filtered.reduce((s,c) => s + Math.abs(c.changePercent), 0) / filtered.length).toFixed(1) : '0'}%
            </span>
          </div>
        </div>
      )}

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="card-base" style={{padding:20,marginBottom:24}}>
          <div style={{fontSize:14,fontWeight:600,color:'#fafafa',marginBottom:16}}>异动幅度对比（Top 8）</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{top:0,right:0,bottom:0,left:-10}} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize:11,fill:'#71717a',fontFamily:'JetBrains Mono'}} />
              <YAxis tick={{fontSize:10,fill:'#52525b',fontFamily:'JetBrains Mono'}} tickFormatter={v=>`${v}%`} width={50} />
              <Tooltip formatter={(v)=>[`${Number(v) > 0 ? '+' : ''}${Number(v).toFixed(1)}%`, '变化幅度']} contentStyle={{background:'#141414',border:'1px solid #262626',borderRadius:6,fontSize:12,color:'#fafafa'}} />
              <Bar dataKey="value" radius={[3,3,0,0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.value > 0 ? '#22c55e' : entry.type === 'new' ? '#f59e0b' : entry.type === 'exited' ? '#71768b' : '#ef4444'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="card-base" style={{overflow:'hidden'}}>
        <table className="table-base">
          <thead>
            <tr>
              <th>股票</th>
              <th>机构</th>
              <th>板块</th>
              <th>类型</th>
              <th style={{textAlign:'right'}}>变化幅度</th>
              <th style={{textAlign:'right'}}>上季持股</th>
              <th style={{textAlign:'right'}}>本季持股</th>
              <th>季度</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const inst = institutions.find(i => i.id === c.institutionId)!;
              const badgeClass = c.changeType==='increase'?'badge-gain':c.changeType==='decrease'?'badge-loss':c.changeType==='new'?'badge-new':'badge-exit';
              const typeLabel = c.changeType==='increase'?'增持':c.changeType==='decrease'?'减持':c.changeType==='new'?'新建仓':'清仓';
              const marketBadge = {US:'🇺🇸 US',HK:'🇭🇰 HK',CN:'🇨🇳 A股'}[TICKER_MARKET[c.stockTicker]] || TICKER_MARKET[c.stockTicker];
              const marketColor = {US:'#38bdf8',HK:'#f59e0b',CN:'#ef4444'}[TICKER_MARKET[c.stockTicker]] || '#71717a';
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:'#fafafa'}}>{c.stockTicker}</div>
                    <div style={{fontSize:12,color:'#71717a'}}>{c.stockName}</div>
                  </td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:20,height:20,borderRadius:4,background:`${inst.color}22`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <span style={{fontSize:10,fontWeight:700,color:inst.color}}>{inst.name[0]}</span>
                      </div>
                      <span style={{fontSize:13,color:'#a1a1aa'}}>{inst.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:11,padding:'2px 7px',borderRadius:5,background:'rgba(56,189,248,0.08)',color:'#38bdf8',fontWeight:600,whiteSpace:'nowrap'}}>{TICKER_SECTOR[c.stockTicker] || '其他'}</span>
                      <span style={{fontSize:10,padding:'2px 6px',borderRadius:5,background:`${marketColor}15`,color:marketColor,fontWeight:700}}>{marketBadge}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${badgeClass}`}>{typeLabel}</span></td>
                  <td style={{textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:c.changePercent>0?'#22c55e':'#ef4444',fontSize:14}}>
                    {formatPercent(c.changePercent)}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#71717a'}}>{formatShares(c.previousShares)}</td>
                  <td style={{textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#a1a1aa'}}>{formatShares(c.currentShares)}</td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#52525b'}}>{c.quarter}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 0',color:'#52525b',fontSize:14}}>暂无符合条件的异动记录</div>
        )}
      </div>

      {/* Footer: data source info */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8,marginTop:16,padding:'0 4px'}}>
        <span style={{fontSize:10,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>共</span>
        <span style={{fontSize:10,color:'#f59e0b',fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>{allChanges.length}</span>
        <span style={{fontSize:10,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>条异动记录</span>
        <span style={{fontSize:10,color:'#3f3f46'}}>·</span>
        <span style={{fontSize:10,color:'#38bdf8',fontFamily:'JetBrains Mono,monospace',fontWeight:600}}>SEC EDGAR 13F · 东方财富 QFII · 港交所披露易</span>
        <span style={{fontSize:10,color:'#3f3f46'}}>|</span>
        <span style={{fontSize:10,color:'#71717a',fontFamily:'JetBrains Mono,monospace'}}>数据截至 {getLastUpdated()}（{getDataAgeLabel()}）</span>
      </div>
    </div>
  );
}
