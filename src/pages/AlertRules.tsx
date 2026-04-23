import React, { useState } from 'react';
import { Bell, BellOff, Plus, Trash2, Mail, MessageCircle, Search, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { alertRules as initialRules, institutions } from '../data/mockData';
import { AlertRule } from '../types';
import { FEISHU_WEBHOOK } from '../config';
const API_BASE = '/api';

interface NotificationLog {
  id: number;
  ruleId?: number;
  stockTicker: string;
  stockName: string;
  type: 'test' | 'trigger';
  channel: 'feishu' | 'email';
  status: 'success' | 'error';
  message: string;
  time: string;
  timeFull: string;
}

async function sendFeishuNotification(content: string): Promise<{ success: boolean; msg: string }> {
  try {
    const resp = await fetch(FEISHU_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'interactive',
        card: {
          tag: 'card',
          elements: [
            { tag: 'div', text: { tag: 'plain_text', content } },
          ],
        },
      }),
    });
    const data = await resp.json();
    if (resp.ok && data?.code === 0) return { success: true, msg: '发送成功' };
    return { success: false, msg: data?.msg || `HTTP ${resp.status}` };
  } catch (err: unknown) {
    return { success: false, msg: (err as Error).message || '网络错误' };
  }
}

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
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [testing, setTesting] = useState(false);

  const now = () => new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const nowFull = () => new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  // Relative time helper: takes full locale string from nowFull()
  const relativeTime = (fullTimeStr: string): string => {
    try {
      const then = new Date(fullTimeStr.replace(' ', 'T') + ':00+08:00').getTime();
      const diffMs = Date.now() - then;
      if (diffMs < 60000) return '刚刚';
      if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}分钟前`;
      if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}小时前`;
      return `${Math.floor(diffMs / 86400000)}天前`;
    } catch { return fullTimeStr; }
  };

  const handleTestFeishu = async () => {
    setTesting(true);
    const content = `🧪 【测试通知】\n聪明钱 Tracker 预警系统运行正常\n发送时间：${new Date().toLocaleString('zh-CN')}\n如果你收到此消息，说明飞书机器人配置正确 ✅`;
    const result = await sendFeishuNotification(content);
    const ts = nowFull();
    setLogs(prev => [{
      id: Date.now(),
      stockTicker: 'TEST',
      stockName: '预警测试',
      type: 'test',
      channel: 'feishu',
      status: result.success ? 'success' : 'error',
      message: result.success ? `✅ 飞书通知发送成功！${result.msg}` : `❌ 发送失败：${result.msg}`,
      time: now(),
      timeFull: ts,
    }, ...prev]);
    setTesting(false);
  };

  const handleSelectStock = (ticker: string, name: string) => {
    setStockTicker(ticker); setStockName(name); setStockQuery('');
  };

  const handleSubmit = async () => {
    if (!stockTicker) return;
    const newRule: AlertRule = {
      id: Date.now(),
      stockTicker, stockName,
      institutionIds: instSelection === 'all' ? 'all' : instSelection.split(',').map(Number),
      thresholdPercent: threshold,
      notifyEmail, notifyFeishu,
      isActive: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setRules([newRule, ...rules]);
    setShowForm(false);
    setStockTicker(''); setStockName(''); setStockQuery('');
    setInstSelection('all'); setThreshold(20); setNotifyEmail(false); setNotifyFeishu(true);

    // 触发飞书预警推送（有异动时）
    if (notifyFeishu) {
      const instId = instSelection === 'all' ? 'all' : instSelection;
      const instName = instSelection === 'all' ? '全部机构' : (institutions.find(i => i.id === Number(instSelection))?.name || instSelection);
      try {
        const resp = await fetch(`${API_BASE}/alert-trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker: stockTicker,
            stockName,
            threshold,
            institutionId: instId,
            notifyFeishu: true,
          }),
        });
        const data = await resp.json();
        const msgText = data.triggered
          ? `✅ 规则已保存，已触发 ${data.count} 条异动推送`
          : `✅ 规则已保存，当前无异动（${data.reason}）`;
        const ts = nowFull();
        setLogs(prev => [{
          id: Date.now(),
          stockTicker, stockName,
          type: 'trigger',
          channel: 'feishu',
          status: data.triggered ? 'success' : 'success',
          message: msgText,
          time: now(),
          timeFull: ts,
        }, ...prev]);
      } catch (err) {
        const ts = nowFull();
        setLogs(prev => [{
          id: Date.now(),
          stockTicker, stockName,
          type: 'trigger',
          channel: 'feishu',
          status: 'error',
          message: `❌ 推送失败：${(err as Error).message}`,
          time: now(),
          timeFull: ts,
        }, ...prev]);
      }
    }
  };

  const toggleRule = (id: number) => setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  const deleteRule = (id: number) => setRules(rules.filter(r => r.id !== id));

  // 预警股票池
  const availableStocks = [
    {ticker:'01810.HK',name:'小米集团'},{ticker:'300866',name:'安克创新'},
    {ticker:'00700.HK',name:'腾讯控股'},{ticker:'03690.HK',name:'美团'},
    {ticker:'09992.HK',name:'泡泡玛特'},
    {ticker:'NVDA',name:'英伟达'},{ticker:'AVGO',name:'博通'},
    {ticker:'TSM',name:'台积电'},{ticker:'ASML',name:'ASML'},
    {ticker:'MSFT',name:'微软'},{ticker:'GOOGL',name:'谷歌'},
    {ticker:'META',name:'Meta'},{ticker:'AMZN',name:'亚马逊'},
    {ticker:'CRM',name:'Salesforce'},{ticker:'AMD',name:'AMD'},
    {ticker:'AAPL',name:'苹果'},{ticker:'TSLA',name:'特斯拉'},
    {ticker:'JPM',name:'摩根大通'},{ticker:'BAC',name:'美国银行'},
    {ticker:'09988.HK',name:'阿里巴巴'},{ticker:'02669.HK',name:'信达生物'},
    {ticker:'600519',name:'贵州茅台'},{ticker:'300750',name:'宁德时代'},
    {ticker:'688041',name:'海光信息'},
  ].filter(s => !stockQuery || s.ticker.toLowerCase().includes(stockQuery.toLowerCase()) || s.name.includes(stockQuery));

  return (
    <div>
      <div style={{marginBottom:28,display:'flex',alignItems:'center',gap:12}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:'#fafafa',margin:0}}>预警规则</h1>
          <p style={{fontSize:14,color:'#71717a',margin:'4px 0 0'}}>设置持仓变化预警，第一时间捕捉聪明钱动向</p>
        </div>
        {/* Test notification button */}
        <button onClick={handleTestFeishu} disabled={testing} style={{
          marginLeft:'auto',display:'flex',alignItems:'center',gap:6,
          background: testing ? '#1e1e1e' : 'rgba(34,197,94,0.1)',
          color: testing ? '#52525b' : '#22c55e',
          border: `1px solid ${testing ? '#262626' : '#22c55e50'}`,
          borderRadius:6,padding:'7px 14px',fontSize:12,fontWeight:600,
          cursor: testing ? 'not-allowed' : 'pointer',transition:'all 0.15s',
        }}>
          {testing ? <Clock size={13} style={{animation:'spin 1s linear infinite'}} /> : <Send size={13} />}
          {testing ? '发送中...' : '测试飞书通知'}
        </button>
        <button onClick={() => setShowForm(!showForm)} style={{
          display:'flex',alignItems:'center',gap:6,
          background:'#38bdf8',color:'#000',border:'none',
          borderRadius:6,padding:'8px 16px',fontSize:13,fontWeight:600,cursor:'pointer',
        }}>
          <Plus size={14} /> 新建规则
        </button>
      </div>

      {/* New Rule Form */}
      {showForm && (
        <div className="card-base" style={{padding:24,marginBottom:24,border:'1px solid #38bdf833'}}>
          <div style={{fontSize:15,fontWeight:600,color:'#fafafa',marginBottom:20}}>新建预警规则</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
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
            <div>
              <label style={{fontSize:12,color:'#71717a',display:'block',marginBottom:6}}>机构</label>
              <select className="input-base" value={instSelection} onChange={e=>setInstSelection(e.target.value)}>
                <option value="all">全部机构</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,color:'#71717a',display:'block',marginBottom:6}}>触发条件：变化超过 X%</label>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="range" min={5} max={50} step={5} value={threshold} onChange={e=>setThreshold(Number(e.target.value))} style={{flex:1}} />
                <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:'#38bdf8',fontSize:16,width:50,textAlign:'right'}}>{threshold}%</span>
              </div>
            </div>
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
            <button onClick={()=>setShowForm(false)} style={{background:'transparent',color:'#71717a',border:'1px solid #262626',borderRadius:6,padding:'8px 20px',fontSize:13,cursor:'pointer'}}>取消</button>
          </div>
        </div>
      )}

      {/* Notification Logs (test results) */}
      {logs.length > 0 && (
        <div style={{marginBottom:24,background:'#141414',border:'1px solid #1e1e1e',borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:'#fafafa',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
            <Send size={13} color="#38bdf8" /> 通知日志
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {logs.map(log => (
              <div key={log.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#0d0d0d',borderRadius:8,border:`1px solid ${log.status === 'success' ? '#22c55e20' : '#ef444420'}`}}>
                {log.status === 'success'
                  ? <CheckCircle2 size={14} color="#22c55e" />
                  : <XCircle size={14} color="#ef4444" />}
                <div style={{display:'flex',flexDirection:'column',minWidth:70}}>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'#52525b'}}>{log.time}</span>
                  <span style={{fontSize:10,color:'#38bdf8'}}>{relativeTime(log.timeFull)}</span>
                </div>
                <span style={{fontSize:11,color:'#a1a1aa'}}>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules List */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:14,fontWeight:600,color:'#fafafa',marginBottom:12}}>已有规则（{rules.length}）</div>
        {rules.length === 0 && (
          <div style={{textAlign:'center',padding:'32px 0',color:'#52525b',fontSize:13}}>
            暂无预警规则，点击右上角「新建规则」添加
          </div>
        )}
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
              {rule.notifyEmail && <span style={{fontSize:11,padding:'3px 8px',borderRadius:6,background:'#0f0f0f',color:'#a1a1aa',border:'1px solid #262626',display:'flex',alignItems:'center',gap:3}}><Mail size={10} />Email</span>}
              {rule.notifyFeishu && <span style={{fontSize:11,padding:'3px 8px',borderRadius:6,background:'rgba(56,189,248,0.08)',color:'#38bdf8',border:'1px solid #38bdf830',display:'flex',alignItems:'center',gap:3}}><MessageCircle size={10} />飞书</span>}
            </div>
            <button onClick={()=>deleteRule(rule.id)} style={{background:'none',border:'none',cursor:'pointer',padding:4,color:'#52525b'}}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="card-base" style={{overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid #262626',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:14,fontWeight:600,color:'#fafafa'}}>预警历史记录</span>
          <span style={{fontSize:10,padding:'2px 6px',borderRadius:4,background:'#f59e0b15',color:'#f59e0b',border:'1px solid #f59e0b30',fontWeight:600}}>示例数据</span>
        </div>
        <table className="table-base">
          <thead><tr><th>时间</th><th>股票</th><th>机构</th><th>变化幅度</th><th>状态</th></tr></thead>
          <tbody>
            <tr><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#52525b'}}>2026-04-21</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#38bdf8',fontWeight:600}}>09992.HK</td><td style={{color:'#a1a1aa'}}>贝莱德</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#22c55e',fontWeight:600}}>+21.3%</td><td><span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600,background:'#22c55e15',color:'#22c55e'}}>已触发</span></td></tr>
            <tr><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#52525b'}}>2026-04-18</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#38bdf8',fontWeight:600}}>00700.HK</td><td style={{color:'#a1a1aa'}}>高盛</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#22c55e',fontWeight:600}}>+18.7%</td><td><span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600,background:'#22c55e15',color:'#22c55e'}}>已触发</span></td></tr>
            <tr><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#52525b'}}>2026-04-15</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#38bdf8',fontWeight:600}}>NVDA</td><td style={{color:'#a1a1aa'}}>富达投资</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#22c55e',fontWeight:600}}>+25.0%</td><td><span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600,background:'#22c55e15',color:'#22c55e'}}>已触发</span></td></tr>
            <tr><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#52525b'}}>2026-04-10</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#38bdf8',fontWeight:600}}>300866</td><td style={{color:'#a1a1aa'}}>高盛</td><td style={{fontFamily:'JetBrains Mono,monospace',color:'#ef4444',fontWeight:600}}>-15.2%</td><td><span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600,background:'#ef444415',color:'#ef4444'}}>已触发</span></td></tr>
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Footer: data source */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8,marginTop:20,padding:'0 4px'}}>
        <span style={{fontSize:10,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>预警规则</span>
        <span style={{fontSize:10,color:'#f59e0b',fontFamily:'JetBrains Mono,monospace',fontWeight:600}}>示例数据 · 预警阈值可自定义配置</span>
        <span style={{fontSize:10,color:'#3f3f46'}}>|</span>
        <span style={{fontSize:10,color:'#52525b',fontFamily:'JetBrains Mono,monospace'}}>v24 ⚡</span>
      </div>
    </div>
  );
}
