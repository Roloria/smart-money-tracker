/**
 * KevinPortfolio — Kevin 真实持仓追踪
 * 显示 Kevin 个人持仓与聪明钱机构持仓的对比分析
 * 数据来源：Signal Arena 实盘记录（2026-04-21 更新）
 * 持仓变动：清仓小米/美团/安克创新；泡泡玛特加至25万；新建天齐锂业/润泽科技；世纪华通加至18万
 * Signal Arena 实盘记录（2026-04-17）
 * 最新代码更新：v22（2026-04-21 — AI 持仓诊断面板）
 * 版本同步：v23 注释更新（2026-04-21 04:00 AM）
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Loader2, Zap } from 'lucide-react';
import { holdings as allHoldings } from '../data/mockData';

// ── 类型定义 ────────────────────────────────────────────────────────────────
interface PriceData {
  price: number;
  change: number;
  changePct: number;
  currency: string;
  market: 'CN' | 'HK' | 'US';
  loading: boolean;
  error?: string;
}

interface Holding {
  ticker: string;
  name: string;
  market: 'CN' | 'HK';
  shares: number | null;
  cost: number | null;
  sector: string;
  allocation: number;
}

// ── 诊断结果类型 ────────────────────────────────────────────────────────────
interface SectorDiagnosis {
  sector: string;
  kevinPct: number;
  instAvgPct: number;
  ratio: number;
  status: 'overweight' | 'underweight' | 'normal';
}

interface DiagnosisResult {
  sectorDiagnoses: SectorDiagnosis[];
  concentrationRisks: { name: string; ticker: string; pct: number }[];
  suggestions: { icon: string; text: string; priority: 'high' | 'medium' | 'low' }[];
}

// ── 配色常量 ────────────────────────────────────────────────────────────────
const C = {
  card: '#141414', border: '#1e1e1e',
  text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  blue: '#38bdf8', green: '#22c55e', red: '#ef4444',
  yellow: '#f59e0b', purple: '#a78bfa',
  orange: '#fb923c', gold: '#fbbf24',
};

// ── 常量 ────────────────────────────────────────────────────────────────────
const TOTAL_CAPITAL = 600000;
const INVESTED_RATIO = 0.96;
const INVESTED_CAPITAL = TOTAL_CAPITAL * INVESTED_RATIO;

const FX: Record<string, number> = { CNY: 1, HKD: 0.93, USD: 7.25 };

// Kevin 真实持仓（来源：Signal Arena 实盘记录 · 2026-04-21 更新）
// 持仓：腾讯15万/泡泡玛特25万/天齐10万/润泽10万；现金15万（25%未入场）
const KEVIN_HOLDINGS: Holding[] = [
  { ticker: '00700.HK',  name: '腾讯控股',  market: 'HK', shares: null, cost: null, sector: '互联网/AI',   allocation: 0.250 },
  { ticker: '09992.HK',  name: '泡泡玛特',  market: 'HK', shares: null, cost: null, sector: '消费/潮玩',  allocation: 0.417 },
  { ticker: '002466.SZ', name: '天齐锂业',  market: 'CN', shares: null, cost: null, sector: '锂电/能源',  allocation: 0.167 },
  { ticker: '300442.SZ', name: '润泽科技',  market: 'CN', shares: null, cost: null, sector: 'IDC/数据中心', allocation: 0.167 },
];

// ── AI 诊断引擎（规则引擎，无需 AI API）─────────────────────────────────────
function runDiagnosis(): DiagnosisResult {
  // 1. 按 sector 聚合机构平均配置（基于 mockData holdings 的 marketValue）
  const sectorInstValues: Record<string, number> = {};
  allHoldings.forEach(h => {
    sectorInstValues[h.sector] = (sectorInstValues[h.sector] ?? 0) + h.marketValue;
  });
  const totalInstValue = Object.values(sectorInstValues).reduce((s, v) => s + v, 0);

  // Kevin 各板块配置
  const kevinSectorValues: Record<string, number> = {};
  KEVIN_HOLDINGS.forEach(h => {
    kevinSectorValues[h.sector] = (kevinSectorValues[h.sector] ?? 0) + h.allocation;
  });

  // 合并 Kevin 板块 into 兼容 groups
  const SECTOR_MAP: Record<string, string> = {
    '互联网/AI':     '科技',
    '消费/潮玩':     '消费',
    '锂电/能源':     '能源',
    '游戏/AI算力':   '科技',
    'IDC/数据中心':  '科技',
  };

  const sectorDiagnoses: SectorDiagnosis[] = [];
  const kevinGroups: Record<string, number> = {};
  KEVIN_HOLDINGS.forEach(h => {
    const instSector = SECTOR_MAP[h.sector] ?? h.sector;
    kevinGroups[instSector] = (kevinGroups[instSector] ?? 0) + h.allocation;
  });

  Object.entries(kevinGroups).forEach(([sector, kevinPct]) => {
    const instAvgPct = (sectorInstValues[sector] ?? 0) / totalInstValue;
    const ratio = instAvgPct > 0 ? kevinPct / instAvgPct : 999;
    let status: SectorDiagnosis['status'] = 'normal';
    if (ratio > 2) status = 'overweight';
    else if (ratio < 0.5 && instAvgPct > 0.01) status = 'underweight';
    sectorDiagnoses.push({ sector, kevinPct, instAvgPct, ratio, status });
  });

  // 2. 集中度风险：单只股票 > 40%
  const concentrationRisks = KEVIN_HOLDINGS
    .filter(h => h.allocation > 0.40)
    .map(h => ({ name: h.name, ticker: h.ticker, pct: h.allocation * 100 }));

  // 3. AI 建议（规则引擎 if/else）
  const suggestions: DiagnosisResult['suggestions'] = [];

  // 建议：集中度
  if (concentrationRisks.length > 0) {
    suggestions.push({
      icon: '⚠️',
      text: `${concentrationRisks[0].name} 占总仓位 ${concentrationRisks[0].pct.toFixed(0)}%，建议考虑分散至 25% 以下以降低单票风险`,
      priority: 'high',
    });
  }

  // 建议：超配板块
  const overweightSectors = sectorDiagnoses.filter(d => d.status === 'overweight');
  if (overweightSectors.length > 0) {
    suggestions.push({
      icon: '📊',
      text: `${overweightSectors[0].sector} 板块配置是机构平均的 ${overweightSectors[0].ratio.toFixed(1)} 倍，适度减配可降低与科技板块的双重暴露`,
      priority: 'medium',
    });
  }

  // 建议：低配板块
  const underweightSectors = sectorDiagnoses.filter(d => d.status === 'underweight');
  if (underweightSectors.length > 0) {
    suggestions.push({
      icon: '🔍',
      text: `${underweightSectors[0].sector} 板块配置偏低（仅为机构平均的 ${(underweightSectors[0].ratio * 100).toFixed(0)}%），可关注金融、医疗等机构重仓板块的补仓机会`,
      priority: 'medium',
    });
  }

  // 建议：现金储备
  if (INVESTED_RATIO > 0.95) {
    suggestions.push({
      icon: '💡',
      text: '当前总仓位 ~96%，建议保留 5-10% 现金用于波段操作或逢低补仓，提高组合灵活性',
      priority: 'low',
    });
  }

  return { sectorDiagnoses, concentrationRisks, suggestions };
}

// ── 辅助函数 ────────────────────────────────────────────────────────────────
function getYahooTicker(ticker: string): string {
  if (/^\d{5}\.HK$/i.test(ticker)) return ticker.toUpperCase();
  if (/^\d{6}$/.test(ticker)) return `${ticker}.SS`;
  return ticker;
}

function toCNY(amount: number, currency: string): number {
  return amount * (FX[currency] ?? 1);
}

async function fetchPrice(ticker: string, market: string): Promise<Omit<PriceData, 'ticker' | 'loading'> & { timestamp?: number }> {
  const yahoo = getYahooTicker(ticker);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahoo}?interval=1d&range=5d`;
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No data');
    const closes = (result.indicators?.quote?.[0]?.close ?? []).filter((c: number) => c != null);
    if (closes.length < 2) throw new Error('No close prices');
    const curr = closes[closes.length - 1];
    const prev = closes[closes.length - 2];
    const currencyMap: Record<string, string> = { CN: 'CNY', HK: 'HKD', US: 'USD' };
    const timestamps = result.timestamp ?? [];
    const latestTs = timestamps.length > 0 ? timestamps[timestamps.length - 1] : undefined;
    return {
      price: curr,
      change: curr - prev,
      changePct: ((curr - prev) / prev) * 100,
      currency: currencyMap[market] ?? 'CNY',
      market: market as 'CN' | 'HK' | 'US',
      timestamp: latestTs,
    };
  } catch (err: unknown) {
    throw new Error((err as Error).message);
  }
}

const fmtCNY = (v: number) => `¥${(v / 10000).toFixed(1)}万`;

// ── AI 诊断面板 ──────────────────────────────────────────────────────────────
function AIDiagnosisPanel() {
  const diagnosis = runDiagnosis();
  const maxSectorPct = Math.max(...diagnosis.sectorDiagnoses.map(d => Math.max(d.kevinPct, d.instAvgPct, 0.01)));

  return (
    <div style={{
      background: '#0f0f0f', border: `1px solid ${C.border}`,
      borderRadius: 14, padding: '20px 24px', marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.gold, margin: 0 }}>
          AI 持仓诊断
        </h3>
        <div style={{
          marginLeft: 'auto',
          padding: '4px 10px', borderRadius: 8,
          background: `${C.green}12`, border: `1px solid ${C.green}30`,
          fontSize: 11, fontWeight: 600, color: C.green,
        }}>
          规则引擎 v1.0
        </div>
      </div>

      {/* 风险信号 */}
      {diagnosis.concentrationRisks.length > 0 && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 16,
          background: `${C.red}10`, border: `1px solid ${C.red}30`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>🚨</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>集中度风险</span>
          </div>
          {diagnosis.concentrationRisks.map(r => (
            <div key={r.ticker} style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
              <span style={{ color: C.text, fontWeight: 600 }}>{r.name}</span>（{r.ticker}）持仓占比 <strong style={{ color: C.red }}>{r.pct.toFixed(0)}%</strong>，超过 40% 集中度阈值
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* 左侧：板块对比图 + 诊断 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 10, letterSpacing: 1 }}>
            板块配置对比 · 机构平均 vs Kevin
          </div>
          {diagnosis.sectorDiagnoses.map(d => {
            const kevinBarW = Math.round((d.kevinPct / maxSectorPct) * 100);
            const instBarW = Math.round((d.instAvgPct / maxSectorPct) * 100);
            const statusColor = d.status === 'overweight' ? C.red : d.status === 'underweight' ? C.yellow : C.green;
            const statusIcon = d.status === 'overweight' ? '⚠️' : d.status === 'underweight' ? '📉' : '✅';
            return (
              <div key={d.sector} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{d.sector}</span>
                    <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>
                      {statusIcon} {d.status === 'overweight' ? '超配' : d.status === 'underweight' ? '低配' : '正常'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: C.text3 }}>
                    <span style={{ color: C.gold, fontWeight: 600 }}>{(d.kevinPct * 100).toFixed(0)}%</span>
                    {' '}vs 机构{' '}
                    <span style={{ color: C.text2 }}>{(d.instAvgPct * 100).toFixed(1)}%</span>
                  </div>
                </div>
                {/* Kevin 条 */}
                <div style={{ marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: C.gold, width: 46 }}>Kevin</span>
                    <div style={{ flex: 1, height: 8, background: '#1e1e1e', borderRadius: 4 }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        width: `${kevinBarW}%`,
                        background: `linear-gradient(90deg, ${C.gold}, ${C.orange})`,
                        minWidth: 4,
                      }} />
                    </div>
                  </div>
                </div>
                {/* 机构平均条 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: C.text3, width: 46 }}>机构</span>
                    <div style={{ flex: 1, height: 8, background: '#1e1e1e', borderRadius: 4 }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        width: `${instBarW}%`,
                        background: C.text3,
                        minWidth: 4,
                        opacity: 0.5,
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 右侧：AI 建议 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 10, letterSpacing: 1 }}>
            💡 持仓优化建议
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {diagnosis.suggestions.map((s, i) => {
              const priorityBg = {
                high: `${C.red}15`, medium: `${C.yellow}15`, low: `${C.blue}15`,
              }[s.priority];
              const priorityBorder = {
                high: `${C.red}30`, medium: `${C.yellow}30`, low: `${C.blue}30`,
              }[s.priority];
              const priorityColor = {
                high: C.red, medium: C.yellow, low: C.blue,
              }[s.priority];
              return (
                <div key={i} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: priorityBg, border: `1px solid ${priorityBorder}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{s.icon}</span>
                    <div>
                      <div style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        color: priorityColor, letterSpacing: 0.5, marginBottom: 4,
                      }}>
                        {s.priority === 'high' ? '⚠️ 高优' : s.priority === 'medium' ? '📊 中优' : '💡 低优'}
                      </div>
                      <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
                        {s.text}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StatBox ──────────────────────────────────────────────────────────────────
function StatBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
      <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ── 主组件 ──────────────────────────────────────────────────────────────────
export default function KevinPortfolio() {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('—');
  const [dataDate, setDataDate] = useState<string>('—');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const newPrices = new Map<string, PriceData>();
      const tickers = KEVIN_HOLDINGS.map(h => h.ticker);

      const results = await Promise.allSettled(
        tickers.map(async (ticker) => {
          const holding = KEVIN_HOLDINGS.find(h => h.ticker === ticker)!;
          const result = await fetchPrice(ticker, holding.market);
          return { ticker, ...result };
        })
      );

      results.forEach((r, i) => {
        const ticker = tickers[i];
        if (r.status === 'fulfilled') {
          const { timestamp: _ts, ...priceRest } = r.value;
          newPrices.set(ticker, { loading: false, ...priceRest });
        } else {
          newPrices.set(ticker, {
            loading: false, price: 0, change: 0,
            changePct: 0, currency: 'CNY', market: 'CN',
            error: (r.reason as Error)?.message ?? 'Failed',
          });
        }
      });

      if (!cancelled) {
        setPrices(newPrices);
        setLastUpdated(new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit', minute: '2-digit',
        }));

        const timestamps = (results as PromiseFulfilledResult<{ ticker: string; timestamp: number }>[])
          .filter(r => r.status === 'fulfilled' && r.value.timestamp)
          .map(r => r.value.timestamp);
        if (timestamps.length > 0) {
          const latestTs = Math.max(...timestamps) * 1000;
          const tradingDate = new Date(latestTs);
          setDataDate(tradingDate.toLocaleDateString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            timeZone: 'Asia/Shanghai',
          }));
        }

        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const totalInvestedValue = KEVIN_HOLDINGS.reduce((sum, h) => {
    const p = prices.get(h.ticker);
    if (p && p.price > 0 && h.shares) {
      return sum + toCNY(h.shares * p.price, p.currency);
    }
    return sum + INVESTED_CAPITAL * h.allocation;
  }, 0);

  const totalCostBasis = KEVIN_HOLDINGS.reduce((sum, h) => {
    if (h.shares && h.cost) return sum + h.shares * h.cost;
    return sum + INVESTED_CAPITAL * h.allocation;
  }, 0);

  const totalDayPnL = KEVIN_HOLDINGS.reduce((sum, h) => {
    const p = prices.get(h.ticker);
    if (p && p.price > 0 && h.shares) {
      const posValue = toCNY(h.shares * p.price, p.currency);
      return sum + (posValue * p.changePct / 100);
    }
    return sum;
  }, 0);
  const totalDayPnLPct = totalInvestedValue > 0 ? (totalDayPnL / totalInvestedValue) * 100 : 0;
  const dayColor = totalDayPnL >= 0 ? C.green : C.red;

  const totalPnl = totalInvestedValue - totalCostBasis;
  const totalPnlPct = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;
  const posColor = totalPnl >= 0 ? C.green : C.red;
  const cashAmount = TOTAL_CAPITAL - INVESTED_CAPITAL;

  return (
    <div style={{ padding: '24px 0', maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
            我的持仓追踪
          </h2>
          <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>
            个人持仓 vs 聪明钱机构 · 实时行情 · 资金总规模 ¥60万
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text3, fontSize: 12 }}>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              加载中...
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text3, fontSize: 11 }}>
              <RefreshCw size={11} />
              {lastUpdated}
            </div>
          )}
          {dataDate !== '—' && (
            <div style={{
              padding: '4px 10px', borderRadius: 8,
              background: `${C.green}12`, border: `1px solid ${C.green}30`,
              fontSize: 11, fontWeight: 600, color: C.green,
            }}>
              📅 {dataDate} 收盘
            </div>
          )}
          <div style={{
            padding: '4px 10px', borderRadius: 8,
            background: `${C.purple}12`, border: `1px solid ${C.purple}30`,
            fontSize: 11, fontWeight: 600, color: C.purple,
          }}>
            Yahoo Finance
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 8,
            background: `${C.blue}12`, border: `1px solid ${C.blue}30`,
            fontSize: 11, fontWeight: 700, color: C.blue,
          }}>
            总仓位 ~96%
          </div>
        </div>
      </div>

      {/* AI 诊断面板 */}
      <AIDiagnosisPanel />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
        <StatBox label="持仓市值" value={fmtCNY(totalInvestedValue)} sub={`≈ $${(totalInvestedValue / 7.25 / 10000).toFixed(1)}K`} color={C.blue} />
        <StatBox label="成本基准" value={fmtCNY(totalCostBasis)} sub="参考买入价累计" color={C.text3} />
        <StatBox
          label="持仓盈亏"
          value={`${totalPnl >= 0 ? '+' : ''}${fmtCNY(totalPnl)}`}
          sub={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`}
          color={posColor}
        />
        <StatBox
          label="今日盈亏"
          value={`${totalDayPnL >= 0 ? '+' : ''}${fmtCNY(totalDayPnL)}`}
          sub={`${totalDayPnLPct >= 0 ? '+' : ''}${totalDayPnLPct.toFixed(2)}%`}
          color={dayColor}
        />
        <StatBox
          label="现金备用"
          value={fmtCNY(cashAmount)}
          sub={`总资金 ${((1 - INVESTED_RATIO) * 100).toFixed(0)}%`}
          color={C.yellow}
        />
      </div>

      {/* Holdings table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 90px 90px 90px 80px 90px 1fr',
          gap: 8, padding: '10px 16px',
          background: '#0d0d0d',
          borderBottom: `1px solid ${C.border}`,
          fontSize: 11, fontWeight: 700, color: C.text3,
        }}>
          <div>股票</div>
          <div style={{ textAlign: 'right' }}>持仓</div>
          <div style={{ textAlign: 'right' }}>成本价</div>
          <div style={{ textAlign: 'right' }}>现价</div>
          <div style={{ textAlign: 'right' }}>今日</div>
          <div style={{ textAlign: 'right' }}>市值</div>
          <div>仓位权重</div>
        </div>

        {KEVIN_HOLDINGS.map((holding, idx) => {
          const priceData = prices.get(holding.ticker);
          const isLoading = !priceData;
          const price = priceData?.price ?? 0;
          const changePct = priceData?.changePct ?? 0;
          const currency = priceData?.currency ?? (holding.market === 'CN' ? 'CNY' : 'HKD');
          const hasError = !!priceData?.error;

          const positionValue = (() => {
            if (price > 0 && holding.shares) return toCNY(holding.shares * price, currency);
            return INVESTED_CAPITAL * holding.allocation;
          })();

          const marketLabel = holding.market === 'CN' ? '🇨🇳 A股' : '🇭🇰 港股';
          const weight = holding.allocation * 100;
          const isRowError = hasError || (priceData && !priceData.loading && price === 0);

          return (
            <div key={holding.ticker} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 90px 90px 90px 80px 90px 1fr',
              gap: 8, padding: '12px 16px',
              alignItems: 'center',
              borderBottom: idx < KEVIN_HOLDINGS.length - 1 ? `1px solid ${C.border}` : 'none',
              background: isRowError ? '#2d0a0a' : idx % 2 === 0 ? 'transparent' : '#0d0d0d20',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: isRowError ? C.red : C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                    {holding.ticker}
                  </span>
                  <span style={{ fontSize: 12, color: C.text2 }}>{holding.name}</span>
                  <span style={{ fontSize: 10, color: C.text3 }}>{marketLabel}</span>
                </div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{holding.sector}</div>
              </div>

              <div style={{ textAlign: 'right', fontSize: 12, color: C.text2, fontFamily: 'JetBrains Mono, monospace' }}>
                {holding.shares ? `${holding.shares.toLocaleString()}股` : '—'}
              </div>

              <div style={{ textAlign: 'right', fontSize: 12, color: C.text3, fontFamily: 'JetBrains Mono, monospace' }}>
                {holding.cost ? `¥${holding.cost.toFixed(2)}` : '—'}
              </div>

              <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: isRowError ? C.red : C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                {isLoading ? (
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', display: 'inline' }} />
                ) : hasError ? (
                  <span style={{ fontSize: 10, color: C.red }} title={priceData?.error}>⚠</span>
                ) : price > 0 ? (
                  `${currency === 'CNY' ? '¥' : 'HK$'}${price.toFixed(2)}`
                ) : (
                  <span style={{ fontSize: 11, color: C.text3 }}>—</span>
                )}
              </div>

              <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: changePct >= 0 ? C.green : C.red, fontFamily: 'JetBrains Mono, monospace' }}>
                {isLoading || hasError || price === 0 ? '—' : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                    {changePct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                  </span>
                )}
              </div>

              <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                {isLoading ? '—' : fmtCNY(positionValue)}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 6, background: '#1e1e1e', borderRadius: 3 }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${weight}%`,
                      background: isRowError ? C.red : `linear-gradient(90deg, ${C.blue}, ${C.purple})`,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isRowError ? C.red : C.text3, width: 36, textAlign: 'right' }}>
                    {weight.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
        <span style={{ color: C.purple, fontWeight: 600 }}>行情数据：</span>Yahoo Finance（🇭🇰港股/🇨🇳A股）· <span style={{ color: C.blue, fontWeight: 600 }}>持仓配置：</span>Signal Arena（2026-04-12建仓）· <span style={{ color: C.yellow, fontWeight: 600 }}>成本基准：</span>参考均价 · 总资金 ¥60万 · 汇率：USD/CNY 7.25、HKD/CNY 0.93 · 不构成投资建议
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
