import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Building2, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';
import { institutions, holdings, holdingChanges, formatNumber, formatPercent, typeLabels, typeColors } from '../data/mockData';

export default function Dashboard() {
  const instCount = institutions.length;                              // 动态计算，避免硬编码
  const totalValue = institutions.reduce((sum, i) => sum + i.totalValue, 0);
  const totalIncreases = holdings.filter(h => h.changePercent > 0).length;
  const totalDecreases = holdings.filter(h => h.changePercent < 0).length;

  const recentChanges = holdingChanges
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 10);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fafafa', margin: 0 }}>机构总览</h1>
        <p style={{ fontSize: 14, color: '#71717a', margin: '4px 0 0' }}>跟踪全球顶级主权基金 & 机构投资者持仓动向</p>
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
