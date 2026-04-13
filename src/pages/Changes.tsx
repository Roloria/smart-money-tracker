import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Sparkles, XCircle, Filter } from 'lucide-react';
import { holdingChanges, institutions, formatNumber, formatPercent, formatShares } from '../data/mockData';

const typeFilters = [
  { label: '全部', value: 'all', icon: null },
  { label: '增持 ↑20%+', value: 'increase', icon: TrendingUp },
  { label: '减持 ↓20%+', value: 'decrease', icon: TrendingDown },
  { label: '新建仓', value: 'new', icon: Sparkles },
  { label: '清仓', value: 'exited', icon: XCircle },
];

export default function Changes() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [instFilter, setInstFilter] = useState('all');

  const filtered = holdingChanges.filter(c => {
    if (typeFilter !== 'all' && c.changeType !== typeFilter) return false;
    if (instFilter !== 'all' && c.institutionId !== Number(instFilter)) return false;
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
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <Filter size={14} color="#71717a" />
          <span style={{fontSize:12,color:'#52525b'}}>类型：</span>
          {typeFilters.map(f => {
            const Icon = f.icon;
            return (
              <button key={f.value} onClick={() => setTypeFilter(f.value)} className={`tag-filter ${typeFilter===f.value?'active':''}`} style={{display:'flex',alignItems:'center',gap:4}}>
                {Icon && <Icon size={11} />} {f.label}
              </button>
            );
          })}
        </div>
        <select className="input-base" style={{width:180,padding:'6px 10px',fontSize:12}} value={instFilter} onChange={e => setInstFilter(e.target.value)}>
          <option value="all">全部机构</option>
          {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <span style={{marginLeft:'auto',fontSize:12,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>{filtered.length} 条记录</span>
      </div>

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
                  <Cell key={i} fill={entry.value > 0 ? '#22c55e' : entry.type === 'new' ? '#f59e0b' : entry.type === 'exited' ? '#71717a' : '#ef4444'} fillOpacity={0.85} />
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
    </div>
  );
}
