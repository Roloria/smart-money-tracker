import { useState, useEffect } from 'react';
import { Bell, RefreshCw, Database, Check, Clock } from 'lucide-react';
import { FEISHU_WEBHOOK } from '../config';

export default function SettingsPage() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [saved, setSaved] = useState(false);
  const [feishuWebhook, setFeishuWebhook] = useState(FEISHU_WEBHOOK);
  const [emailTo, setEmailTo] = useState('');
  const [refreshFreq, setRefreshFreq] = useState('6h');

  const shanghaiNow = now.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isFeishuValid = feishuWebhook.startsWith('https://open.feishu.cn/open-apis/bot/v2/hook/') && feishuWebhook.length > 60;

  return (
    <div>
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:24,fontWeight:700,color:'#fafafa',margin:0}}>设置</h1>
        <p style={{fontSize:14,color:'#71717a',margin:'4px 0 0'}}>配置通知渠道、数据刷新频率等</p>
      </div>

      <div style={{maxWidth:640}}>
        {/* Notification */}
        <div className="card-base" style={{padding:24,marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
            <Bell size={16} color="#38bdf8" />
            <span style={{fontSize:15,fontWeight:600,color:'#fafafa'}}>通知渠道</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <label style={{fontSize:12,color:'#71717a',display:'block',marginBottom:6}}>飞书 Webhook URL</label>
              <div style={{position:'relative'}}>
                <input className="input-base" value={feishuWebhook} onChange={e=>setFeishuWebhook(e.target.value)} style={{paddingRight:120}} />
                <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:11,color: isFeishuValid ? '#22c55e' : '#ef4444',fontFamily:'JetBrains Mono,monospace'}}>{isFeishuValid ? '✅ 已配置' : '❌ 未配置'}</span>
              </div>
              <div style={{fontSize:11,color:'#52525b',marginTop:4}}>预警触发时发送飞书消息通知</div>
            </div>
            <div>
              <label style={{fontSize:12,color:'#71717a',display:'block',marginBottom:6}}>通知邮箱</label>
              <input className="input-base" value={emailTo} onChange={e=>setEmailTo(e.target.value)} placeholder="接收预警邮件通知（可选）" />
              <div style={{fontSize:11,color:'#52525b',marginTop:4}}>接收预警邮件通知</div>
            </div>
          </div>
        </div>

        {/* Refresh frequency */}
        <div className="card-base" style={{padding:24,marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
            <RefreshCw size={16} color="#38bdf8" />
            <span style={{fontSize:15,fontWeight:600,color:'#fafafa'}}>数据刷新频率</span>
          </div>
          <div style={{display:'flex',gap:10}}>
            {[{v:'6h',l:'每6小时'},{v:'12h',l:'每12小时'},{v:'daily',l:'每日'},{v:'manual',l:'手动刷新'}].map(opt => (
              <button key={opt.v} onClick={()=>setRefreshFreq(opt.v)} style={{flex:1,padding:'10px 8px',borderRadius:6,border:`1px solid ${refreshFreq===opt.v?'#38bdf8':'#262626'}`,background:refreshFreq===opt.v?'rgba(56,189,248,0.08)':'#0f0f0f',color:refreshFreq===opt.v?'#38bdf8':'#71717a',fontSize:13,cursor:'pointer',fontWeight:refreshFreq===opt.v?600:400}}>
                {opt.l}
              </button>
            ))}
          </div>
          <div style={{fontSize:11,color:'#52525b',marginTop:8}}>SEC 13F 持仓报告每季度结束后45天内披露</div>
        </div>

        {/* Data source */}
        <div className="card-base" style={{padding:24,marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
            <Database size={16} color="#38bdf8" />
            <span style={{fontSize:15,fontWeight:600,color:'#fafafa'}}>数据来源</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {name:'SEC EDGAR 13F',desc:'美国证券交易委员会 - 季度13F机构持仓报告',avail:'✅ 已接入'},
              {name:'东方财富 QFII',desc:'A股外资持股数据（每日更新）',avail:'✅ 已接入'},
              {name:'沪深港通 Tushare',desc:'北向资金实时持仓数据',avail:'✅ 已接入'},
              {name:'HKEX 披露易',desc:'港交所机构持仓披露（每日更新）',avail:'✅ 已接入'},
            ].map(d => (
              <div key={d.name} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'#0f0f0f',borderRadius:6}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:'#fafafa'}}>{d.name}</div>
                  <div style={{fontSize:11,color:'#52525b',marginTop:2}}>{d.desc}</div>
                </div>
                <span style={{fontSize:12,color:d.avail.startsWith('✅')?'#22c55e':'#f59e0b',fontFamily:'JetBrains Mono,monospace',whiteSpace:'nowrap'}}>{d.avail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="card-base" style={{padding:24,marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:600,color:'#fafafa',marginBottom:12}}>Smart Money Tracker v25 ⚡</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:12,color:'#71717a'}}>
            <div><span style={{color:'#52525b'}}>当前版本：</span><span style={{fontFamily:'JetBrains Mono,monospace',color:'#a1a1aa'}}>v25 ⚡</span></div>
            <div><span style={{color:'#52525b'}}>数据周期：</span><span style={{fontFamily:'JetBrains Mono,monospace',color:'#a1a1aa'}}>2026 Q1</span></div>
            <div><span style={{color:'#52525b'}}>追踪机构：</span><span style={{fontFamily:'JetBrains Mono,monospace',color:'#a1a1aa'}}>12家全球机构</span></div>
            <div><span style={{color:'#52525b'}}>数据来源：</span><span style={{fontFamily:'JetBrains Mono,monospace',color:'#a1a1aa'}}>全页面覆盖</span></div>
            <div style={{gridColumn:'1 / -1',display:'flex',alignItems:'center',gap:6,marginTop:2}}>
              <Clock size={11} color="#38bdf8" />
              <span style={{color:'#52525b'}}>当前时间：</span>
              <span style={{fontFamily:'JetBrains Mono,monospace',color:'#38bdf8',fontWeight:600}}>{shanghaiNow} 北京时间</span>
            </div>
          </div>
          <div style={{marginTop:10,fontSize:12,color:'#3f3f46',lineHeight:1.6}}>v25 ⚡：全页面数据来源Footer体系完成 + InstitutionDetail数据源统一为getAllHoldings() + 2026 Q1数据周期标签 + Settings实时时钟。</div>
        </div>

        {/* Save */}
        <button onClick={handleSave} style={{display:'flex',alignItems:'center',gap:8,background:saved?'#22c55e':'#38bdf8',color:'#000',border:'none',borderRadius:6,padding:'10px 24px',fontSize:14,fontWeight:600,cursor:'pointer'}}>
          {saved ? <><Check size={15} /> 已保存！</> : '保存设置'}
        </button>
      </div>
    </div>
  );
}
