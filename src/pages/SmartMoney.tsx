import { useState, useMemo } from 'react'
import {
  BarChart3,
  Building2,
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Filter,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { INSTITUTIONS, HOLDINGS, ALERT_LOGS, STATS_SUMMARY, type Institution, type Holding } from '../lib/mock-data'
import { formatCurrency, formatShares, formatPercent, changeClass, abbreviateMarket, cn } from '../lib/utils'

// ============================================================
// Sub-components
// ============================================================

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: string
}) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={cn('p-2.5 rounded-lg', accent || 'bg-accent-blue/10')}>
        <Icon className={cn('w-4 h-4', accent ? 'text-inherit' : 'text-accent-blue')} />
      </div>
      <div>
        <div className="text-xs text-text-muted mb-0.5">{label}</div>
        <div className="text-lg font-mono font-bold text-text-primary">{value}</div>
        {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function InstitutionChip({ inst, active, onClick }: {
  inst: Institution
  active: boolean
  onClick: () => void
}) {
  const typeColors: Record<string, string> = {
    hedge: 'border-accent-yellow/40 text-accent-yellow',
    sovereign: 'border-accent-cyan/40 text-accent-cyan',
    asset_manager: 'border-accent-blue/40 text-accent-blue',
    bank: 'border-white/20 text-text-secondary',
  }
  const typeLabels: Record<string, string> = {
    hedge: '对冲基金',
    sovereign: '主权基金',
    asset_manager: '资管',
    bank: '银行',
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        'institution-chip text-left gap-2',
        active && inst.id === 0 ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' :
        active ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : ''
      )}
    >
      <Building2 className="w-3 h-3 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{inst.nameCn}</div>
        <div className={cn('text-xs mt-0.5 px-1.5 py-0.5 rounded border inline-block', typeColors[inst.type])}>
          {typeLabels[inst.type]}
        </div>
      </div>
    </button>
  )
}

function ChangeBadge({ value, label }: { value: number; label?: string }) {
  if (value === 0) return <span className="text-text-muted text-xs">—</span>
  const cls = value > 0 ? 'text-gain' : 'text-loss'
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-mono font-semibold', cls)}>
      {value > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {formatPercent(value)}
      {label && <span className="text-text-muted font-normal ml-1">{label}</span>}
    </span>
  )
}

function HoldingsTable({ holdings, institutionName }: { holdings: Holding[]; institutionName?: string }) {
  const [sortField, setSortField] = useState<'value' | 'change' | 'shares'>('value')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    return [...holdings].sort((a, b) => {
      let va = 0, vb = 0
      if (sortField === 'value') { va = a.marketValueUsd; vb = b.marketValueUsd }
      if (sortField === 'change') { va = a.sharesChangePercent || 0; vb = b.sharesChangePercent || 0 }
      if (sortField === 'shares') { va = a.shares; vb = b.shares }
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }, [holdings, sortField, sortDir])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 inline ml-1" />
      : <ChevronUp className="w-3 h-3 inline ml-1" />
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-10">#</th>
            <th>标的</th>
            <th>市场</th>
            <th className="cursor-pointer" onClick={() => toggleSort('value')}>
              <span className="inline-flex items-center">持仓市值（USD）<SortIcon field="value" /></span>
            </th>
            <th className="cursor-pointer" onClick={() => toggleSort('shares')}>
              <span className="inline-flex items-center">持股数量 <SortIcon field="shares" /></span>
            </th>
            <th>持股占比</th>
            <th className="cursor-pointer" onClick={() => toggleSort('change')}>
              <span className="inline-flex items-center">季度变化 <SortIcon field="change" /></span>
            </th>
            <th>所属机构数</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-12 text-text-muted">
                <div className="flex flex-col items-center gap-2">
                  <Search className="w-8 h-8 opacity-30" />
                  <div>暂无数据</div>
                </div>
              </td>
            </tr>
          ) : sorted.map((h, i) => (
            <tr key={h.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
              <td className="text-text-muted text-xs">{i + 1}</td>
              <td>
                <div className="flex flex-col">
                  <span className="font-mono font-semibold text-text-primary">{h.ticker}</span>
                  <span className="text-xs text-text-muted truncate max-w-[160px]">{h.stockName}</span>
                </div>
              </td>
              <td>
                <span className="text-xs">{abbreviateMarket(h.market)}</span>
              </td>
              <td className="font-mono font-medium">
                {formatCurrency(h.marketValueUsd)}
              </td>
              <td className="font-mono text-text-secondary text-xs">
                {formatShares(h.shares)}
              </td>
              <td>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs">{h.ownershipPercent.toFixed(2)}%</span>
                  <div className="w-16 h-1 bg-bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-blue rounded-full"
                      style={{ width: `${Math.min(h.ownershipPercent * 5, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td>
                <ChangeBadge value={h.sharesChangePercent || 0} label="shares" />
              </td>
              <td>
                <span className="badge badge-institution">
                  {HOLDINGS.filter(x => x.ticker === h.ticker).length}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MarketAllocationChart({ holdings }: { holdings: Holding[] }) {
  const data = [
    { name: '美国 🇺🇸', value: holdings.filter(h => h.market === 'US').reduce((s, h) => s + h.marketValueUsd, 0), color: '#3b82f6' },
    { name: '香港 🇭🇰', value: holdings.filter(h => h.market === 'HK').reduce((s, h) => s + h.marketValueUsd, 0), color: '#f59e0b' },
    { name: '中国A股 🇨🇳', value: holdings.filter(h => h.market === 'CN').reduce((s, h) => s + h.marketValueUsd, 0), color: '#ef4444' },
  ].filter(d => d.value > 0)

  if (data.length === 0) return null
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex items-center gap-4">
      <div className="w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={56} dataKey="value" strokeWidth={0}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-text-secondary">{d.name}</span>
            <span className="font-mono font-semibold text-text-primary ml-auto pl-4">
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopChangesChart({ holdings }: { holdings: Holding[] }) {
  const topGainers = [...holdings]
    .filter(h => (h.sharesChangePercent || 0) > 0)
    .sort((a, b) => (b.sharesChangePercent || 0) - (a.sharesChangePercent || 0))
    .slice(0, 6)
  const topLosers = [...holdings]
    .filter(h => (h.sharesChangePercent || 0) < 0)
    .sort((a, b) => (a.sharesChangePercent || 0) - (b.sharesChangePercent || 0))
    .slice(0, 6)
  const data = [
    ...topLosers.map(h => ({ ticker: h.ticker, pct: h.sharesChangePercent || 0, inst: INSTITUTIONS.find(i => i.id === h.institutionId)?.nameCn || '' })),
    ...topGainers.map(h => ({ ticker: h.ticker, pct: h.sharesChangePercent || 0, inst: INSTITUTIONS.find(i => i.id === h.institutionId)?.nameCn || '' })),
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2030" />
        <XAxis dataKey="ticker" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickFormatter={v => `${v}%`} />
        <Tooltip
          contentStyle={{ backgroundColor: '#13141f', border: '1px solid #1e2030', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          formatter={(val) => [formatPercent(Number(val)), '季度变化']}
          itemStyle={{ color: '#e2e8f0' }}
        />
        <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.pct >= 0 ? '#22c55e' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function AlertLogRow({ log }: { log: typeof ALERT_LOGS[0] }) {
  const isGain = log.direction === 'increase'
  return (
    <div className={cn('alert-card p-4 flex items-center gap-3 animate-fade-in', isGain ? 'alert-card-gain' : 'alert-card-loss')}>
      <div className={cn('p-2 rounded-lg shrink-0', isGain ? 'bg-gain/10' : 'bg-loss/10')}>
        {isGain
          ? <TrendingUp className="w-4 h-4 text-gain" />
          : <TrendingDown className="w-4 h-4 text-loss" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-text-primary">{log.ticker}</span>
          <span className="text-text-muted text-xs">by {log.institutionName}</span>
          <span className={cn('badge ml-auto font-mono', isGain ? 'badge-gain' : 'badge-loss')}>
            {formatPercent(log.changePct)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
          <Clock className="w-3 h-3" />
          <span>{log.quarter}</span>
          <span>·</span>
          <span>{log.notifiedAt}</span>
          <span>·</span>
          <span className="uppercase">{log.channel}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================

export default function SmartMoney() {
  const [selectedInst, setSelectedInst] = useState<number | null>(null)
  const [selectedMarket, setSelectedMarket] = useState<'ALL' | 'US' | 'HK' | 'CN'>('ALL')
  const [search, setSearch] = useState('')
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false)
  const [activeTab, setActiveTab] = useState<'holdings' | 'alerts' | 'overview'>('overview')

  const filteredHoldings = useMemo(() => {
    let list = HOLDINGS
    if (selectedInst !== null && selectedInst !== 0) {
      list = list.filter(h => h.institutionId === selectedInst)
    }
    if (selectedMarket !== 'ALL') {
      list = list.filter(h => h.market === selectedMarket)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(h =>
        h.ticker.toLowerCase().includes(q) ||
        h.stockName.toLowerCase().includes(q)
      )
    }
    if (showOnlyAlerts) {
      list = list.filter(h => Math.abs(h.sharesChangePercent || 0) >= 20)
    }
    return list
  }, [selectedInst, selectedMarket, search, showOnlyAlerts])

  const institutionName = selectedInst !== null && selectedInst !== 0
    ? INSTITUTIONS.find(i => i.id === selectedInst)?.nameCn || ''
    : undefined

  const _sectors = ['全部', '对冲基金', '主权基金', '资产管理', '银行']

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/95 backdrop-blur border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-blue/10 rounded-lg">
              <Shield className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary tracking-tight">
                聪明钱去了哪儿
              </h1>
              <p className="text-xs text-text-muted">
                Smart Money Tracker · 10家机构 · 季度13F披露
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="badge badge-gain text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              最新: {STATS_SUMMARY.lastUpdated}
            </div>
            <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-bg-hover">
              <RefreshCw className="w-3.5 h-3.5" />
              刷新数据
            </button>
          </div>
        </div>

        {/* Ticker tape */}
        <div className="ticker-wrap bg-bg-secondary border-t border-border px-4 py-2 flex items-center gap-6">
          <div className="ticker">
            {[...filteredHoldings, ...filteredHoldings].map((h, i) => (
              <div key={i} className="ticker-badge mr-6">
                <span className="symbol">{h.ticker}</span>
                <span className="value">{formatCurrency(h.marketValueUsd)}</span>
                <span className={cn('font-semibold', changeClass(h.sharesChangePercent || 0))}>
                  {formatPercent(h.sharesChangePercent || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="px-6 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-4">
          {/* Stats */}
          <div className="card p-4 space-y-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              整体概览
            </div>
            <StatCard
              label="覆盖机构"
              value={`${STATS_SUMMARY.totalInstitutions} 家`}
              sub="10家顶级投资机构"
              icon={Building2}
              accent="bg-accent-blue/10 text-accent-blue"
            />
            <StatCard
              label="总持仓市值"
              value={formatCurrency(STATS_SUMMARY.totalValueUsd)}
              sub="截至最新披露季度"
              icon={BarChart3}
              accent="bg-accent-yellow/10 text-accent-yellow"
            />
            <StatCard
              label="本季增持王"
              value={STATS_SUMMARY.topGainer.ticker}
              sub={`${STATS_SUMMARY.topGainer.institution} · ${formatPercent(STATS_SUMMARY.topGainer.change)}`}
              icon={TrendingUp}
              accent="bg-gain/10 text-gain"
            />
            <StatCard
              label="本季减持王"
              value={STATS_SUMMARY.topLoser.ticker}
              sub={`${STATS_SUMMARY.topLoser.institution} · ${formatPercent(STATS_SUMMARY.topLoser.change)}`}
              icon={TrendingDown}
              accent="bg-loss/10 text-loss"
            />
          </div>

          {/* Institution filter */}
          <div className="card p-4 space-y-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              机构筛选
            </div>
            <button
              onClick={() => setSelectedInst(null)}
              className={cn('institution-chip w-full justify-between', selectedInst === null ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : '')}
            >
              <span className="font-medium">全部机构</span>
              <span className="badge badge-gain text-xs ml-auto mr-1">
                {INSTITUTIONS.length}
              </span>
            </button>
            <div className="space-y-1.5">
              {INSTITUTIONS.map(inst => (
                <InstitutionChip
                  key={inst.id}
                  inst={inst}
                  active={selectedInst === inst.id}
                  onClick={() => setSelectedInst(prev => prev === inst.id ? null : inst.id)}
                />
              ))}
            </div>
          </div>

          {/* Market filter */}
          <div className="card p-4 space-y-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              市场筛选
            </div>
            <div className="flex flex-col gap-1.5">
              {([
                ['ALL', '全部市场'],
                ['US', '🇺🇸 美股'],
                ['HK', '🇭🇰 港股'],
                ['CN', '🇨🇳 A股'],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSelectedMarket(val)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                    selectedMarket === val
                      ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Alert toggle */}
          <button
            onClick={() => setShowOnlyAlerts(v => !v)}
            className={cn(
              'card p-4 w-full flex items-center gap-2 text-sm transition-all',
              showOnlyAlerts
                ? 'border-accent-yellow/40 bg-accent-yellow/5 text-accent-yellow'
                : 'hover:bg-bg-hover'
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            仅显示大幅变动（≥20%）
            <div className={cn('w-8 h-4 rounded-full transition-colors ml-auto', showOnlyAlerts ? 'bg-accent-yellow' : 'bg-bg-secondary')} />
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-5 min-w-0">
          {/* Tab nav */}
          <div className="flex items-center gap-1 bg-bg-secondary rounded-lg p-1 w-fit">
            {([
              ['overview', '总览'],
              ['holdings', '持仓明细'],
              ['alerts', '预警记录'],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  activeTab === tab
                    ? 'bg-bg-card text-text-primary shadow-card'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {label}
                {tab === 'alerts' && <span className="ml-1.5 badge badge-gain text-xs">{ALERT_LOGS.length}</span>}
              </button>
            ))}
          </div>

          {/* === Overview Tab === */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Search + count bar */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="搜索股票代码或名称..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="search-input pl-9"
                  />
                </div>
                <div className="text-sm text-text-muted font-mono shrink-0">
                  {filteredHoldings.length} 条持仓记录
                </div>
              </div>

              {/* Market allocation + Top changes */}
              <div className="grid grid-cols-2 gap-5">
                <div className="card">
                  <div className="card-header flex items-center justify-between">
                    <h3 className="text-sm font-semibold">市场分布</h3>
                    <span className="text-xs text-text-muted">按持仓市值</span>
                  </div>
                  <div className="card-body">
                    <MarketAllocationChart holdings={filteredHoldings} />
                  </div>
                </div>
                <div className="card">
                  <div className="card-header flex items-center justify-between">
                    <h3 className="text-sm font-semibold">季度增持 / 减持排行</h3>
                    <span className="text-xs text-text-muted">Top 6 变化</span>
                  </div>
                  <div className="card-body">
                    <TopChangesChart holdings={filteredHoldings} />
                  </div>
                </div>
              </div>

              {/* Featured holdings preview */}
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {institutionName ? `${institutionName} · 持仓明细` : '全部持仓明细'}
                  </h3>
                  <div className="flex items-center gap-2">
                    {institutionName && (
                      <span className="badge badge-institution">{institutionName}</span>
                    )}
                    <span className="text-xs text-text-muted font-mono">{filteredHoldings.length} 只股票</span>
                  </div>
                </div>
                <div className="card-body p-0">
                  <HoldingsTable holdings={filteredHoldings} institutionName={institutionName} />
                </div>
              </div>
            </div>
          )}

          {/* === Holdings Tab === */}
          {activeTab === 'holdings' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="搜索股票代码或名称..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="search-input pl-9"
                  />
                </div>
                <div className="text-sm text-text-muted font-mono">
                  {filteredHoldings.length} 条记录
                </div>
              </div>
              <div className="card p-0">
                <HoldingsTable holdings={filteredHoldings} institutionName={institutionName} />
              </div>
            </div>
          )}

          {/* === Alerts Tab === */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="card flex-1 p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-accent-yellow" />
                  <div>
                    <div className="text-sm font-semibold">已触发预警</div>
                    <div className="text-xs text-text-muted">季度持仓大幅变动监控</div>
                  </div>
                  <span className="badge badge-gain text-sm ml-auto font-mono">{ALERT_LOGS.length}</span>
                </div>
              </div>
              <div className="space-y-3">
                {ALERT_LOGS.map(log => (
                  <AlertLogRow key={log.id} log={log} />
                ))}
              </div>
              {ALERT_LOGS.length === 0 && (
                <div className="card p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-gain/30 mb-3" />
                  <div className="text-text-muted">暂无预警记录</div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
