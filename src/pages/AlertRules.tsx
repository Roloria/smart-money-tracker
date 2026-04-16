import React, { useState } from 'react';
import { Bell, BellOff, Plus, Trash2, Mail, MessageCircle, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { alertRules as initialRules, institutions, formatNumber } from '../data/mockData';
import { AlertRule } from '../types';

export default function AlertRules() {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [showForm, setShowForm] = useState(false);
  const [stockQuery, setStockQuery] = useState('');
  const [stockTicker, setStockTicker] = useState('');
  const [stockName, setStockName] = useState('');
  const [instSelection, setInstSelection] = useState<string>('all');
  const [threshold, setThreshold] = useState(20);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyFeishu, setNotifyFeishu] = useState(true);

  const handleSelectStock = (ticker: string, name: string) => {
    setStockTicker(ticker);
    setStockName(name);
    setStockQuery('');
  };

  const handleSubmit = () => {
    if (!stockTicker) return;
    const newRule: AlertRule = {
      id: Date.now(),
      stockTicker,
      stockName,
      institutionIds: instSelection === 'all' ? 'all' : instSelection.split(',').map(Number),
      thresholdPercent: threshold,
      notifyEmail,
      notifyFeishu,
      isActive: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setRules([newRule, ...rules]);
    setShowForm(false);
    setStockTicker(''); setStockName(''); setStockQuery(''); setInstSelection('all'); setThreshold(20); setNotifyEmail(false); setNotifyFeishu(true);
  };

  const toggleRule = (id: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const deleteRule = (id: number) => {
    setRules(rules.filter(r => r.id !== id));
  };

  // 预警股票池：Kevin 真实持仓 + 全球AI核心资产 + 主要科技巨头
  const availableStocks = [
    // Kevin 真实持仓
    {ticker:'300866',name:'安克创新'},{ticker:'301498',name:'乖宝宠物'},
    {ticker:'688110',name:'东芯股份'},{ticker:'9988.HK',name:'阿里巴巴'},
    {ticker:'1810.HK',name:'小米集团'},{ticker:'002602',name:'世纪华通'},
    // AI 核心资产
    {ticker:'NVDA',name:'英伟达'},{ticker:'AVGO',name:'博通'},
    {ticker:'TSM',name:'台积电'},{ticker:'ASML',name:'ASML'},
    {ticker:'MSFT',name:'微软'},{ticker:'GOOGL',name:'谷歌'},
    {ticker:'META',name:'Meta'},{ticker:'AMZN',name:'亚马逊'},
    {ticker:'CRM',name:'Salesforce'},{ticker:'ORCL',name:'甲骨文'},
    // 科技/金融
    {ticker:'AAPL',name:'苹果'},{ticker:'TSLA',name:'特斯拉'},
    {ticker:'JPM',name:'摩根大通'},{ticker:'BAC',name:'美国银行'},
    {ticker:'0700.HK',name:'腾讯控股'},{ticker:'3690.HK',name:'美团'},
  ].filter(s => !stockQuery || s.ticker.toLowerCase().includes(stockQuery.toLowerCase()) || s.name.includes(stockQuery));

  return (
    <div>
      <div style={{marginBottom:28,display:'flex',alignItems:'center',gap:12}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:'#fafafa',margin:0}}>预警规则</h1>
          <p style={{fontSize:14,color:'#71717a',margin:'4px 0 0'}}>设置持仓变化预警，第一时间捕捉聪明钱动向</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,background:'#38bdf8',color:'#000',border:'none',borderRadius:6,padding:'8px 16px',fontSize:13,fontWeight:600,cursor:'pointer'}}>
          <Plus size={14} /> 新建规则
        </button>
      </div>

      {/* New Rule Form */}
      {showForm && (
        <div className="card-base" style={{padding:24,marginBottom:24,border:'1px solid #38bdf833'}}>
          <div style={{fontSize:15,fontWeight:600,color:'#fafafa',marginBottom:20}}>新建预警规则</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {/* Stock */}
            <div>
              <label style={{fontSize:12,color:'#71717a',display:'block',marginBottom:6}}>股票</label>
              <div style={{position:'relative'}}>
                <Search size={14} color="#52525b" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)'}} />
                <input className="input-base" placeholder="搜索股票..." value={stockQuery} onChange={e=>setStockQuery(e.target.value)} style={{paddingLeft:32}} />
                {availableStocks.length > 0 && (
                  <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:10,background:'#141414',border:'1px solid #262626',borderRadius:6,marginTop:4,overflow:'hidden'}}>
                    {availableStocks.map(s => (
                      <div key={s.ticker} onClick={()=>handleSelectStock(s.ticker,s.name)} style={{padding:'8px 12px',cursor:'pointer',display:'flex',gap:8,borderBottom:'1px solid #1e1e1e'}}>
                        <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:'#38bdf8',fontSize:12}}>{s.ticker}</span>
                        <span style={{fontSize:12,color:'#71717a'}}>{s.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {stockTicker && <div style={{marginTop:6,fontSize:12,color:'#22c55e'}}>已选：{stockTicker} {stockName}</div>}
            </div>
            {/* Institution */}
            <div>
              <label style={{fontSize:12,color:'#71717a',display:'block',marginBottom:6}}>机构</label>
              <select className="input-base" value={instSelection} onChange={e=>setInstSelection(e.target.value)}>
                <option value="all">全部机构</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            {/* Threshold */}
            <div>
              <label style={{fontSize:12,color:'#71717a',display:'block',marginBottom:6}}>触发条件：变化超过 X%</label>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="range" min={5} max={50} step={5} value={threshold} onChange={e=>setThreshold(Number(e.target.value))} style={{flex:1}} />
                <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:'#38bdf8',fontSize:16,width:50,textAlign:'right'}}>{threshold}%</span>
              </div>
            </div>
            {/* Notifications */}
            <div>
              <label style={{fontSize:12,color:'#71717a',display:'block',marginBottom:8}}>通知方式</label>
              <div style={{display:'flex',gap:12}}>
                <button onClick={()=>setNotifyEmail(!notifyEmail)} style={{display:'flex',alignItems:'center',gap:6,background:notifyEmail?'rgba(56,189,248,0.12)':'#0f0f0f',border:`1px solid ${notifyEmail?'#38bdf8':'#262626'}`,borderRadius:6,padding:'6px 12px',fontSize:12,cursor:'pointer',color:notifyEmail?'#38bdf8':'#71717a'}}>
                  <Mail size={13} /> Email {notifyEmail?'✓':''}
                </button>
                <button onClick={()=>setNotifyFeishu(!notifyFeishu)} style={{display:'flex',alignItems:'center',gap:6,background:notifyFeishu?'rgba(56,189,248,0.12)':'#0f0f0f',border:`1px solid ${notifyFeishu?'#38bdf8':'#262626'}`,borderRadius:6,padding:'6px 12px',fontSize:12,cursor:'pointer',color:notifyFeishu?'#38bdf8':'#71717a'}}>
                  <MessageCircle size={13} /> 飞书 {notifyFeishu?'✓':''}
                </button>
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button onClick={handleSubmit} disabled={!stockTicker} style={{background:stockTicker?'#38bdf8':'#262626',color:stockTicker?'#000':'#52525b',border:'none',borderRadius:6,padding:'8px 20px',fontSize:13,fontWeight:600,cursor:stockTicker?'pointer':'not-allowed'}}>
              创建规则
            </button>
            <button onClick={()=>setShowForm(false)} style={{background:'transparent',color:'#71717a',border:'1px solid #262626',borderRadius:6,padding:'8px 20px',fontSize:13,cursor:'pointer'}}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:14,fontWeight:600,color:'#fafafa',marginBottom:12}}>已有规则（{rules.length}）</div>
        {rules.map(rule => (
          <div key={rule.id} className="card-base" style={{padding:16,marginBottom:10,display:'flex',alignItems:'center',gap:16,opacity:rule.isActive?1:0.5}}>
            <button onClick={()=>toggleRule(rule.id)} style={{background:'none',border:'none',cursor:'pointer',padding:0,flexShrink:0}}>
              {rule.isActive ? <Bell size={18} color="#38bdf8" /> : <BellOff size={18} color="#52525b" />}
            </button>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:'#38bdf8',fontSize:14}}>{rule.stockTicker}</span>
                <span style={{fontSize:13,color:'#a1a1aa'}}>{rule.stockName}</span>
                <span style={{fontSize:12,color:'#71717a',marginLeft:4}}>变化超过</span>
                <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:'#f59e0b',fontSize:14}}>{rule.thresholdPercent}%</span>
              </div>
              <div style={{display:'flex',gap:10,fontSize:11,color:'#52525b'}}>
                <span>机构：{rule.institutionIds === 'all' ? '全部' : institutions.filter(i=> Array.isArray(rule.institutionIds) && rule.institutionIds.some(id => id === i.id)).map(i=>i.name).join(', ')}</span>
                <span>创建：{rule.createdAt}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              {rule.notifyEmail && <span className="badge" style={{background:'#0f0f0f',color:'#a1a1aa',border:'1px solid #262626'}}><Mail size={10} style={{marginRight:3}}/>Email</span>}
              {rule.notifyFeishu && <span className="badge" style={{background:'#0f0f0f',color:'#a1a1aa',border:'1px solid #262626'}}><MessageCircle size={10} style={{marginRight:3}}/>飞书</span>}
            </div>
            <button onClick={()=>deleteRule(rule.id)} style={{background:'none',border:'none',cursor:'pointer',padding:4,color:'#52525b'}}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="card-base" style={{overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid #262626'}}><span style={{fontSize:14,fontWeight:600,color:'#fafafa'}}>预警历史记录</span></div>
        <table className="table-base">
          <thead><tr><th>时间</th><th>股票</th><th>机构</th><th>变化幅度</th><th>状态</th></tr></thead>
          <tbody>
            <tr><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#52525b'}}>2025-12-05</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#38bdf8',fontWeight:600}}>NVDA</td><td style={{color:'#a1a1aa'}}>贝莱德</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#22c55e',fontWeight:600}}>+26.7%</td><td><span className="badge badge-gain">已触发</span></td></tr>
            <tr><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#52525b'}}>2025-11-28</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#38bdf8',fontWeight:600}}>TSLA</td><td style={{color:'#a1a1aa'}}>富达投资</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#22c55e',fontWeight:600}}>+23.4%</td><td><span className="badge badge-gain">已触发</span></td></tr>
            <tr><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#52525b'}}>2025-11-15</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#38bdf8',fontWeight:600}}>META</td><td style={{color:'#a1a1aa'}}>高盛</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#22c55e',fontWeight:600}}>+25.0%</td><td><span className="badge badge-gain">已触发</span></td></tr>
            <tr><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#52525b'}}>2025-11-01</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#38bdf8',fontWeight:600}}>TSLA</td><td style={{color:'#a1a1aa'}}>高盛</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#ef4444',fontWeight:600}}>-21.7%</td><td><span className="badge badge-loss">已触发</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
