/**
 * DataSourcePanel — 数据源管理面板
 * 显示所有已接入数据源，支持查看详情和手动刷新
 */

import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle, Clock, Database, Zap, Loader2, ChevronRight } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DataSourceMeta {
  id: string;
  source: string;
  name: string;
  nameEn: string;
  description: string;
  coverage: string;
  updateFreq: string;
  lastUpdated: string;
  recordCount: number;
  freshness: 'live' | 'recent' | 'stale';
  color: string;
  isRealData: boolean;
  status: 'ready' | 'refreshing' | 'error';
  docs: string;
  errorMsg?: string;
  elapsed?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE = '';

const FRESHNESS_CONFIG = {
  live:   { label: '实时', color: '#22c55e', bg: '#22c55e18' },
  recent: { label: '近期', color: '#f59e0b', bg: '#f59e0b18' },
  stale:  { label: '历史', color: '#71717a', bg: '#71717a18' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DataSourcePanel({ onClose }: { onClose?: () => void }) {
  const [sources, setSources] = useState<DataSourceMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [refreshAllLoading, setRefreshAllLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ── Fetch sources ─────────────────────────────────────────────────────────
  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sources`);
      const json = await res.json();
      if (json.success) {
        setSources(json.sources.map((s: DataSourceMeta) => ({ ...s, status: 'ready' })));
      }
    } catch {
      // Fallback: use embedded data if server not running
      setSources(getEmbeddedSources());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  // ── Refresh single source ─────────────────────────────────────────────────
  const refreshSource = async (sourceId: string) => {
    setRefreshing(sourceId);
    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'refreshing' as const, errorMsg: undefined } : s));
    try {
      const res = await fetch(`${API_BASE}/api/refresh/${sourceId}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSources(prev => prev.map(s => s.id === sourceId ? {
          ...s,
          status: 'ready' as const,
          lastUpdated: json.lastUpdated || new Date().toISOString().split('T')[0],
          recordCount: json.recordCount || s.recordCount,
          elapsed: json.elapsed,
        } : s));
        showToast(`${getSourceName(sourceId)} 刷新成功！耗时 ${json.elapsed}ms`);
      } else {
        throw new Error(json.error);
      }
    } catch (err: any) {
      setSources(prev => prev.map(s => s.id === sourceId ? {
        ...s,
        status: 'error' as const,
        errorMsg: err.message || '刷新失败',
      } : s));
      showToast(`${getSourceName(sourceId)} 刷新失败: ${err.message}`, 'error');
    } finally {
      setRefreshing(null);
    }
  };

  // ── Refresh all ────────────────────────────────────────────────────────────
  const refreshAll = async () => {
    setRefreshAllLoading(true);
    const realSources = sources.filter(s => s.isRealData);
    for (const src of realSources) {
      setRefreshing(src.id);
      try {
        const res = await fetch(`${API_BASE}/api/refresh/${src.id}`, { method: 'POST' });
        const json = await res.json();
        setSources(prev => prev.map(s => s.id === src.id ? {
          ...s,
          status: 'ready' as const,
          lastUpdated: json.lastUpdated || s.lastUpdated,
          recordCount: json.recordCount || s.recordCount,
          elapsed: json.elapsed,
        } : s));
      } catch {
        setSources(prev => prev.map(s => s.id === src.id ? { ...s, status: 'error' as const } : s));
      }
      await new Promise(r => setTimeout(r, 500));
    }
    setRefreshing(null);
    setRefreshAllLoading(false);
    showToast('全部数据源刷新完成！');
    fetchSources();
  };

  const showToast = (msg: string, type = 'success') => {
    setToast(type === 'error' ? `❌ ${msg}` : `✅ ${msg}`);
    setTimeout(() => setToast(null), 4000);
  };

  const getSourceName = (id: string) => sources.find(s => s.id === id)?.name || id;

  const fmtDate = (d: string) => d || '—';
  const fmtCount = (n: number) => n > 0 ? `${n.toLocaleString()} 条` : '—';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.startsWith('❌') ? '#ef444418' : '#22c55e18',
          border: `1px solid ${toast.startsWith('❌') ? '#ef4444' : '#22c55e'}`,
          color: toast.startsWith('❌') ? '#ef4444' : '#22c55e',
          padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          zIndex: 2000, whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}

      <div style={{
        background: '#141414',
        border: '1px solid #1e1e1e',
        borderRadius: 16,
        width: '100%',
        maxWidth: 820,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{
          padding: '20px 24px 18px',
          borderBottom: '1px solid #1e1e1e',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#38bdf820', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={18} color="#38bdf8" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fafafa' }}>数据源中心</div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>
              共 {sources.length} 个数据源 · 鼠标悬停查看数据来源
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#1a1a1a', border: '1px solid #27272a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#71717a', transition: 'all 0.15s',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Summary Bar ──────────────────────────────────────────────────── */}
        <div style={{
          padding: '12px 24px',
          background: '#0d0d0d',
          display: 'flex', gap: 12, alignItems: 'center',
          borderBottom: '1px solid #1e1e1e',
        }}>
          {[
            { label: '实时', count: sources.filter(s => s.freshness === 'live').length, color: '#22c55e' },
            { label: '近期', count: sources.filter(s => s.freshness === 'recent').length, color: '#f59e0b' },
            { label: '历史', count: sources.filter(s => s.freshness === 'stale').length, color: '#71717a' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 12, color: '#a1a1aa' }}>{count}个<span style={{ color }}>{label}</span></span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={refreshAll}
              disabled={refreshAllLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                background: '#38bdf8', border: 'none',
                color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                opacity: refreshAllLoading ? 0.6 : 1,
              }}
            >
              {refreshAllLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={12} />}
              刷新全部
            </button>
          </div>
        </div>

        {/* ── Source List ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#71717a' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
              <div style={{ fontSize: 13 }}>加载数据源信息...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sources.map(src => {
                const fc = FRESHNESS_CONFIG[src.freshness];
                const isRefreshing = refreshing === src.id;
                const isActive = activeSource === src.id;

                return (
                  <div
                    key={src.id}
                    style={{
                      background: isActive ? '#1a1a1a' : '#111111',
                      border: `1px solid ${isActive ? src.color + '44' : '#1e1e1e'}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Row 1: main info */}
                    <div style={{
                      padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer',
                    }}
                      onClick={() => setActiveSource(isActive ? null : src.id)}
                    >
                      {/* Color dot */}
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: src.color,
                        flexShrink: 0,
                        boxShadow: `0 0 8px ${src.color}60`,
                      }} />

                      {/* Name & desc */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>{src.name}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '1px 6px',
                            borderRadius: 4, background: fc.bg, color: fc.color,
                          }}>
                            {fc.label}
                          </span>
                          {!src.isRealData && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#ef444418', color: '#ef4444' }}>
                              模拟
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#71717a', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {src.description}
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#71717a' }}>最新更新</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', fontFamily: 'JetBrains Mono, monospace' }}>{fmtDate(src.lastUpdated)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#71717a' }}>记录数</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa' }}>{fmtCount(src.recordCount)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#71717a' }}>更新频率</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa' }}>{src.updateFreq}</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        {src.docs && (
                          <a href={src.docs} target="_blank" rel="noopener noreferrer"
                            style={{
                              width: 28, height: 28, borderRadius: 7,
                              background: '#1a1a1a', border: '1px solid #27272a',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#71717a', transition: 'all 0.15s',
                            }}>
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          onClick={() => refreshSource(src.id)}
                          disabled={isRefreshing || !src.isRealData}
                          style={{
                            width: 28, height: 28, borderRadius: 7,
                            background: isRefreshing ? '#38bdf820' : '#1a1a1a',
                            border: `1px solid ${isRefreshing ? '#38bdf840' : '#27272a'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isRefreshing ? '#38bdf8' : src.color,
                            cursor: src.isRealData ? 'pointer' : 'not-allowed',
                            opacity: src.isRealData ? 1 : 0.4,
                            transition: 'all 0.15s',
                          }}
                          title={src.isRealData ? `刷新 ${src.name}` : '模拟数据，无需刷新'}
                        >
                          {isRefreshing
                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            : <RefreshCw size={12} />
                          }
                        </button>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7,
                          background: '#1a1a1a', border: '1px solid #27272a',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#52525b', cursor: 'pointer',
                          transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}>
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: expanded details */}
                    {isActive && (
                      <div style={{
                        padding: '0 16px 16px',
                        borderTop: '1px solid #1e1e1e',
                        marginTop: 0,
                        paddingTop: 14,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                      }}>
                        {/* Left: details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 11, color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>数据详情</div>
                          {[
                            { label: '英文名', value: src.nameEn },
                            { label: '覆盖范围', value: src.coverage },
                            { label: '更新频率', value: src.updateFreq },
                            { label: '数据格式', value: 'JSON / Python dict' },
                            { label: '刷新耗时', value: src.elapsed ? `${src.elapsed}ms` : '—' },
                          ].map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 11, color: '#52525b', width: 70, flexShrink: 0 }}>{label}</span>
                              <span style={{ fontSize: 11, color: '#a1a1aa' }}>{value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Right: status + log */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 11, color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>状态</div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {src.status === 'error' ? (
                              <AlertTriangle size={14} color="#ef4444" />
                            ) : src.status === 'refreshing' ? (
                              <Loader2 size={14} color="#38bdf8" style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <CheckCircle2 size={14} color={fc.color} />
                            )}
                            <span style={{ fontSize: 12, color: src.status === 'error' ? '#ef4444' : '#a1a1aa' }}>
                              {src.status === 'error' ? `错误: ${src.errorMsg || '未知错误'}`
                                : src.status === 'refreshing' ? '刷新中...'
                                  : `数据正常 · ${fc.label} · ${src.recordCount.toLocaleString()} 条`}
                            </span>
                          </div>

                          {src.status === 'error' && (
                            <div style={{
                              background: '#ef444412',
                              border: '1px solid #ef444430',
                              borderRadius: 8, padding: '8px 10px',
                              fontSize: 11, color: '#ef4444',
                              fontFamily: 'JetBrains Mono, monospace',
                            }}>
                              {src.errorMsg}
                            </div>
                          )}

                          {src.docs && (
                            <div style={{ marginTop: 4 }}>
                              <a href={src.docs} target="_blank" rel="noopener noreferrer"
                                style={{
                                  fontSize: 11, color: '#38bdf8', textDecoration: 'none',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                <ExternalLink size={10} /> 官方文档: {src.docs.slice(0, 50)}{src.docs.length > 50 ? '...' : ''}
                              </a>
                            </div>
                          )}

                          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                            <div style={{ fontSize: 10, color: '#52525b', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={9} /> 最后检查: {new Date().toLocaleString('zh-CN')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div style={{
            marginTop: 20, padding: '14px 16px',
            background: '#0d0d0d', borderRadius: 10,
            border: '1px solid #1e1e1e',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#71717a', marginBottom: 8 }}>ℹ️ 刷新说明</div>
            <div style={{ fontSize: 11, color: '#52525b', lineHeight: 1.7 }}>
              点击刷新按钮将调用服务器端 Python 爬虫脚本，从原始数据源抓取最新数据并更新本地缓存。
              SEC EDGAR 13F 披露有 45 天延迟，最新季度为 2026Q1。QFII 和港交所数据为每日更新。
              刷新全部数据源预计需要 15-30 秒。
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ── Embedded fallback data ────────────────────────────────────────────────────
function getEmbeddedSources(): DataSourceMeta[] {
  return [
    {
      id: 'sec_edgar', source: 'SEC_EDGAR', name: 'SEC EDGAR 13F', nameEn: 'SEC EDGAR 13F (US Institutions)',
      description: '美国证监会 13F 机构持仓披露（季度，45天内延迟）', coverage: '美国主要对冲基金 & 资管机构',
      updateFreq: '季度披露（Q1-Q4）', lastUpdated: '2026-02-14', recordCount: 47,
      freshness: 'stale', color: '#38bdf8', isRealData: true, status: 'ready', docs: 'https://www.sec.gov/edgar',
    },
    {
      id: 'hkex', source: 'HKEX', name: '港交所披露易', nameEn: 'HKEX Disclosure e-Knowledge',
      description: '港交所 substantial shareholder 重要股东披露（每日更新）', coverage: '港交所上市主要股票外资持仓',
      updateFreq: '每日更新', lastUpdated: '2026-04-11', recordCount: 14,
      freshness: 'recent', color: '#f59e0b', isRealData: true, status: 'ready', docs: 'https://www.hkex.com.hk/eng/investing/securities/eqacc/',
    },
    {
      id: 'eastmoney_qfii', source: 'EASTMONEY_QFII', name: '东方财富 QFII', nameEn: 'Eastmoney QFII Holdings',
      description: '东方财富 QFII 持股数据（覆盖所有 QFII 机构 A 股持仓）', coverage: 'QFII 机构 A 股持仓',
      updateFreq: '每日更新', lastUpdated: '2026-04-14', recordCount: 23,
      freshness: 'live', color: '#22c55e', isRealData: true, status: 'ready', docs: 'https://data.eastmoney.com/qfii/',
    },
    {
      id: 'tushare_hsgt', source: 'TUSHARE_HSGT', name: 'Tushare 沪深港通', nameEn: 'Tushare HSGT',
      description: 'Tushare 沪深港通持股明细（南向+北向资金持仓）', coverage: '沪深港通标的证券持仓',
      updateFreq: '每日更新', lastUpdated: '2026-04-14', recordCount: 31,
      freshness: 'live', color: '#a78bfa', isRealData: true, status: 'ready', docs: 'https://tushare.pro/',
    },

  ];
}

