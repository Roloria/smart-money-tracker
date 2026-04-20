import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Building2, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Star, Clock, TrendingUpCircle } from 'lucide-react';
import { institutions, holdings, holdingChanges, formatNumber, formatPercent, typeLabels, typeColors } from '../data/mockData';


// ── Market Status ──────────────────────────────────────────────────────────────
function MarketStatus() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMin = now.getUTCMinutes();
  const shanghaiHour = utcHour + 8;
  const day = now.getUTCDay(); // 0=Sun, 6=Sat

  const isWeekday = day >= 1 && day <= 5;

  // US market: 9:30-16:00 ET = 21:30-04:00+1 Shanghai (next day)
  const usOpen = isWeekday && ((shanghaiHour > 21 || (shanghaiHour === 21 && utcMin >= 30)) || shanghaiHour < 4);

  // HK market: 9:30-16:00 HKT = 1:30-8:00 Shanghai
  const hkOpen = isWeekday && shanghaiHour >= 1 && shanghaiHour < 4;

  // CN market: 9:30-15:00 CST = 9:30-15:00 Shanghai (no offset)
  const cnOpen = isWeekday && shanghaiHour >= 9 && shanghaiHour < 15;

  const markets = [
    { label: '🇺🇸 美股', open: usOpen },
    { label: '🇭🇰 港股', open: hkOpen },
    { label: '🇨🇳 A股', open: cnOpen },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
      {markets.map(m => (
        <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: m.open ? '#22c55e' : '#3f3f46' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.open ? '#22c55e' : '#3f3f46', boxShadow: m.open ? '0 0 4px #22c55e' : 'none' }} />
          <span style={{ fontWeight: m.open ? 600 : 400 }}>{m.label}</span>
          <span style={{ color: m.open ? '#22c55e' : '#52525b', fontWeight: 400 }}>{m.open ? '开市' : '休市'}</span>
        </div>
      ))}
      <span style={{ marginLeft: 4, fontSize: 10, color: '#3f3f46' }}>（北京时间）</span>
    </div>
  );
}

export default function Dashboard() {
  const instCount = institutions.length;                              // 动态计算，避免硬编码
  const totalValue = institutions.reduce((sum, i) => sum + i.totalValue, 0);
  const totalIncreases = holdings.filter(h => h.changePercent > 0).length;
  const totalDecreases = holdings.filter(h => h.changePercent < 0).length;

  // ── Institutional Sentiment Gauge ─────────────────────────────────────────
  const total = totalIncreases + totalDecreases;
  const sentimentPct = total > 0 ? (totalIncreases / total) * 100 : 50;
  const sentimentLabel = sentimentPct >= 70 ? '偏多' : sentimentPct >= 55 ? '谨慎看多' : sentimentPct >= 45 ? '中性' : sentimentPct >= 30 ? '谨慎看空' : '偏空';
  const sentimentColor = sentimentPct >= 70 ? '#22c55e' : sentimentPct >= 55 ? '#84cc16' : sentimentPct >= 45 ? '#71717a' : sentimentPct >= 30 ? '#f59e0b' : '#ef4444';

  const recentChanges = holdingChanges
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 10);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fafafa', margin: 0 }}>机构总览</h1>
            <p style={{ fontSize: 14, color: '#71717a', margin: '4px 0 0' }}>跟踪全球顶级主权基金 & 机构投资者持仓动向</p>
            <MarketStatus />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {/* Sentiment gauge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#141414', border: '1px solid #1e1e1e', borderRadius: 10, padding: '8px 14px' }}>
              <TrendingUpCircle size={14} color={sentimentColor} />
              <span style={{ fontSize: 11, color: '#71717a' }}>机构情绪</span>
              <div style={{ position: 'relative', width: 60, height: 6, background: '#1e1e1e', borderRadius: 3 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${sentimentPct}%`, background: `linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)`, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: sentimentColor }}>{sentimentLabel}</span>
            </div>
            {/* Data freshness */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: '#52525b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#22c55e', boxShadow: '0 0 4px #22c55e60',
                }} />
                <span>实时</span>
              </div>
              <span style={{ color: '#27272a' }}>|</span>
              <Clock size={10} />
              <span>{new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} 北京时间</span>
              <span style={{ color: '#27272a' }}>|</span>
              <span>SEC EDGAR · 2025 Q4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} color="#38bdf8" />
            </div>
            <span style={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>追踪机构</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#fafafa' }}>{instCount}</div>
          <div style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>全球顶级机构</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} color="#22c55e" />
            </div>
            <span style={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>总持仓市值</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#fafafa' }}>{formatNumber(totalValue)}</div>
          <div style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>2025 Q4 数据</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color="#22c55e" />
            </div>
            <span style={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>本季增持</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#22c55e' }}>{totalIncreases}</div>
          <div style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>只股票获增持</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={16} color="#ef4444" />
            </div>
            <span style={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>本季减持</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#ef4444' }}>{totalDecreases}</div>
          <div style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>只股票遭减持</div>
        </div>
      </div>

      {/* Institution Cards */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Star size={16} color="#f59e0b" />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fafafa', margin: 0 }}>机构持仓概览</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {institutions.map(inst => {
            const instHoldings = holdings.filter(h => h.institutionId === inst.id);
            const instChanges = instHoldings.filter(h => h.changePercent > 0).length;
            return (
              <Link to={`/institutions/${inst.id}`} key={inst.id} style={{ textDecoration: 'none' }}>
                <div className="card-base" style={{ padding: 16, cursor: 'pointer' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: inst.color + '22', border: `1px solid ${inst.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: inst.color, fontFamily: 'JetBrains Mono, monospace' }}>{inst.name[0]}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inst.name}</div>
                  <div style={{ fontSize: 11, color: '#71717a', marginBottom: 8 }}>{inst.country}</div>
                  <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#a1a1aa', marginBottom: 4 }}>
                    <span style={{ color: '#fafafa', fontWeight: 600 }}>{formatNumber(inst.totalValue)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#52525b' }}>
                    <span style={{ color: '#22c55e' }}>↑{instChanges}</span>
                    <span style={{ margin: '0 4px', color: '#3f3f46' }}>·</span>
                    <span>{inst.holdingCount} 只持仓</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Changes */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Activity size={16} color="#38bdf8" />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fafafa', margin: 0 }}>近期异动快讯</h2>
        </div>
        <div className="card-base" style={{ overflow: 'hidden' }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>股票</th>
                <th>机构</th>
                <th>类型</th>
                <th style={{ textAlign: 'right' }}>变化幅度</th>
                <th style={{ textAlign: 'right' }}>持股数变化</th>
                <th>季度</th>
              </tr>
            </thead>
            <tbody>
              {recentChanges.map(change => {
                const inst = institutions.find(i => i.id === change.institutionId)!;
                const badgeClass = change.changeType === 'increase' ? 'badge-gain' : change.changeType === 'decrease' ? 'badge-loss' : change.changeType === 'new' ? 'badge-new' : 'badge-exit';
                const typeLabel = change.changeType === 'increase' ? '增持' : change.changeType === 'decrease' ? '减持' : change.changeType === 'new' ? '新建仓' : '清仓';
                const isUp = change.changePercent > 0;
                return (
                  <tr key={change.id}>
                    <td>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#fafafa' }}>{change.stockTicker}</div>
                      <div style={{ fontSize: 12, color: '#71717a' }}>{change.stockName}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 4, background: inst.color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: inst.color }}>{inst.name[0]}</span>
                        </div>
                        <span style={{ fontSize: 13, color: '#a1a1aa' }}>{inst.name}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${badgeClass}`}>{typeLabel}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: isUp ? '#22c55e' : '#ef4444' }}>
                      {formatPercent(change.changePercent)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#a1a1aa' }}>
                      {isUp ? '+' : ''}{((change.currentShares - change.previousShares) / 1e6).toFixed(1)}M
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#71717a' }}>{change.quarter}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
