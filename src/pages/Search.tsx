import { useState, useMemo } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { holdings, institutions } from '../data/mockData';

const typeLabels: Record<string,string> = {hedge:'对冲基金',sovereign:'主权基金',asset_manager:'资产管理',bank:'银行'};
const typeColors: Record<string,string> = {hedge:'#f59e0b',sovereign:'#22c55e',asset_manager:'#38bdf8',bank:'#a78bfa'};
const marketBadge: Record<string, {flag:string; color:string}> = {
  US: {flag:'🇺🇸', color:'#38bdf8'},
  HK: {flag:'🇭🇰', color:'#f59e0b'},
  CN: {flag:'🇨🇳', color:'#ef4444'},
};
function getMarket(ticker: string): string {
  if (ticker.includes('.HK')) return 'HK';
  if (/^\d{6}$/.test(ticker)) return 'CN';
  return 'US';
}
function formatShares(n:number):string { if(n>=1e9)return`${(n/1e9).toFixed(2)}B`; if(n>=1e6)return`${(n/1e6).toFixed(2)}M`; if(n>=1e3)return`${(n/1e3).toFixed(1)}K`; return`${n}`; }
function formatNumber(n:number):string { if(n>=1e12)return`$${(n/1e12).toFixed(1)}T`; if(n>=1e9)return`$${(n/1e9).toFixed(1)}B`; if(n>=1e6)return`$${(n/1e6).toFixed(1)}M`; return`$${n}`; }
function formatPercent(n:number):string { return`${n>0?'+':''}${n.toFixed(1)}%`; }

// Derive all unique tickers from holdings, sorted by total market value
function buildAllTickers() {
  const map = new Map<string, {name: string; marketValue: number}>();
  holdings.forEach(h => {
    const existing = map.get(h.stockTicker);
    if (!existing || existing.marketValue < h.marketValue) {
      map.set(h.stockTicker, { name: h.stockName, marketValue: h.marketValue });
    }
  });
  return [...map.entries()]
    .sort((a, b) => b[1].marketValue - a[1].marketValue)
    .map(([ticker, info]) => ({ ticker, name: info.name, market: getMarket(ticker) }));
}
const ALL_TICKERS = buildAllTickers();

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeQuick, setActiveQuick] = useState('');

  // Dynamic search results
  const filtered = useMemo(() => {
    if (query.length < 1) return [];
    const q = query.toLowerCase();
    return ALL_TICKERS
      .filter(s => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query]);

  const selectedStock = activeQuick || query.toUpperCase().replace(/\s/g,'');
  const stockHolders = selectedStock
    ? holdings.filter(h => h.stockTicker === selectedStock).sort((a,b) => b.marketValue - a.marketValue)
    : [];

  const selectedInfo = ALL_TICKERS.find(t => t.ticker === selectedStock);
  const selMarket = selectedInfo?.market || getMarket(selectedStock);
  const selBadge = marketBadge[selMarket];

  const clearSearch = () => { setQuery(''); setActiveQuick(''); };

  return (
    <div>
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:24,fontWeight:700,color:'#fafafa',margin:0}}>持仓搜索</h1>
        <p style={{fontSize:14,color:'#71717a',margin:'4px 0 0'}}>查找哪些机构持有某只股票，覆盖全市场</p>
      </div>

      {/* Search input */}
      <div style={{position:'relative',marginBottom:20}}>
        <SearchIcon size={16} color="#52525b" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
        <input
          className="input-base"
          placeholder="输入股票代码或名称搜索..."
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveQuick(''); }}
          style={{paddingLeft:38, paddingRight: query ? 38 : 12}}
        />
        {query && (
          <button onClick={clearSearch} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',alignItems:'center'}}>
            <XIcon size={14} color="#52525b" />
          </button>
        )}
        {filtered.length > 0 && (
          <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:10,background:'#141414',border:'1px solid #262626',borderRadius:8,marginTop:4,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.7)'}}>
            {filtered.map(s => {
              const badge = marketBadge[s.market];
              return (
                <div key={s.ticker} onClick={() => { setQuery(s.ticker); setActiveQuick(''); }} style={{
                  padding:'10px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,
                  borderBottom:'1px solid #1a1a1a', transition:'background 0.1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{fontSize:11,padding:'1px 6px',borderRadius:4,background:`${badge.color}15`,color:badge.color,fontWeight:700,fontFamily:'JetBrains Mono,monospace'}}>
                    {badge.flag} {s.ticker}
                  </span>
                  <span style={{fontSize:13,color:'#a1a1aa'}}>{s.name}</span>
                  <span style={{marginLeft:'auto',fontSize:11,color:'#3f3f46',fontFamily:'JetBrains Mono,monospace'}}>{s.market}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick filters row */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,color:'#3f3f46',marginBottom:8}}>快捷筛选</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {ALL_TICKERS.slice(0,18).map(s => {
            const badge = marketBadge[s.market];
            const isActive = activeQuick === s.ticker;
            return (
              <button key={s.ticker} onClick={() => { setActiveQuick(s.ticker); setQuery(''); }}
                style={{
                  fontFamily:'JetBrains Mono,monospace',display:'flex',alignItems:'center',gap:4,
                  padding:'4px 9px',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer',transition:'all 0.15s',
                  background: isActive ? `${badge.color}18` : 'transparent',
                  border: `1px solid ${isActive ? `${badge.color}40` : '#1e1e1e'}`,
                  color: isActive ? badge.color : '#52525b',
                }}>
                <span style={{fontSize:10}}>{badge.flag}</span>
                <span>{s.ticker}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {stockHolders.length > 0 && (
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
            {selBadge && (
              <span style={{fontSize:11,padding:'2px 8px',borderRadius:6,background:`${selBadge.color}18`,color:selBadge.color,fontWeight:700,fontFamily:'JetBrains Mono,monospace'}}>
                {selBadge.flag} {selMarket}
              </span>
            )}
            <span style={{fontSize:18,fontWeight:700,color:'#fafafa',fontFamily:'JetBrains Mono,monospace'}}>{selectedStock}</span>
            <span style={{fontSize:14,color:'#71717a'}}>{stockHolders[0]?.stockName}</span>
            <span style={{marginLeft:'auto',fontSize:12,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>{stockHolders.length} 家机构持有</span>
          </div>

          {/* Summary cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
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

          {/* Holdings table */}
          <div className="card-base" style={{overflow:'hidden'}}>
            <table className="table-base">
              <thead>
                <tr>
                  <th>机构</th>
                  <th>类型</th>
                  <th>持股数</th>
                  <th style={{textAlign:'right'}}>持仓市值</th>
                  <th style={{textAlign:'right'}}>占总股本</th>
                  <th style={{textAlign:'right'}}>本季变化</th>
                </tr>
              </thead>
              <tbody>
                {stockHolders.map(h => {
                  const inst = institutions.find(i => i.id === h.institutionId)!;
                  return (
                    <tr key={h.id}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:28,height:28,borderRadius:6,background:`${inst.color}22`,border:`1px solid ${inst.color}33`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            <span style={{fontSize:13,fontWeight:700,color:inst.color}}>{inst.name[0]}</span>
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:500,color:'#fafafa'}}>{inst.name}</div>
                            <div style={{fontSize:10,color:'#52525b'}}>{inst.country}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{fontSize:11,color:typeColors[inst.type],background:`${typeColors[inst.type]}18`,padding:'2px 8px',borderRadius:9999,whiteSpace:'nowrap'}}>
                          {typeLabels[inst.type]}
                        </span>
                      </td>
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
        </div>
      )}

      {query.length > 0 && filtered.length === 0 && (
        <div style={{textAlign:'center',padding:'48px 0',color:'#52525b'}}>
          <SearchIcon size={32} style={{margin:'0 auto 12px',opacity:0.3}} />
          <div style={{fontSize:14}}>未找到相关股票</div>
          <div style={{fontSize:12,marginTop:4}}>尝试输入股票代码或中文名称</div>
        </div>
      )}
    </div>
  );
}
