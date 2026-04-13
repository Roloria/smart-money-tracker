import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Globe, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { institutions, holdings, formatNumber, formatPercent, formatShares, typeLabels, typeColors } from '../data/mockData';

const quarters = ['2025Q4', '2025Q3', '2025Q2', '2025Q1', '2024Q4', '2024Q3', '2024Q2', '2024Q1', '2023Q4'];
const COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#f43f5e', '#a78bfa', '#84cc16', '#e879f9', '#fb923c'];

function makeLineData(instId: number, allHoldings: typeof holdings) {
  const base = allHoldings.filter(h => h.institutionId === instId);
  const sectors = [...new Set(base.map(h => h.sector))];
  const sectorMap: Record<string, number[]> = {};
  sectors.forEach(s => { sectorMap[s] = []; });
  quarters.forEach((_, qi) => {
    const factor = 1 - (qi * 0.04);
    sectors.forEach(s => { sectorMap[s].push(Math.round((base.find(h => h.sector === s)?.marketValue || 0) * factor)); });
  });
  return {
    line: quarters.map((q, i) => { const row: Record<string, string | number> = { quarter: q }; sectors.forEach(s => { row[s] = sectorMap[s][i]; }); return row; }),
    sectors,
  };
}

export default function InstitutionDetail() {
  const { id } = useParams();
  const instId = Number(id);
  const inst = institutions.find(i => i.id === instId)!;
  const instHoldings = holdings.filter(h => h.institutionId === instId);
  const [selectedQuarter, setSelectedQuarter] = useState('2025Q4');
  if (!inst) return <div style={{color:'#ef4444',padding:40}}>机构未找到</div>;
  const sortedHoldings = [...instHoldings].sort((a, b) => b.marketValue - a.marketValue);
  const sectorMap: Record<string, number> = {};
  instHoldings.forEach(h => { sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.marketValue; });
  const pieData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }));
  const { line: lineData, sectors } = makeLineData(instId, holdings);

  return (
    <div>
      <Link to="/institutions" style={{display:'inline-flex',alignItems:'center',gap:6,color:'#71717a',textDecoration:'none',fontSize:13,marginBottom:20}}>
        <ArrowLeft size={14} /> 返回机构列表
      </Link>
      <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:28}}>
        <div style={{width:64,height:64,borderRadius:16,background:`${inst.color}22`,border:`1px solid ${inst.color}44`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <span style={{fontSize:28,fontWeight:800,color:inst.color,fontFamily:'JetBrains Mono,monospace'}}>{inst.name[0]}</span>
        </div>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:'#fafafa',margin:0}}>{inst.name}</h1>
          <p style={{fontSize:13,color:'#71717a',margin:'4px 0 8px'}}>{inst.nameEn}</p>
          <div style={{display:'flex',gap:8}}>
            <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#71717a'}}><Globe size={12} /> {inst.country}</span>
            <span style={{fontSize:12,color:typeColors[inst.type],background:typeColors[inst.type]+'18',padding:'2px 10px',borderRadius:9999,border:`1px solid ${typeColors[inst.type]}33`}}>{typeLabels[inst.type]}</span>
          </div>
        </div>
        <div style={{marginLeft:'auto',textAlign:'right'}}>
          <div style={{fontSize:12,color:'#71717a',marginBottom:4}}>总持仓市值</div>
          <div style={{fontSize:28,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'#fafafa'}}>{formatNumber(inst.totalValue)}</div>
          <div style={{fontSize:12,color:'#52525b',marginTop:4}}>{inst.holdingCount} 只股票</div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
        <span style={{fontSize:13,color:'#71717a'}}>季度：</span>
        {quarters.slice(0,4).map(q => (
          <button key={q} onClick={() => setSelectedQuarter(q)} className={`tag-filter ${selectedQuarter===q?'active':''}`}>{q}</button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20,marginBottom:24}}>
        <div className="card-base" style={{overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:'1px solid #262626',display:'flex',alignItems:'center',gap:8}}>
            <BarChart3 size={14} color="#38bdf8" /><span style={{fontSize:14,fontWeight:600,color:'#fafafa'}}>持仓明细</span>
            <span style={{marginLeft:'auto',fontSize:12,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>{sortedHoldings.length} 只</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="table-base">
              <thead><tr><th>代码</th><th>名称</th><th>行业</th><th style={{textAlign:'right'}}>持股数</th><th style={{textAlign:'right'}}>市值</th><th style={{textAlign:'right'}}>占比</th><th style={{textAlign:'right'}}>本季变化</th></tr></thead>
              <tbody>
                {sortedHoldings.map(h => (
                  <tr key={h.id}>
                    <td style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:'#38bdf8'}}>{h.stockTicker}</td>
                    <td style={{color:'#fafafa'}}>{h.stockName}</td>
                    <td style={{fontSize:12,color:'#71717a'}}>{h.sector}</td>
                    <td style={{textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#a1a1aa'}}>{formatShares(h.shares)}</td>
                    <td style={{textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontWeight:600,color:'#fafafa'}}>{formatNumber(h.marketValue)}</td>
                    <td style={{textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#a1a1aa'}}>{h.ownershipPercent.toFixed(2)}%</td>
                    <td style={{textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:h.changePercent>0?'#22c55e':'#ef4444'}}>{formatPercent(h.changePercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-base" style={{padding:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><PieChart size={14} color="#f59e0b" /><span style={{fontSize:14,fontWeight:600,color:'#fafafa'}}>行业分布</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <RePieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${((percent||0)*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v)=>formatNumber(Number(v))} contentStyle={{background:'#141414',border:'1px solid #262626',borderRadius:6,fontSize:12,color:'#fafafa'}} />
            </RePieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:12}}>
            {pieData.map((entry,i) => (
              <div key={entry.name} style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                <div style={{width:8,height:8,borderRadius:2,background:COLORS[i%COLORS.length],flexShrink:0}} />
                <span style={{color:'#a1a1aa',flex:1}}>{entry.name}</span>
                <span style={{fontFamily:'JetBrains Mono,monospace',color:'#fafafa'}}>{formatNumber(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card-base" style={{padding:20}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}><TrendingUp size={14} color="#38bdf8" /><span style={{fontSize:14,fontWeight:600,color:'#fafafa'}}>持仓市值变化（近9季度）</span></div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:'#52525b',fontFamily:'JetBrains Mono'}} />
            <YAxis tick={{fontSize:10,fill:'#52525b',fontFamily:'JetBrains Mono'}} tickFormatter={v=>formatNumber(v)} width={70} />
            <Tooltip formatter={(v)=>formatNumber(Number(v))} contentStyle={{background:'#141414',border:'1px solid #262626',borderRadius:6,fontSize:12,color:'#fafafa'}} />
            <Legend wrapperStyle={{fontSize:12,color:'#a1a1aa'}} />
            {sectors.map((s,i) => <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i%COLORS.length]} strokeWidth={2} dot={false} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
