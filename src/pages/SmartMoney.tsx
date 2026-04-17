import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import {
  BarChart3, Building2, TrendingUp, TrendingDown,
  Search, Bell, Settings, ChevronRight,
  AlertTriangle, CheckCircle2, Globe, Shield,
  Plus, Trash2, ExternalLink, Wallet, PieChart as PieIcon, RefreshCw, DollarSign, Clock, Brain, Star, Cpu, Database, Loader2
} from 'lucide-react'
import AIChainPanel from './AIChainPanel'
import InstitutionDetailPage from './InstitutionDetailPage'

// Lazy-load heavy components to reduce initial bundle size
const InstitutionRankings = lazy(() => import('../components/InstitutionRankings'))
const InstitutionOverlap = lazy(() => import('../components/InstitutionOverlap'))
const SectorHeatmap = lazy(() => import('../components/SectorHeatmap'))
const DataSourcePanel = lazy(() => import('../components/DataSourcePanel'))
const KevinPortfolio = lazy(() => import('../components/KevinPortfolio'))

// Loading fallback for lazy components
const LazyLoader = ({ h = 400 }: { h?: number }) => (
  <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#141414', borderRadius: 12, border: '1px solid #1e1e1e' }}>
    <Loader2 size={24} color="#38bdf8" style={{ animation: 'spin 1s linear infinite' }} />
  </div>
)
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts'
import {
  institutions, holdings, holdingChanges, alertRules as _defaultAlertRules
} from '../data/mockData'
import { getStockPrices, convertCurrency, type StockPrice } from '../lib/stockPrices'
import {
  getAllHoldings, getAllChanges,
  getDataSourceLabel, getLastUpdated, getDataSources, getHoldingDataSource,
} from '../data/realData'
import AIFlowPage from './AIFlowPage'
import SmallCapPage from './SmallCapPage'
import { getAIChainSummary, getSmallCapSignals, AI_LAYERS, getLayerStatsFromHoldings, SMALL_CAP_TRACKED } from '../data/aiChain'
import type { Institution, Holding, AlertRule, HoldingChange } from '../types'

// Use combined data: mock (US) + HK/CN from realData
const ALL_HOLDINGS = getAllHoldings()
const ALL_CHANGES = getAllChanges()

// ── Design Tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0a', card: '#141414', cardHover: '#1a1a1a',
  border: '#1e1e1e', text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  blue: '#38bdf8', green: '#22c55e', red: '#ef4444',
  yellow: '#f59e0b', purple: '#a78bfa',
}
const typeColors: Record<string, string> = {
  hedge: '#f59e0b', sovereign: '#38bdf8',
  asset_manager: '#22c55e', bank: '#a1a1aa',
}
const typeLabels: Record<string, string> = {
  hedge: '对冲基金', sovereign: '主权基金',
  asset_manager: '资产管理', bank: '银行',
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt$ = (v: number) => {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  return `$${v}`
}
const fmtN = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return `${v}`
}
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
const fmtDate = () => {
  // 13F filings are delayed ~45 days after quarter end
  // In April 2026, latest filed = Q4 2025 (Oct-Dec)
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed
  // If before May, Q4 last year is latest; otherwise Q1 this year is latest
  if (month <= 4) return `${year - 1} Q4`
  if (month <= 7) return `${year} Q1`
  return `${year} Q2`
}

// ── Pill ───────────────────────────────────────────────────────────────────────
function Pill({ value }: { value: number }) {
  if (value === 0) return <span style={{ color: C.text3, fontSize: 12 }}>—</span>
  const color = value > 0 ? C.green : C.red
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px', borderRadius: 9999, fontSize: 12,
      fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
      background: `${color}15`, color,
      border: `1px solid ${color}30`,
    }}>
      {value > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {pct(value)}
    </span>
  )
}


// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? C.blue : '#2a2a2a', border: 'none',
        cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: 8, background: '#fff',
        position: 'absolute', top: 3,
        left: value ? 21 : 3, transition: 'left 0.2s',
      }} />
    </button>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: color ? `${color}18` : `${C.blue}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color || C.blue} />
        </div>
        <span style={{ fontSize: 12, color: C.text3, fontWeight: 500 }}>{label}</span>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.text, lineHeight: 1 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Holdings Table ────────────────────────────────────────────────────────────
function DataSourceBadge({ source }: { source?: string }) {
  const sourceMap: Record<string, { label: string; color: string }> = {
    SEC_EDGAR: { label: 'SEC 13F', color: C.blue },
    HKEX: { label: '港交所', color: C.yellow },
    EASTMONEY_QFII: { label: 'QFII', color: C.green },
    TUSHARE_HSGT: { label: 'Tushare', color: '#a78bfa' },
  }
  const info = sourceMap[source || 'SEC_EDGAR'] || sourceMap['SEC_EDGAR']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '1px 6px', borderRadius: 4, fontSize: 10,
      fontWeight: 600, background: `${info.color}18`,
      color: info.color, border: `1px solid ${info.color}30`,
    }}>
      {info.label}
    </span>
  )
}

function HoldingsTable({ holdings, onTickerClick, prices }: {
  holdings: Holding[]; onTickerClick?: (t: string) => void
  prices?: Map<string, StockPrice>
}) {
  const [sort, setSort] = useState<'value' | 'change' | 'shares' | 'price'>('value')
  const sorted = useMemo(() => {
    return [...holdings].sort((a, b) => {
      const pa = prices?.get(a.stockTicker)
      const pb = prices?.get(b.stockTicker)
      if (sort === 'value') {
        const va = pa ? pa.price * a.shares : a.marketValue
        const vb = pb ? pb.price * b.shares : b.marketValue
        return vb - va
      }
      if (sort === 'change') return b.changePercent - a.changePercent
      if (sort === 'price') return (pb?.price || 0) - (pa?.price || 0)
      return b.shares - a.shares
    })
  }, [holdings, sort, prices])

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {[
              { k: null, l: '标的' },
              { k: 'value' as const, l: '当前市值' },
              { k: 'price' as const, l: '当前价' },
              { k: null, l: '今日' },
              { k: 'change' as const, l: '季度变化' },
              { k: null, l: '来源' },
            ].map(({ k, l }) => (
              <th key={l} onClick={() => k && setSort(k as any)} style={{
                padding: '10px 12px', textAlign: 'left',
                fontSize: 11, fontWeight: 600, color: C.text3,
                cursor: k ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap',
              }}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((h: Holding) => {
            const price = prices?.get(h.stockTicker)
            const curPrice = price?.price || h.marketValue / h.shares
            const curValue = curPrice * h.shares
            const dayChg = price?.changePercent || 0
            return (
              <tr key={h.id}
                onMouseEnter={e => (e.currentTarget.style.background = '#161616')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.1s' }}
              >
                <td style={{ padding: '12px', minWidth: 140 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        onClick={() => onTickerClick?.(h.stockTicker)}
                        style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.blue, cursor: 'pointer' }}
                      >
                        {h.stockTicker}
                      </span>
                      {h.market === 'HK' && <span style={{ fontSize: 10, color: C.yellow }}>🇭🇰</span>}
                      {h.market === 'CN' && <span style={{ fontSize: 10, color: C.red }}>🇨🇳</span>}
                    </div>
                    <span style={{ fontSize: 11, color: C.text3 }}>{h.stockName}</span>
                  </div>
                </td>
                <td style={{ padding: '12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600 }}>
                  {fmt$(curValue)}
                </td>
                <td style={{ padding: '12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text2 }}>
                  <div>{curPrice.toFixed(price ? 2 : 0)}</div>
                  <div style={{ fontSize: 10, color: C.text3 }}>{price ? { US: '$', HK: 'HK$', CN: '¥' }[price.currency] : ''}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  {price ? (
                    <DayPill value={dayChg} />
                  ) : (
                    <span style={{ fontSize: 11, color: C.text3 }}>—</span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  <Pill value={h.changePercent} />
                </td>
                <td style={{ padding: '12px' }}>
                  <DataSourceBadge source={(h as any)._dataSource} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Day change pill ────────────────────────────────────────────────────────
function DayPill({ value }: { value: number }) {
  if (value === 0) return <span style={{ color: C.text3, fontSize: 12 }}>—</span>
  const color = value > 0 ? C.green : C.red
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      padding: '1px 7px', borderRadius: 9999, fontSize: 12,
      fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
      background: `${color}15`, color,
      border: `1px solid ${color}30`,
    }}>
      {value > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {value >= 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

// ── Institution Card ──────────────────────────────────────────────────────────
function InstitutionCard({ inst, holdings, onClick }: {
  inst: Institution; holdings: Holding[]; onClick: () => void
}) {
  const ih = holdings.filter((h: Holding) => h.institutionId === inst.id)
  const top = [...ih].sort((a: Holding, b: Holding) => b.marketValue - a.marketValue).slice(0, 3)
  const gains = ih.filter((h: Holding) => h.changePercent > 0).length
  const losses = ih.filter((h: Holding) => h.changePercent < 0).length
  const total = ih.reduce((s: number, h: Holding) => s + h.marketValue, 0)

  return (
    <div onClick={onClick} style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20,
      cursor: 'pointer', transition: 'all 0.15s',
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLElement
      el.style.borderColor = inst.color + '55'
      el.style.background = C.cardHover
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLElement
      el.style.borderColor = C.border
      el.style.background = C.card
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${inst.color}20`, border: `1.5px solid ${inst.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 800, color: inst.color,
          fontFamily: 'JetBrains Mono, monospace', flexShrink: 0,
        }}>
          {inst.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {inst.name}
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>{inst.nameEn}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={11} color={C.text3} />
            <span style={{ fontSize: 11, color: C.text3 }}>{inst.country}</span>
            <span style={{ width: 1, height: 10, background: '#333', margin: '0 2px' }} />
            <span style={{
              fontSize: 11, color: typeColors[inst.type],
              background: `${typeColors[inst.type]}18`,
              padding: '1px 6px', borderRadius: 9999,
              border: `1px solid ${typeColors[inst.type]}33`,
            }}>
              {typeLabels[inst.type]}
            </span>
          </div>
        </div>
        <ChevronRight size={16} color={C.text3} style={{ flexShrink: 0, marginTop: 4 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: '#0d0d0d', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: C.text3, marginBottom: 3 }}>持仓市值</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{fmt$(total)}</div>
        </div>
        <div style={{ background: '#0d0d0d', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: C.text3, marginBottom: 3 }}>持股数</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>{inst.holdingCount}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>↑{gains}增持</span>
        <span style={{ color: '#333' }}>·</span>
        <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>↓{losses}减持</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {top.map((h: Holding) => (
          <div key={h.id} style={{
            background: '#0d0d0d', border: '1px solid #222',
            borderRadius: 5, padding: '3px 8px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.blue }}>
              {h.stockTicker}
            </span>
            <Pill value={h.changePercent} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Changes Table ─────────────────────────────────────────────────────────────
function ChangesTable({ changes }: { changes: HoldingChange[] }) {
  const typeLabel: Record<string, string> = {
    increase: '增持', decrease: '减持', new: '新建仓', exited: '清仓',
  }
  const typeColor: Record<string, string> = {
    increase: C.green, decrease: C.red, new: C.blue, exited: C.yellow,
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
          {['标的', '机构', '类型', '变化幅度', '上季持仓', '本季持仓', '季度'].map(l => (
            <th key={l} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.text3 }}>
              {l}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {changes.map((c: HoldingChange) => {
          const inst = institutions.find((x: Institution) => x.id === c.institutionId)
          return (
            <tr key={c.id}
              onMouseEnter={e => (e.currentTarget.style.background = '#161616')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.1s' }}
            >
              <td style={{ padding: '12px' }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.blue }}>
                  {c.stockTicker}
                </span>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{c.stockName}</div>
              </td>
              <td style={{ padding: '12px' }}>
                <span style={{ fontSize: 12, color: inst?.color || C.text2 }}>{inst?.name}</span>
              </td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  fontSize: 11, color: typeColor[c.changeType],
                  background: `${typeColor[c.changeType]}18`,
                  padding: '2px 8px', borderRadius: 9999, fontWeight: 600,
                }}>
                  {typeLabel[c.changeType]}
                </span>
              </td>
              <td style={{ padding: '12px' }}><Pill value={c.changePercent} /></td>
              <td style={{ padding: '12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text2 }}>
                {fmtN(c.previousShares)}
              </td>
              <td style={{ padding: '12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text2 }}>
                {fmtN(c.currentShares)}
              </td>
              <td style={{ padding: '12px', fontSize: 11, color: C.text3 }}>{c.quarter}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ── Market Pie ─────────────────────────────────────────────────────────────────
function MarketPie({ holdings }: { holdings: Holding[] }) {
  const data = [
    { name: '美国 🇺🇸', value: holdings.filter((h: Holding) => h.market === 'US').reduce((s: number, h: Holding) => s + h.marketValue, 0) },
    { name: '香港 🇭🇰', value: holdings.filter((h: Holding) => h.market === 'HK').reduce((s: number, h: Holding) => s + h.marketValue, 0) },
    { name: 'A股 🇨🇳', value: holdings.filter((h: Holding) => h.market === 'CN').reduce((s: number, h: Holding) => s + h.marketValue, 0) },
  ].filter(d => d.value > 0)
  const total = data.reduce((s: number, d) => s + d.value, 0)
  const COLORS = [C.blue, C.yellow, C.red]
  if (total === 0) return <div style={{ color: C.text3, fontSize: 12 }}>暂无数据</div>
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <PieChart width={120} height={120}>
        <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={56} dataKey="value" strokeWidth={0}>
          {data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
      </PieChart>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d: { name: string; value: number }, i: number) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
            <span style={{ fontSize: 12, color: C.text2 }}>{d.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.text, marginLeft: 'auto' }}>
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Changes Bar ────────────────────────────────────────────────────────────────
function ChangesBar({ changes }: { changes: HoldingChange[] }) {
  const data = [...changes]
    .sort((a: HoldingChange, b: HoldingChange) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 8)
    .map((c: HoldingChange) => ({ ticker: c.stockTicker, pct: c.changePercent }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2030" />
        <XAxis dataKey="ticker" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickFormatter={v => `${v}%`} />
        <Tooltip
          contentStyle={{ backgroundColor: '#13141f', border: '1px solid #1e2030', borderRadius: 8, fontSize: 12 }}
          formatter={(val: any) => [typeof val === 'number' ? `${val > 0 ? '+' : ''}${val.toFixed(2)}%` : val, '变化']}
        />
        <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
          {data.map((entry: { pct: number }, i: number) => (
            <Cell key={i} fill={entry.pct >= 0 ? C.green : C.red} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'institutions' | 'search' | 'changes' | 'alerts' | 'ai' | 'rankings' | 'overlap' | 'mine' | 'smallcap' | 'settings'
const NAV: { key: Tab; label: string; icon: any }[] = [
  { key: 'overview', label: '总览', icon: BarChart3 },
  { key: 'institutions', label: '机构', icon: Building2 },
  { key: 'search', label: '搜索', icon: Search },
  { key: 'changes', label: '异动', icon: TrendingUp },
  { key: 'alerts', label: '预警', icon: Bell },
  { key: 'ai', label: 'AI产业', icon: Cpu },
  { key: 'rankings', label: '增减持', icon: TrendingUp },
  { key: 'overlap', label: '持仓重叠', icon: BarChart3 },
  { key: 'mine', label: '我的持仓', icon: Wallet },
  { key: 'smallcap', label: '小盘股', icon: Star },
  { key: 'settings', label: '设置', icon: Settings },
]

const defaultAlertRules: AlertRule[] = _defaultAlertRules

export default function SmartMoney() {
  const [tab, setTab] = useState<Tab>('overview')
  const [instFilter, setInstFilter] = useState<number | null>(null)
  const [instDetailId, setInstDetailId] = useState<number | null>(null)
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'US' | 'HK' | 'CN'>('ALL')
  const [changeType, setChangeType] = useState<'all' | 'increase' | 'decrease' | 'new' | 'exited'>('all')
  const [chartMarket, setChartMarket] = useState<'ALL' | 'US' | 'HK' | 'CN'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [alertOnly, setAlertOnly] = useState(false)
  const [rules, setRules] = useState<AlertRule[]>(defaultAlertRules)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleForm, setRuleForm] = useState({ ticker: '', threshold: 20, email: true, feishu: false })
  const [prices, setPrices] = useState<Map<string, StockPrice>>(new Map())
  const [pricesLoading, setPricesLoading] = useState(false)
  const [pricesError, setPricesError] = useState(false)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string>('—')
  const [showDataSourcePanel, setShowDataSourcePanel] = useState(false)

  // ── Fetch live stock prices ───────────────────────────────────────────────
  const refreshPrices = () => {
    const tickers = [...new Set(ALL_HOLDINGS.map(h => h.stockTicker))]
    setPricesLoading(true)
    setPricesError(false)
    getStockPrices(tickers).then(result => {
      setPrices(result)
      setPricesLoading(false)
      setPricesError(result.size === 0)
      setLastPriceUpdate(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }).catch(() => { setPricesLoading(false); setPricesError(true) })
  }

  useEffect(() => {
    refreshPrices()
  }, [])

  // ── Data status ─────────────────────────────────────────────────────────────
  const lastUpdatedLabel = getLastUpdated()
  const dataSourceLabel = getDataSourceLabel()
  const sources = getDataSources()
  const isLiveData = sources.some((s: any) => s.freshness === 'live')

  // Compute stats
  const stats = useMemo(() => {
    const totalValue = ALL_HOLDINGS.reduce((s: number, h: Holding) => s + h.marketValue, 0)
    const topGainer = [...ALL_HOLDINGS].sort((a: Holding, b: Holding) => b.changePercent - a.changePercent)[0]
    const topLoser = [...ALL_HOLDINGS].sort((a: Holding, b: Holding) => a.changePercent - b.changePercent)[0]
    const inst = topGainer ? institutions.find((x: Institution) => x.id === topGainer.institutionId) : null
    const loserInst = topLoser ? institutions.find((x: Institution) => x.id === topLoser.institutionId) : null
    return {
      totalValue,
      topGainer: { ticker: topGainer?.stockTicker || '', institution: inst?.name || '', change: topGainer?.changePercent || 0 },
      topLoser: { ticker: topLoser?.stockTicker || '', institution: loserInst?.name || '', change: topLoser?.changePercent || 0 },
      lastUpdated: lastUpdatedLabel || '2025 Q4',
    }
  }, [lastUpdatedLabel])

  const filteredHoldings = useMemo(() => {
    let list = ALL_HOLDINGS
    if (instFilter !== null) list = list.filter((h: Holding) => h.institutionId === instFilter)
    if (marketFilter !== 'ALL') list = list.filter((h: Holding) => h.market === marketFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((h: Holding) => h.stockTicker.toLowerCase().includes(q) || h.stockName.includes(q))
    }
    if (alertOnly) list = list.filter((h: Holding) => Math.abs(h.changePercent) >= 20)
    return list
  }, [instFilter, marketFilter, searchQuery, alertOnly])

  const filteredChanges = useMemo(() => {
    let list = ALL_CHANGES
    if (changeType !== 'all') list = list.filter((c: HoldingChange) => c.changeType === changeType)
    if (instFilter !== null) list = list.filter((c: HoldingChange) => c.institutionId === instFilter)
    if (chartMarket !== 'ALL') {
      list = list.filter((c: HoldingChange) => {
        if (chartMarket === 'US') return !c.stockTicker.includes('.HK') && !c.stockTicker.match(/^\d{6}$/)
        if (chartMarket === 'HK') return c.stockTicker.includes('.HK')
        if (chartMarket === 'CN') return !!c.stockTicker.match(/^\d{6}$/)
        return true
      })
    }
    return [...list].sort((a: HoldingChange, b: HoldingChange) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
  }, [changeType, instFilter, chartMarket])

  const selectedInst = instFilter !== null ? institutions.find((x: Institution) => x.id === instFilter) : null

  const addRule = () => {
    if (!ruleForm.ticker) return
    setRules((prev: AlertRule[]) => [{
      id: Date.now(), stockTicker: ruleForm.ticker.toUpperCase(),
      stockName: ruleForm.ticker.toUpperCase(), institutionIds: 'all',
      thresholdPercent: ruleForm.threshold, notifyEmail: ruleForm.email,
      notifyFeishu: ruleForm.feishu, isActive: true,
      createdAt: new Date().toISOString().slice(0, 10),
    } as AlertRule, ...prev])
    setRuleForm({ ticker: '', threshold: 20, email: true, feishu: false })
    setShowRuleForm(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: `${C.bg}ee`, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          background: `linear-gradient(90deg, ${C.blue}08 0%, transparent 60%)`,
          borderBottom: `1px solid ${C.border}`,
          padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 20, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.blue}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={15} color={C.blue} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>聪明钱去了哪儿</div>
              <div style={{ fontSize: 10, color: C.text3 }}>Smart Money Tracker · {institutions.length}家机构</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 20, overflow: 'hidden', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
            {institutions.slice(0, 7).map((inst: Institution) => (
              <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <span style={{ color: inst.color, fontWeight: 700 }}>{inst.name}</span>
                <span style={{ color: C.text3 }}>{fmtN(inst.totalValue)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 9999,
              background: isLiveData ? `${C.green}12` : `${C.yellow}12`,
              border: `1px solid ${isLiveData ? C.green + '30' : C.yellow + '30'}`,
              fontSize: 11, color: isLiveData ? C.green : C.yellow,
            }}>
              <CheckCircle2 size={11} />
              {stats.lastUpdated}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 9999,
              background: isLiveData ? `${C.blue}12` : `${C.text3}12`,
              border: `1px solid ${isLiveData ? C.blue + '30' : C.text3 + '30'}`,
              fontSize: 11, color: isLiveData ? C.blue : C.text3,
            }}>
              <Globe size={11} />
              {dataSourceLabel}
            </div>
            <button
              onClick={() => setShowDataSourcePanel(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 9999,
                background: `${C.blue}12`, border: `1px solid ${C.blue}30`,
                fontSize: 11, color: C.blue, cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Database size={11} />
              数据源
            </button>
            {pricesError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 9999,
                background: `${C.red}12`, border: `1px solid ${C.red}30`,
                fontSize: 10, color: C.red,
              }}>
                <AlertTriangle size={10} />
                价格已过期
              </div>
            )}
            <button
              onClick={refreshPrices}
              title={`刷新价格 (上次: ${lastPriceUpdate})`}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 9999,
                background: pricesLoading ? `${C.yellow}12` : pricesError ? `${C.red}12` : `${C.green}12`,
                border: `1px solid ${pricesLoading ? C.yellow + '30' : pricesError ? C.red + '30' : C.green + '30'}`,
                fontSize: 11, color: pricesLoading ? C.yellow : pricesError ? C.red : C.green,
                cursor: pricesLoading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw size={11} style={pricesLoading ? { animation: 'spin 1s linear infinite' } : {}} />
              {pricesLoading ? '刷新中…' : pricesError ? '重试价格' : '刷新价格'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', padding: '0 24px', gap: 2 }}>
          {NAV.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === key ? 600 : 400,
              color: tab === key ? C.blue : C.text3,
              borderBottom: `2px solid ${tab === key ? C.blue : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.15s',
            }}>
              <Icon size={14} />
              {label}
              {key === 'alerts' && rules.filter((r: AlertRule) => r.isActive).length > 0 && (
                <span style={{ background: `${C.blue}30`, color: C.blue, fontSize: 10, padding: '1px 5px', borderRadius: 9999, fontWeight: 700 }}>
                  {rules.filter((r: AlertRule) => r.isActive).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>

        {/* ══ OVERVIEW ═══════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div>
            {(() => {
              // Compute live portfolio total using real-time prices
              const liveTotal = ALL_HOLDINGS.reduce((sum: number, h: Holding) => {
                const price = prices.get(h.stockTicker)
                if (price) {
                  return sum + price.price * h.shares
                }
                return sum + h.marketValue
              }, 0)
              const liveCount = [...prices.values()].length
              const totalTickers = [...new Set(ALL_HOLDINGS.map((h: Holding) => h.stockTicker))].length
              return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 14 }} data-stat-grid>
              <StatCard icon={Building2} label="覆盖机构" value={`${institutions.length}家`} sub="全球顶级主权 & 机构基金" color={C.blue} />
              <StatCard icon={DollarSign} label="实时持仓总值" value={fmt$(liveTotal)} sub={liveCount > 0 ? `${liveCount}/${totalTickers}只已实时报价` : '加载中…'} color={C.green} />
              <StatCard icon={BarChart3} label="披露持仓市值" value={fmt$(stats.totalValue)} sub="2025 Q4 披露值" color={C.yellow} />
              <StatCard icon={TrendingUp} label="本季增持王" value={stats.topGainer.ticker} sub={`${stats.topGainer.institution} · ${pct(stats.topGainer.change)}`} color={C.green} />
              <StatCard icon={TrendingDown} label="本季减持王" value={stats.topLoser.ticker} sub={`${stats.topLoser.institution} · ${pct(stats.topLoser.change)}`} color={C.red} />
            </div>
              )
            })()}

            {/* 数据源状态概览 */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Clock size={13} color={C.text2} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>数据来源</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: C.text3 }}>鼠标悬停持仓行查看数据更新时间</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {getDataSources().map(s => (
                  <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0d0d0d', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.freshness === 'live' ? C.green : s.freshness === 'recent' ? C.yellow : C.text3, flexShrink: 0, boxShadow: `0 0 6px ${s.freshness === 'live' ? C.green : C.yellow}` }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.labelShort}</span>
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: `${s.color}18`, color: s.freshness === 'live' ? C.green : s.freshness === 'recent' ? C.yellow : C.text3, fontWeight: 700 }}>
                          {s.freshness === 'live' ? '实时' : s.freshness === 'recent' ? '近期' : '历史'}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{s.updateFreq}</div>
                      <div style={{ fontSize: 11, color: C.text2, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                        {s.lastUpdated} · {s.recordCount}条记录
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ AI 产业链追踪 ══════════════════════════════════════════════════ */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Cpu size={14} color={C.blue} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>AI 产业链追踪</span>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${C.blue}18`, color: C.blue, fontWeight: 700 }}>机构持仓</span>
                </div>
                <span style={{ fontSize: 11, color: C.text3, marginLeft: 'auto' }}>鼠标悬停查看详情</span>
              </div>

              {/* AI Layer Strip — 来自真实机构持仓数据 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }} data-ai-strip>
                {AI_LAYERS.map(layer => {
                  const stats = getLayerStatsFromHoldings(layer.layer)
                  const change = stats.avgChange
                  const changeColor = change >= 0 ? C.green : C.red
                  const changeLabel = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`
                  return (
                    <div key={layer.layer} style={{
                      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                      padding: '12px 14px', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = layer.color + '50'; e.currentTarget.style.background = layer.color + '08'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 14 }}>{layer.layer === 'chip' ? '🟠' : layer.layer === 'cloud' ? '🔵' : layer.layer === 'app' ? '🟢' : layer.layer === 'robot' ? '🟣' : '🔴'}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: layer.color }}>{layer.labelShort}</span>
                      </div>
                      <div style={{ fontSize: 10, color: C.text3, marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                        {stats.topTickers.length > 0 ? stats.topTickers.join(' ') : layer.keywords.slice(0, 4).join(' ')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: changeColor, fontFamily: 'JetBrains Mono, monospace' }}>{changeLabel}</span>
                        <span style={{ fontSize: 9, color: C.text3 }}>{stats.instCount}家机构</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 小盘股建仓信号 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Star size={13} color={C.yellow} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>小盘股建仓监测</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {[
                      { label: '🆕 新建仓', color: C.red },
                      { label: '📈 持续买入', color: C.green },
                      { label: '⚡ Momentum', color: C.yellow },
                    ].map(b => (
                      <span key={b.label} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${b.color}15`, color: b.color, fontWeight: 700 }}>{b.label}</span>
                    ))}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }} data-smallcap-grid>
                  {SMALL_CAP_TRACKED.map(meta => {
                    const tickerHoldings = ALL_HOLDINGS.filter(h => h.stockTicker === meta.ticker)
                    const instCount = tickerHoldings.length
                    const avgChange = instCount > 0
                      ? tickerHoldings.reduce((s, h) => s + h.changePercent, 0) / instCount
                      : 0
                    const signal = meta.isNewPosition ? '🆕' : meta.instAccumulating ? '📈' : '⚡'
                    const signalColor = meta.isNewPosition ? C.red : meta.instAccumulating ? C.green : C.yellow
                    const changeLabel = avgChange >= 0 ? `+${avgChange.toFixed(1)}%` : `${avgChange.toFixed(1)}%`
                    return (
                      <div key={meta.ticker} style={{
                        background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: 8,
                        padding: '10px 12px', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = signalColor + '40'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{meta.ticker}</span>
                          <span style={{ fontSize: 13 }}>{signal}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>{meta.name}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: signalColor, fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>{changeLabel}</div>
                        <div style={{ fontSize: 9, color: C.text3 }}>{instCount > 0 ? `${instCount}家机构` : '暂无机构持仓'}</div>
                        <div style={{ fontSize: 9, color: C.text3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.notes}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <button onClick={() => setAlertOnly(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                background: alertOnly ? `${C.yellow}18` : 'transparent',
                border: `1px solid ${alertOnly ? C.yellow + '50' : C.border}`,
                color: alertOnly ? C.yellow : C.text3, fontSize: 12, fontWeight: 500,
              }}>
                <AlertTriangle size={13} />仅显示大幅异动（≥20%）
              </button>
              {(marketFilter !== 'ALL' || alertOnly) && (
                <button onClick={() => { setMarketFilter('ALL'); setAlertOnly(false) }} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px', borderRadius: 8,
                  background: `${C.red}10`, border: `1px solid ${C.red}30`,
                  color: C.red, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}>
                  重置筛选
                </button>
              )}
              <div style={{ marginLeft: 'auto', fontSize: 12, color: C.text3, fontFamily: 'JetBrains Mono, monospace' }}>
                {filteredHoldings.length}/{ALL_HOLDINGS.length} 条记录
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>持仓明细</span>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                    {(['ALL', 'US', 'HK', 'CN'] as const).map(m => (
                      <button key={m} onClick={() => setMarketFilter(m)} style={{
                        padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: marketFilter === m ? `${C.blue}20` : 'transparent',
                        border: `1px solid ${marketFilter === m ? C.blue + '40' : C.border}`,
                        color: marketFilter === m ? C.blue : C.text3, cursor: 'pointer',
                      }}>
                        {{ ALL: '全部', US: '🇺🇸美股', HK: '🇭🇰港股', CN: '🇨🇳A股' }[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <HoldingsTable prices={prices} holdings={filteredHoldings} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text3, marginBottom: 14 }}>市场分布</div>
                  <MarketPie holdings={filteredHoldings} />
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text3, marginBottom: 14 }}>板块分布</div>
                  <Suspense fallback={<LazyLoader h={300} />}><SectorHeatmap holdings={filteredHoldings} /></Suspense>
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text3 }}>季度异动 Top 8</div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {([['ALL','整体'],['US','🇺🇸美股'],['HK','🇭🇰港股'],['CN','🇨🇳A股']] as [string,string][]).map(([k, label]) => (
                        <button key={k} onClick={() => setChartMarket(k as any)} style={{
                          padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: chartMarket === k ? `${C.blue}20` : 'transparent',
                          border: `1px solid ${chartMarket === k ? C.blue + '40' : C.border}`,
                          color: chartMarket === k ? C.blue : C.text3, cursor: 'pointer',
                        }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <ChangesBar changes={filteredChanges} />
                </div>


              </div>
            </div>
          </div>
        )}

                {/* ══ INSTITUTIONS ══════════════════════════════════════════════════ */}
        {tab === 'institutions' && (
          <div>
            {instDetailId !== null ? (
              <InstitutionDetailPage
                institutionId={instDetailId}
                onBack={() => setInstDetailId(null)}
              />
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {institutions.map((inst: Institution) => {
                    const instHoldings = ALL_HOLDINGS.filter((h: Holding) => h.institutionId === inst.id)
                    const totalVal = instHoldings.reduce((s: number, h: Holding) => s + h.marketValue, 0)
                    const instTypeLabel: Record<string, string> = { hedge: '对冲基金', bank: '投资银行', asset_manager: '资产管理', sovereign: '主权基金' }
                    return (
                      <div
                        key={inst.id}
                        onClick={() => { setInstFilter(inst.id); setInstDetailId(inst.id) }}
                        style={{
                          background: C.card, border: `1px solid ${inst.color}30`,
                          borderRadius: 14, padding: '18px 20px',
                          cursor: 'pointer', transition: 'all 0.15s',
                          position: 'relative', overflow: 'hidden',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = inst.color + '60'; (e.currentTarget as HTMLElement).style.background = inst.color + '08' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = inst.color + '30'; (e.currentTarget as HTMLElement).style.background = C.card }}
                      >
                        <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: inst.color + '10' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: inst.color + '20', border: `1px solid ${inst.color}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, fontWeight: 900, color: inst.color,
                          }}>{inst.name[0]}</div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{inst.name}</div>
                            <div style={{ fontSize: 11, color: C.text3 }}>{instTypeLabel[inst.type] || inst.type}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, color: C.text3 }}>披露市值</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: inst.color, fontFamily: 'JetBrains Mono, monospace' }}>
                              ${(totalVal / 1e9).toFixed(1)}B
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: C.text3 }}>持股数</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: C.text2 }}>{instHoldings.length}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: C.text3 }}>
                          {inst.country} · {inst.nameEn}
                        </div>
                        <div style={{ fontSize: 10, color: inst.color, marginTop: 6 }}>
                          点击查看详情 →
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ SEARCH ══════════════════════════════════════════════════════ */}
        {tab === 'search' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>持仓搜索</h2>
              <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>输入股票代码或名称，查看哪些机构持有</p>
            </div>
            <div style={{ position: 'relative', maxWidth: 560, marginBottom: 20 }}>
              <Search size={16} color={C.text3} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索股票代码或名称，如：AAPL、微软、腾讯..."
                style={{
                  width: '100%', padding: '12px 14px 12px 42px', borderRadius: 10,
                  background: C.card, border: `1px solid ${C.border}`,
                  color: C.text, fontSize: 14, boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
              {['AAPL', 'MSFT', 'NVDA', 'TSLA', 'META', 'GOOGL', 'AMZN', 'JPM', 'BRK.B', '0700.HK', '600519', '601318'].map(s => (
                <button
                  key={s}
                  onClick={() => setSearchQuery(s)}
                  style={{
                    padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                    background: searchQuery === s ? `${C.blue}20` : 'transparent',
                    border: `1px solid ${searchQuery === s ? C.blue + '40' : C.border}`,
                    color: searchQuery === s ? C.blue : C.text2, cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {searchQuery && filteredHoldings.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: C.blue }}>
                    {searchQuery.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 13, color: C.text3 }}>
                    被 {filteredHoldings.length} 家机构持有
                  </span>
                </div>
                <HoldingsTable prices={prices} holdings={filteredHoldings} />
              </div>
            )}
            {searchQuery && filteredHoldings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.text3 }}>
                <Search size={32} style={{ opacity: 0.3, marginBottom: 12, margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14 }}>未找到相关持仓</div>
              </div>
            )}
          </div>
        )}

        {/* ══ CHANGES ══════════════════════════════════════════════════════ */}
        {tab === 'changes' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { k: 'all' as const, l: '全部' },
                  { k: 'increase' as const, l: '↑ 增持' },
                  { k: 'decrease' as const, l: '↓ 减持' },
                  { k: 'new' as const, l: '✨ 新建仓' },
                  { k: 'exited' as const, l: '✕ 清仓' },
                ].map(({ k, l }) => (
                  <button key={k} onClick={() => setChangeType(k)} style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: changeType === k ? `${C.blue}20` : 'transparent',
                    border: `1px solid ${changeType === k ? C.blue + '40' : C.border}`,
                    color: changeType === k ? C.blue : C.text3, cursor: 'pointer',
                  }}>
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: C.text3, fontFamily: 'JetBrains Mono, monospace' }}>
                {filteredChanges.length} 条异动
              </div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
              <ChangesTable changes={filteredChanges} />
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>异动幅度可视化</div>
              <ChangesBar changes={filteredChanges} />
            </div>
          </div>
        )}

        {/* ══ ALERTS ═══════════════════════════════════════════════════════ */}
        {tab === 'alerts' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>预警规则</h2>
                <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>当机构持仓变化超过阈值时，自动发送通知</p>
              </div>
              <button
                onClick={() => setShowRuleForm(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8,
                  background: `${C.blue}18`, border: `1px solid ${C.blue}40`,
                  color: C.blue, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Plus size={14} /> 新建规则
              </button>
            </div>

            {showRuleForm && (
              <div style={{
                background: C.card, border: `1px solid ${C.blue}40`,
                borderRadius: 12, padding: 24, marginBottom: 20,
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 6 }}>股票代码</label>
                    <input
                      value={ruleForm.ticker}
                      onChange={e => setRuleForm(f => ({ ...f, ticker: e.target.value }))}
                      placeholder="如：AAPL MSFT NVDA"
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        background: '#0d0d0d', border: `1px solid ${C.border}`,
                        color: C.text, fontSize: 13, fontFamily: 'JetBrains Mono, monospace', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 6 }}>触发阈值（%）</label>
                    <input
                      type="number"
                      value={ruleForm.threshold}
                      onChange={e => setRuleForm(f => ({ ...f, threshold: Number(e.target.value) }))}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        background: '#0d0d0d', border: `1px solid ${C.border}`,
                        color: C.text, fontSize: 13, boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 16, alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={ruleForm.email} onChange={e => setRuleForm(f => ({ ...f, email: e.target.checked }))} style={{ accentColor: C.blue }} />
                    <span style={{ fontSize: 13, color: C.text2 }}>📧 邮件通知</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={ruleForm.feishu} onChange={e => setRuleForm(f => ({ ...f, feishu: e.target.checked }))} style={{ accentColor: C.blue }} />
                    <span style={{ fontSize: 13, color: C.text2 }}>📨 飞书推送</span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={addRule} style={{
                    padding: '8px 20px', borderRadius: 8, background: C.blue, border: 'none',
                    color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>
                    保存规则
                  </button>
                  <button onClick={() => setShowRuleForm(false)} style={{
                    padding: '8px 20px', borderRadius: 8,
                    background: 'transparent', border: `1px solid ${C.border}`,
                    color: C.text2, fontSize: 13, cursor: 'pointer',
                  }}>
                    取消
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rules.map((rule: AlertRule) => (
                <div key={rule.id} style={{
                  background: C.card, border: `1px solid ${rule.isActive ? C.blue + '33' : C.border}`,
                  borderRadius: 10, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.blue }}>
                        {rule.stockTicker}
                      </span>
                      <span style={{ fontSize: 11, color: C.text3 }}>变化 ≥ {rule.thresholdPercent}%</span>
                      {rule.notifyFeishu && <span style={{ fontSize: 11 }}>📨</span>}
                      {rule.notifyEmail && <span style={{ fontSize: 11 }}>📧</span>}
                    </div>
                    <div style={{ fontSize: 11, color: C.text3 }}>创建于 {rule.createdAt}</div>
                  </div>
                  <Toggle value={rule.isActive} onChange={() => setRules(prev => prev.map((r: AlertRule) => r.id === rule.id ? { ...r, isActive: !r.isActive } : r))} />
                  <button onClick={() => setRules(prev => prev.filter((r: AlertRule) => r.id !== rule.id))} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', color: C.text3, padding: 4,
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ SETTINGS ═══════════════════════════════════════════════════════ */}
        {tab === 'ai' && <AIChainPanel />}
        {tab === 'rankings' && <Suspense fallback={<LazyLoader />}><InstitutionRankings /></Suspense>}
        {tab === 'overlap' && <Suspense fallback={<LazyLoader />}><InstitutionOverlap /></Suspense>}
        {tab === 'mine' && <Suspense fallback={<LazyLoader />}><KevinPortfolio /></Suspense>}
        {tab === 'smallcap' && <SmallCapPage />}
        {tab === 'settings' && (
          <div style={{ maxWidth: 680 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 24px' }}>设置</h2>

            {[
              { title: '飞书 Webhook', desc: '预警消息推送地址', value: 'https://open.feishu.cn/open-apis/bot/v2/hook/acb1705d-***', badge: '已配置', badgeColor: C.green },
              { title: '邮件通知', desc: '接收预警邮件的邮箱地址', value: 'kevin@***.com', badge: '已配置', badgeColor: C.green },
            ].map(({ title, desc, value, badge, badgeColor }: any) => (
              <div key={title} style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: 18, marginBottom: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</span>
                  <span style={{
                    fontSize: 11, color: badgeColor,
                    background: `${badgeColor}18`, padding: '2px 8px', borderRadius: 9999, fontWeight: 600,
                  }}>
                    {badge}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.text3, marginBottom: 10 }}>{desc}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text2, background: '#0d0d0d', padding: '8px 12px', borderRadius: 6 }}>
                  {value}
                </div>
              </div>
            ))}

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>数据刷新频率</div>
              <div style={{ fontSize: 12, color: C.text3, marginBottom: 12 }}>GitHub Actions 自动抓取 SEC EDGAR 13F 披露数据</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['每6小时', '每12小时', '每日'] as const).map((f: string, i: number) => (
                  <button key={f} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: i === 0 ? `${C.blue}20` : 'transparent',
                    border: `1px solid ${i === 0 ? C.blue + '40' : C.border}`,
                    color: i === 0 ? C.blue : C.text3, cursor: 'pointer',
                  }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>数据来源</div>
              <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.8 }}>
                · SEC EDGAR 13F-HR 披露文件（每季度结束后45天内更新）<br />
                · HKEX 披露易股权变动数据<br />
                · 东方财富 QFII 持股数据<br />
                · 数据截止：{stats.lastUpdated}
              </div>
              <div style={{ marginTop: 14 }}>
                <a href="https://github.com/Roloria/smart-money-tracker" target="_blank" rel="noopener" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, color: C.blue, textDecoration: 'none',
                }}>
                  <ExternalLink size={12} /> GitHub 仓库
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {showDataSourcePanel && (
        <Suspense fallback={<LazyLoader h={500} />}><DataSourcePanel onClose={() => setShowDataSourcePanel(false)} /></Suspense>
      )}
    </div>
  )
}
