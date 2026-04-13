import { useState } from 'react';
import { SearchIcon, TrendingUp, DollarSign } from 'lucide-react';
import { holdings, institutions } from '../data/mockData';

const quickStocks = ['AAPL','MSFT','NVDA','TSLA','META','GOOGL','AMZN','JPM'];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeQuick, setActiveQuick] = useState('');

  const allStocks = [...new Set(holdings.map(h => h.stockTicker + '|' + h.stockName))];
  const filtered = query.length > 0
    ? allStocks.filter(s => {
        const [ticker, name] = s.split('|');
        return ticker.toLowerCase().includes(query.toLowerCase()) || name.includes(query);
      })
    : [];

  const selectedStock = activeQuick || query.toUpperCase();
  const stockHolders = selectedStock
    ? holdings.filter(h => h.stockTicker === selectedStock).sort((a,b) => b.marketValue - a.marketValue)
    : [];

  return (
    <div>
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:24,fontWeight:700,color:'#fafafa',margin:0}}>持仓搜索</h1>
        <p style={{fontSize:14,color:'#71717a',margin:'4px 0 0'}}>查找哪些机构持有某只股票</p>
      </div>

      {/* Quick search */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,color:'#52525b',marginBottom:8}}>快捷搜索</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {quickStocks.map(s => (
            <button key={s} onClick={() => { setActiveQuick(s); setQuery(''); }} className={`tag-filter ${activeQuick===s?'active':''}`} style={{fontFamily:'JetBrains Mono,monospace'}}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Search input */}
      <div style={{position:'relative',marginBottom:24}}>
        <SearchIcon size={16} color="#52525b" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}} />
        <input
          className="input-base"
          placeholder="输入股票代码或名称搜索..."
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveQuick(''); }}
          style={{paddingLeft:40}}
        />
        {filtered.length > 0 && (
          <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:10,background:'#141414',border:'1px solid #262626',borderRadius:6,marginTop:4,overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,0.6)'}}>
            {filtered.slice(0,8).map(s => {
              const [ticker, name] = s.split('|');
              return (
                <div key={s} onClick={() => { setQuery(ticker); setActiveQuick(''); }} style={{padding:'10px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,borderBottom:'1px solid #1e1e1e'}}>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:'#38bdf8',fontSize:13}}>{ticker}</span>
                  <span style={{fontSize:13,color:'#71717a'}}>{name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Results */}
      {stockHolders.length > 0 && (
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
            <span style={{fontSize:16,fontWeight:600,color:'#fafafa'}}>{selectedStock}</span>
            <span style={{fontSize:14,color:'#71717a'}}>{stockHolders[0]?.stockName}</span>
            <span style={{marginLeft:'auto',fontSize:12,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>{stockHolders.length} 家机构持有</span>
          </div>
          <div className="card-base" style={{overflow:'hidden'}}>
            <table className="table-base">
              <thead><tr><th>机构</th><th>类型</th><th>持股数</th><th style={{textAlign:'right'}}>持仓市值</th><th style={{textAlign:'right'}}>占总股本</th><th style={{textAlign:'right'}}>本季变化</th></tr></thead>
              <tbody>
                {stockHolders.map(h => {
                  const inst = institutions.find(i => i.id === h.institutionId)!;
                  return (
                    <tr key={h.id}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:28,height:28,borderRadius:6,background:`${inst.color}22`,border:`1px solid ${inst.color}33`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <span style={{fontSize:13,fontWeight:700,color:inst.color}}>{inst.name[0]}</span>
                          </div>
                          <span style={{fontSize:13,fontWeight:500,color:'#fafafa'}}>{inst.name}</span>
                        </div>
                      </td>
                      <td><span style={{fontSize:11,color:typeColors[inst.type],background:typeColors[inst.type]+'18',padding:'2px 8px',borderRadius:9999}}>{typeLabels[inst.type]}</span></td>
                      <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#a1a1aa'}}>{formatShares(h.shares)}</td>
                      <td style={{textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontWeight:600,color:'#fafafa'}}>{formatNumber(h.marketValue)}</td>
                      <td style={{textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#a1a1aa'}}>{h.ownershipPercent.toFixed(2)}%</td>
                      <td style={{textAlign:'right',fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:h.changePercent>0?'#22c55e':'#ef4444'}}>{formatPercent(h.changePercent)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            <div className="stat-card" style={{padding:'14px 16px'}}>
              <div style={{fontSize:11,color:'#52525b',marginBottom:4}}>总持股数</div>
              <div style={{fontSize:18,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'#fafafa'}}>{formatShares(stockHolders.reduce((s,h)=>s+h.shares,0))}</div>
            </div>
            <div className="stat-card" style={{padding:'14px 16px'}}>
              <div style={{fontSize:11,color:'#52525b',marginBottom:4}}>总持仓市值</div>
              <div style={{fontSize:18,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'#fafafa'}}>{formatNumber(stockHolders.reduce((s,h)=>s+h.marketValue,0))}</div>
            </div>
            <div className="stat-card" style={{padding:'14px 16px'}}>
              <div style={{fontSize:11,color:'#52525b',marginBottom:4}}>机构数量</div>
              <div style={{fontSize:18,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'#38bdf8'}}>{stockHolders.length}</div>
            </div>
          </div>
        </div>
      )}

      {query.length > 0 && filtered.length === 0 && (
        <div style={{textAlign:'center',padding:'48px 0',color:'#52525b'}}>
          <SearchIcon size={32} style={{margin:'0 auto 12px',opacity:0.3}} />
          <div style={{fontSize:14}}>未找到相关股票</div>
        </div>
      )}
    </div>
  );
}
const typeLabels: Record<string,string> = {hedge:'对冲基金',sovereign:'主权基金',asset_manager:'资产管理',bank:'银行'};
const typeColors: Record<string,string> = {hedge:'#f59e0b',sovereign:'#22c55e',asset_manager:'#38bdf8',bank:'#a78bfa'};
function formatShares(n:number):string { if(n>=1e9)return`${(n/1e9).toFixed(2)}B`; if(n>=1e6)return`${(n/1e6).toFixed(2)}M`; if(n>=1e3)return`${(n/1e3).toFixed(1)}K`; return`${n}`; }
function formatNumber(n:number):string { if(n>=1e12)return`$${(n/1e12).toFixed(1)}T`; if(n>=1e9)return`$${(n/1e9).toFixed(1)}B`; if(n>=1e6)return`$${(n/1e6).toFixed(1)}M`; return`$${n}`; }
function formatPercent(n:number):string { const sign=n>0?'+':''; return`${sign}${n.toFixed(1)}%`; }
