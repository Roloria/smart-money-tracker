import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { institutions, holdings, holdingChanges } from '../data/mockData'
import { getAllHoldings, getAllChanges } from '../data/realData'
import type { HoldingChange } from '../types'

// ── Design Tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0a', card: '#141414', border: '#1e1e1e',
  text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  green: '#22c55e', red: '#ef4444', yellow: '#f59e0b',
  blue: '#38bdf8', purple: '#a78bfa',
}

// ── Signal Types ────────────────────────────────────────────────────────────────
export type SignalType = 'strong_buy' | 'buy' | 'hold' | 'reduce' | 'strong_sell' | 'new_position'

export interface StockSignal {
  ticker: string
  name: string
  signal: SignalType
  signalLabel: string
  changePercent: number
  changeType: string
  institutionCount: number
  institutions: string[]
  avgChange: number
  sector: string
  marketValue: number
}

export interface SectorFlow {
  sector: string
  netFlow: number    // sum of all changePercents for this sector
  changeCount: number
  signal: 'inflow' | 'outflow' | 'neutral'
  topTicker: string
  topChange: number
}

// ── Signal Config ───────────────────────────────────────────────────────────────
const SIGNAL_CONFIG: Record<SignalType, { label: string; color: string; bg: string; border: string; icon: any }> = {
  strong_buy: { label: '强势买入', color: '#22c55e', bg: '#22c55e15', border: '#22c55e40', icon: ArrowUp },
  buy:        { label: '买入',     color: '#4ade80', bg: '#4ade8015', border: '#4ade8040', icon: TrendingUp },
  hold:       { label: '观望',     color: '#a1a1aa', bg: '#a1a1aa10', border: '#a1a1aa30', icon: Minus },
  reduce:     { label: '减仓',     color: '#fb923c', bg: '#fb923c15', border: '#fb923c40', icon: TrendingDown },
  strong_sell:{ label: '清仓警示', color: '#ef4444', bg: '#ef444415', border: '#ef444440', icon: AlertTriangle },
  new_position:{ label: '关注新建', color: '#38bdf8', bg: '#38bdf815', border: '#38bdf840', icon: Star },
}

function computeSignal(change: HoldingChange): SignalType {
  if (change.changeType === 'exited') return 'strong_sell'
  if (change.changeType === 'new') return 'new_position'
  const pct = change.changePercent
  if (pct > 10) return 'strong_buy'
  if (pct > 5) return 'buy'
  if (pct < -10) return 'strong_sell'
  if (pct < -5) return 'reduce'
  return 'hold'
}

// ── Horizontal Bar (no chart library) ────────────────────────────────────────
function FlowBar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = Math.min(Math.abs(value / max) * 100, 100)
  return (
    <div style={{ flex: 1, height: 20, background: '#0d0d0d', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        right: value >= 0 ? 0 : undefined,
        left: value < 0 ? 0 : undefined,
        top: 0, bottom: 0,
        width: `${width}%`,
        background: color,
        borderRadius: 4,
        transition: 'width 0.6s ease',
      }} />
    </div>
  )
}

// ── Stock Signal Row ───────────────────────────────────────────────────────────
function SignalRow({ signal }: { signal: StockSignal }) {
  const cfg = SIGNAL_CONFIG[signal.signal]
  const Icon = cfg.icon
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = '#161616')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Signal badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 6,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        minWidth: 72, justifyContent: 'center',
      }}>
        <Icon size={11} color={cfg.color} />
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
      </div>

      {/* Ticker & Name */}
      <div style={{ minWidth: 90 }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.blue }}>
          {signal.ticker}
        </div>
        <div style={{ fontSize: 10, color: C.text3 }}>{signal.name}</div>
      </div>

      {/* Sector */}
      <div style={{ minWidth: 60 }}>
        <span style={{ fontSize: 11, color: C.text3 }}>{signal.sector}</span>
      </div>

      {/* Institutions count */}
      <div style={{ minWidth: 50 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text2 }}>
          {signal.institutionCount}家
        </span>
      </div>

      {/* Change pct */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
          color: signal.avgChange >= 0 ? C.green : C.red,
        }}>
          {signal.avgChange >= 0 ? '+' : ''}{signal.avgChange.toFixed(1)}%
        </span>
        <FlowBar value={signal.avgChange} max={50} color={signal.avgChange >= 0 ? C.green : C.red} />
      </div>
    </div>
  )
}

// ── Sector Flow Row ────────────────────────────────────────────────────────────
function SectorFlowRow({ flow, rank }: { flow: SectorFlow; rank: number }) {
  const color = flow.signal === 'inflow' ? C.green : flow.signal === 'outflow' ? C.red : C.text3
  const arrow = flow.signal === 'inflow' ? '↑' : flow.signal === 'outflow' ? '↓' : '→'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
    }}>
      {/* Rank */}
      <div style={{
        width: 24, height: 24, borderRadius: 6,
        background: rank <= 3 ? `${color}20` : '#0d0d0d',
        border: `1px solid ${rank <= 3 ? color + '40' : C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, color: rank <= 3 ? color : C.text3,
        flexShrink: 0,
      }}>
        {rank}
      </div>

      {/* Sector */}
      <div style={{ minWidth: 80 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{flow.sector}</div>
        <div style={{ fontSize: 10, color: C.text3 }}>{flow.changeCount}次异动</div>
      </div>

      {/* Arrow */}
      <span style={{ fontSize: 16, color, fontWeight: 900 }}>{arrow}</span>

      {/* Bar */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FlowBar value={flow.netFlow} max={200} color={color} />
        <span style={{
          fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
          color, minWidth: 60, textAlign: 'right',
        }}>
          {flow.netFlow >= 0 ? '+' : ''}{flow.netFlow.toFixed(1)}
        </span>
      </div>

      {/* Top ticker */}
      <div style={{ minWidth: 70, textAlign: 'right' }}>
        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.blue }}>
          {flow.topTicker}
        </span>
        <span style={{ fontSize: 10, color: C.text3, marginLeft: 4 }}>
          {flow.topChange >= 0 ? '+' : ''}{flow.topChange.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// ── Stats Row ──────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: '12px 16px', flex: 1, minWidth: 120,
    }}>
      <div style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color }}>
        {value}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AIFundFlow() {
  const ALL_CHANGES = getAllChanges()

  // ── 1. Compute individual stock signals ───────────────────────────────────
  const stockSignals = useMemo<StockSignal[]>(() => {
    const allHoldings = getAllHoldings()
    // Group holdings by ticker
    const byTicker = new Map<string, { changePcts: number[]; names: string[]; sectors: string[]; insts: string[]; marketValues: number[] }>()

    for (const h of allHoldings) {
      if (!byTicker.has(h.stockTicker)) {
        byTicker.set(h.stockTicker, { changePcts: [], names: [], sectors: [], insts: [], marketValues: [] })
      }
      const entry = byTicker.get(h.stockTicker)!
      if (h.changePercent !== 0) entry.changePcts.push(h.changePercent)
      entry.names.push(h.stockName)
      entry.sectors.push(h.sector)
      const inst = institutions.find(i => i.id === h.institutionId)
      if (inst && !entry.insts.includes(inst.name)) entry.insts.push(inst.name)
      entry.marketValues.push(h.marketValue)
    }

    const signals: StockSignal[] = []
    byTicker.forEach((entry, ticker) => {
      if (entry.changePcts.length === 0) return
      const avgChange = entry.changePcts.reduce((a, b) => a + b, 0) / entry.changePcts.length
      const maxChange = Math.max(...entry.changePcts.map(Math.abs))
      const bestChange = entry.changePcts.reduce((a, b) => Math.abs(a) > Math.abs(b) ? a : b)
      const sector = [...new Set(entry.sectors)][0] || '其他'
      const name = [...new Set(entry.names)][0] || ticker
      const marketValue = entry.marketValues.reduce((a, b) => a + b, 0)

      // Determine signal: use the most significant change
      let signal: SignalType = 'hold'
      if (avgChange > 10) signal = 'strong_buy'
      else if (avgChange > 5) signal = 'buy'
      else if (avgChange < -10) signal = 'strong_sell'
      else if (avgChange < -5) signal = 'reduce'
      else if (bestChange > 15) signal = 'strong_buy'
      else if (bestChange < -15) signal = 'strong_sell'

      signals.push({
        ticker,
        name,
        signal,
        signalLabel: SIGNAL_CONFIG[signal].label,
        changePercent: bestChange,
        changeType: bestChange > 0 ? 'increase' : 'decrease',
        institutionCount: entry.insts.length,
        institutions: entry.insts,
        avgChange,
        sector,
        marketValue,
      })
    })

    return signals.sort((a, b) => Math.abs(b.avgChange) - Math.abs(a.avgChange))
  }, [])

  // ── 2. Compute sector flows ─────────────────────────────────────────────────
  const sectorFlows = useMemo<SectorFlow[]>(() => {
    const allHoldings = getAllHoldings()
    const bySector = new Map<string, { netFlow: number; changes: { ticker: string; pct: number }[] }>()

    for (const h of allHoldings) {
      if (h.changePercent === 0) continue
      const sector = h.sector || '其他'
      if (!bySector.has(sector)) bySector.set(sector, { netFlow: 0, changes: [] })
      const entry = bySector.get(sector)!
      entry.netFlow += h.changePercent
      entry.changes.push({ ticker: h.stockTicker, pct: h.changePercent })
    }

    const flows: SectorFlow[] = []
    bySector.forEach((entry, sector) => {
      const sorted = [...entry.changes].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
      flows.push({
        sector,
        netFlow: entry.netFlow / (entry.changes.length || 1),
        changeCount: entry.changes.length,
        signal: entry.netFlow > 20 ? 'inflow' : entry.netFlow < -20 ? 'outflow' : 'neutral',
        topTicker: sorted[0]?.ticker || '—',
        topChange: sorted[0]?.pct || 0,
      })
    })

    return flows.sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow))
  }, [])

  // ── 3. Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const strongBuys = stockSignals.filter(s => s.signal === 'strong_buy').length
    const buys = stockSignals.filter(s => s.signal === 'buy').length
    const reduces = stockSignals.filter(s => s.signal === 'reduce' || s.signal === 'strong_sell').length
    const newPositions = stockSignals.filter(s => s.signal === 'new_position').length
    const topInflowSector = sectorFlows.filter(f => f.signal === 'inflow')[0]
    const topOutflowSector = sectorFlows.filter(f => f.signal === 'outflow')[0]
    return { strongBuys, buys, reduces, newPositions, topInflowSector, topOutflowSector }
  }, [stockSignals, sectorFlows])

  const signalCounts = useMemo(() => ({
    strong_buy: stockSignals.filter(s => s.signal === 'strong_buy').length,
    buy: stockSignals.filter(s => s.signal === 'buy').length,
    hold: stockSignals.filter(s => s.signal === 'hold').length,
    reduce: stockSignals.filter(s => s.signal === 'reduce').length,
    strong_sell: stockSignals.filter(s => s.signal === 'strong_sell').length,
    new_position: stockSignals.filter(s => s.signal === 'new_position').length,
  }), [stockSignals])

  const inflowSectors = sectorFlows.filter(f => f.signal === 'inflow').slice(0, 5)
  const outflowSectors = sectorFlows.filter(f => f.signal === 'outflow').slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Header Stats ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatPill label="强势买入 ↑" value={`${signalCounts.strong_buy}只`} color={C.green} />
        <StatPill label="买入 ↑" value={`${signalCounts.buy}只`} color="#4ade80" />
        <StatPill label="新建仓 ✨" value={`${signalCounts.new_position}只`} color={C.blue} />
        <StatPill label="观望 →" value={`${signalCounts.hold}只`} color={C.text2} />
        <StatPill label="减仓 ↓" value={`${signalCounts.reduce}只`} color="#fb923c" />
        <StatPill label="清仓警示 ✕" value={`${signalCounts.strong_sell}只`} color={C.red} />
      </div>

      {/* ── Conviction Index (机构信心指数) ─────────────────────────────────── */}
      {(() => {
        // Compute conviction score for each stock
        const convictionData = (() => {
          const allHoldings = getAllHoldings()
          const byTicker = new Map<string, {
            instCount: number; avgChange: number; maxChange: number;
            marketValue: number; sector: string; name: string; changes: number[]
          }>()
          for (const h of allHoldings) {
            if (!byTicker.has(h.stockTicker)) {
              byTicker.set(h.stockTicker, {
                instCount: 0, avgChange: 0, maxChange: 0,
                marketValue: 0, sector: h.sector, name: h.stockName, changes: [],
              })
            }
            const e = byTicker.get(h.stockTicker)!
            e.instCount++
            if (h.changePercent !== 0) e.changes.push(h.changePercent)
            e.marketValue += h.marketValue
          }
          return [...byTicker.entries()]
            .map(([ticker, e]) => {
              const avgChg = e.changes.length
                ? e.changes.reduce((a, b) => a + b, 0) / e.changes.length
                : 0
              const maxChg = e.changes.length
                ? e.changes.reduce((a, b) => Math.abs(a) > Math.abs(b) ? a : b)
                : 0
              // Score: inst weight (0-35) + change momentum (0-40) + value weight (0-25)
              const instScore = Math.min(e.instCount * 7, 35)
              const chgScore = Math.min(Math.max(Math.abs(avgChg) * 2, 0), 40) * (avgChg >= 0 ? 1 : -1)
              const valLog = Math.log10(e.marketValue + 1)
              const valScore = Math.min(valLog * 3, 25)
              const rawScore = instScore + Math.abs(chgScore) + valScore
              const finalScore = Math.round(Math.min(rawScore, 100))
              const convictionLevel =
                finalScore >= 75 ? 'strong' :
                finalScore >= 50 ? 'moderate' :
                finalScore >= 25 ? 'weak' : 'low'
              return {
                ticker, name: e.name, sector: e.sector,
                score: finalScore, convictionLevel,
                instCount: e.instCount, avgChange: avgChg, maxChange: maxChg,
                marketValue: e.marketValue,
                chgScore: Math.round(chgScore), instScore: Math.round(instScore), valScore: Math.round(valScore),
              }
            })
            .sort((a, b) => b.score - a.score)
        })()

        // Market filter
        const [marketFilter, setMarketFilter] = useState<'ALL'|'US'|'HK'|'CN'>('ALL');
        const _MFILTER = (ticker: string) => {
          if (marketFilter === 'ALL') return true;
          if (ticker.includes('.HK')) return marketFilter === 'HK';
          if (/^\d{6}$/.test(ticker)) return marketFilter === 'CN';
          return marketFilter === 'US';
        };
        const filteredConviction = convictionData.filter(e => _MFILTER(e.ticker));

        const levelConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
          strong:   { label: '高信心',  color: '#22c55e', bg: '#22c55e15', border: '#22c55e50' },
          moderate: { label: '中信心',  color: '#38bdf8', bg: '#38bdf815', border: '#38bdf850' },
          weak:     { label: '低信心',  color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b50' },
          low:      { label: '信心不足', color: '#ef4444', bg: '#ef444415', border: '#ef444450' },
        }

        return (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(90deg, #22c55e08, #38bdf808)',
            }}>
              <span style={{ fontSize: 16 }}>🎯</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>机构信心指数</span>
              <span style={{ fontSize: 11, color: C.text3, marginLeft: 4 }}>
                基于机构数量·变化幅度·持仓市值综合计算
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
                {(['全部','🇺🇸美','🇭🇰港','🇨🇳A'] as const).map((lbl, idx) => {
                  const key = (['ALL','US','HK','CN'] as const)[idx];
                  const colors = ['#a1a1aa','#38bdf8','#facc15','#f87171'];
                  const active = marketFilter === key;
                  return (
                    <button key={key} onClick={() => setMarketFilter(key)}
                      style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                        background: active ? colors[idx] + '20' : 'transparent',
                        color: active ? colors[idx] : '#52525b',
                        border: `1px solid ${active ? colors[idx] + '50' : '#1e1e1e'}`,
                        cursor: 'pointer', transition: 'all 0.15s' }}
                    >{lbl}</button>
                  );
                })}
                <span style={{ fontSize: 10, color: C.text3, background: '#0d0d0d', border: `1px solid #1e1e1e`, padding: '2px 8px', borderRadius: 20 }}>
                  Top {filteredConviction.length}
                </span>
              </div>
            </div>

            {/* Table Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderBottom: `1px solid ${C.border}`,
              background: '#0d0d0d',
            }}>
              <div style={{ minWidth: 28 }}>#</div>
              <div style={{ minWidth: 70, fontSize: 11, fontWeight: 700, color: C.text3 }}>股票</div>
              <div style={{ minWidth: 60, fontSize: 11, fontWeight: 700, color: C.text3 }}>板块</div>
              <div style={{ minWidth: 50, fontSize: 11, fontWeight: 700, color: C.text3, textAlign: 'center' }}>机构数</div>
              <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: C.text3 }}>信心分</div>
              <div style={{ minWidth: 60, fontSize: 11, fontWeight: 700, color: C.text3 }}>信心等级</div>
              <div style={{ minWidth: 70, fontSize: 11, fontWeight: 700, color: C.text3 }}>均幅变化</div>
            </div>

            {/* Rows */}
            {filteredConviction.slice(0, 20).map((entry, i) => {
              const lv = levelConfig[entry.convictionLevel]
              const scoreBarW = entry.score
              const barColor = entry.convictionLevel === 'strong' ? C.green
                : entry.convictionLevel === 'moderate' ? C.blue
                : entry.convictionLevel === 'weak' ? C.yellow : C.red
              return (
                <div key={entry.ticker} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 16px', borderBottom: `1px solid ${C.border}`,
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#161616')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Rank */}
                  <div style={{
                    minWidth: 28, fontSize: 12, fontWeight: 800, color: C.text3,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {i < 3 ? '🥇🥈🥉'[i] : `${i + 1}`}
                  </div>

                  {/* Ticker */}
                  <div style={{ minWidth: 70 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: C.blue }}>
                      {entry.ticker}
                    </div>
                    <div style={{ fontSize: 10, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>
                      {entry.name}
                    </div>
                  </div>

                  {/* Sector */}
                  <div style={{ minWidth: 60 }}>
                    <span style={{ fontSize: 10, color: C.text3 }}>{entry.sector}</span>
                  </div>

                  {/* Institution count */}
                  <div style={{ minWidth: 50, textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                      {entry.instCount}
                    </span>
                    <span style={{ fontSize: 10, color: C.text3 }}> 家</span>
                  </div>

                  {/* Score bar */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      flex: 1, height: 8, background: '#1e1e1e',
                      borderRadius: 4, overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${scoreBarW}%`, height: '100%',
                        background: barColor,
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                        boxShadow: `0 0 6px ${barColor}60`,
                      }} />
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 800,
                      fontFamily: 'JetBrains Mono, monospace',
                      color: barColor, minWidth: 30,
                    }}>
                      {entry.score}
                    </span>
                  </div>

                  {/* Conviction level badge */}
                  <div style={{
                    minWidth: 60, display: 'flex', alignItems: 'center',
                    padding: '3px 7px', borderRadius: 6,
                    background: lv.bg, border: `1px solid ${lv.border}`,
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: lv.color }}>
                      {lv.label}
                    </span>
                  </div>

                  {/* Avg change */}
                  <div style={{ minWidth: 70, textAlign: 'right' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace',
                      color: entry.avgChange >= 0 ? C.green : C.red,
                    }}>
                      {entry.avgChange >= 0 ? '+' : ''}{entry.avgChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ── Top Inflow / Outflow Sectors ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top Inflow */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: C.green,
              boxShadow: `0 0 8px ${C.green}60`,
            }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>资金流入板块</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: C.text3 }}>Top {inflowSectors.length}</span>
          </div>
          {inflowSectors.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: C.text3, fontSize: 12 }}>
              暂无明显资金流入板块
            </div>
          )}
          {inflowSectors.map((flow, i) => (
            <SectorFlowRow key={flow.sector} flow={flow} rank={i + 1} />
          ))}
        </div>

        {/* Top Outflow */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: C.red,
              boxShadow: `0 0 8px ${C.red}60`,
            }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>资金流出板块</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: C.text3 }}>Top {outflowSectors.length}</span>
          </div>
          {outflowSectors.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: C.text3, fontSize: 12 }}>
              暂无明显资金流出板块
            </div>
          )}
          {outflowSectors.map((flow, i) => (
            <SectorFlowRow key={flow.sector} flow={flow} rank={i + 1} />
          ))}
        </div>
      </div>

      {/* ── Signal Legend ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>
        {Object.entries(SIGNAL_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 6,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
          }}>
            <cfg.icon size={11} color={cfg.color} />
            <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
            <span style={{ fontSize: 10, color: C.text3 }}>{signalCounts[key as SignalType] || 0}只</span>
          </div>
        ))}
      </div>

      {/* ── Signal Table ──────────────────────────────────────────────────────── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
          background: '#0d0d0d',
        }}>
          {['信号', '标的', '板块', '机构数', '平均变化幅度'].map((h, i) => (
            <div key={h} style={{
              fontSize: 11, fontWeight: 700, color: C.text3,
              ...(i === 4 ? { flex: 1 } : {}),
              ...(i === 1 ? { minWidth: 90 } : {}),
              ...(i === 2 ? { minWidth: 60 } : {}),
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {stockSignals.slice(0, 30).map(signal => (
          <SignalRow key={signal.ticker} signal={signal} />
        ))}

        {stockSignals.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>
            暂无持仓数据
          </div>
        )}
      </div>
    </div>
  )
}
