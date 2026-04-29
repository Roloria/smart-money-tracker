/**
 * KevinPortfolio — 个人持仓追踪
 * 持仓数据已清除，待用户填充
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Loader2, Zap } from 'lucide-react';
import { holdings as allHoldings } from '../data/mockData';

// Kevin 持仓（已清除，待用户填充）
const KEVIN_HOLDINGS: { ticker: string; name: string; market: 'CN' | 'HK'; shares: number | null; cost: number | null; sector: string; allocation: number }[] = [];

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

const FX: Record<string, number> = { CNY: 1, HKD: 0.93, USD: 7.25 };

// ── 辅助函数 ────────────────────────────────────────────────────────────────
function fmt$(v: number) {
  if (v >= 1e8) return `¥${(v / 1e8).toFixed(2)}亿`;
  if (v >= 1e4) return `¥${(v / 1e4).toFixed(0)}万`;
  return `¥${v.toFixed(0)}`;
}
function fmtPct(v: number) { return `${(v * 100).toFixed(1)}%`; }

// ── AI 诊断引擎 ─────────────────────────────────────────────────────────────
function runDiagnosis(): DiagnosisResult {
  const sectorInstValues: Record<string, number> = {};
  allHoldings.forEach((h: any) => {
    sectorInstValues[h.sector] = (sectorInstValues[h.sector] ?? 0) + h.marketValue;
  });
  const totalInstValue = Object.values(sectorInstValues).reduce((s: number, v: number) => s + v, 0);
  const sectorInstPct: Record<string, number> = {};
  Object.entries(sectorInstValues).forEach(([s, v]: [string, number]) => { sectorInstPct[s] = v / totalInstValue; });

  const kevinSectorValue: Record<string, number> = {};
  const kevinTotal = KEVIN_HOLDINGS.reduce((s: number, h: any) => s + h.allocation, 0);
  KEVIN_HOLDINGS.forEach((h: any) => {
    kevinSectorValue[h.sector] = (kevinSectorValue[h.sector] ?? 0) + h.allocation / kevinTotal;
  });

  const sectorDiagnoses: SectorDiagnosis[] = [];
  const allSectors = new Set([...Object.keys(sectorInstPct), ...Object.keys(kevinSectorValue)]);
  allSectors.forEach(sector => {
    const instPct = sectorInstPct[sector] ?? 0;
    const kevinPct = kevinSectorValue[sector] ?? 0;
    const ratio = instPct > 0 ? kevinPct / instPct : 0;
    sectorDiagnoses.push({
      sector,
      kevinPct,
      instAvgPct: instPct,
      ratio,
      status: ratio > 1.2 ? 'overweight' : ratio < 0.8 ? 'underweight' : 'normal',
    });
  });

  const concentrationRisks = KEVIN_HOLDINGS.filter((h: any) => h.allocation > 0.25)
    .map((h: any) => ({ name: h.name, ticker: h.ticker, pct: h.allocation }));

  const suggestions: DiagnosisResult['suggestions'] = [];
  concentrationRisks.forEach(r => {
    suggestions.push({ icon: '⚠️', text: `${r.name} 配置${fmtPct(r.pct)}，超过单一标的建议上限25%`, priority: 'high' });
  });
  sectorDiagnoses.filter(d => d.status === 'overweight').forEach(d => {
    suggestions.push({ icon: '📊', text: `${d.sector} 板块超配${fmtPct(d.kevinPct)}，机构平均仅${fmtPct(d.instAvgPct)}`, priority: 'medium' });
  });
  sectorDiagnoses.filter(d => d.status === 'underweight' && d.instAvgPct > 0.05).forEach(d => {
    suggestions.push({ icon: '💡', text: `${d.sector} 板块低配${fmtPct(d.kevinPct)}，机构平均${fmtPct(d.instAvgPct)}，可关注`, priority: 'low' });
  });

  return { sectorDiagnoses, concentrationRisks, suggestions };
}

// ── 实时价格 Hook ───────────────────────────────────────────────────────────
function useLivePrice(ticker: string, market: string): PriceData {
  const [d, setD] = useState<PriceData>({ price: 0, change: 0, changePct: 0, currency: 'CNY', market: 'CN', loading: true });
  useEffect(() => {
    if (!ticker) return;
    const suffix = market === 'HK' ? '.HK' : market === 'US' ? '' : '.SS';
    const yahooSymbol = ticker.endsWith(suffix) ? ticker : ticker + suffix;
    setD(prev => ({ ...prev, loading: true }));
    fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=2d`)
      .then(r => r.json())
      .then(data => {
        const q = data?.chart?.result?.[0];
        if (!q) { setD(prev => ({ ...prev, loading: false, error: 'No data' })); return; }
        const meta = q.meta;
        const prevClose = meta.previousClose ?? q.indicators?.quote?.[0]?.open?.[0] ?? meta.regularMarketPrice;
        const curr = meta.regularMarketPrice ?? prevClose;
        setD({ price: curr, change: curr - prevClose, changePct: prevClose ? (curr - prevClose) / prevClose : 0, currency: market === 'HK' ? 'HKD' : 'CNY', market: market as 'CN' | 'HK' | 'US', loading: false });
      })
      .catch(() => setD(prev => ({ ...prev, loading: false, error: 'Fetch failed' })));
  }, [ticker, market]);
  return d;
}

// ── 主组件 ──────────────────────────────────────────────────────────────────
export default function KevinPortfolio() {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [liveTotal, setLiveTotal] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalTickers = KEVIN_HOLDINGS.length;
  const liveTickers = Object.keys(prices).filter(k => !prices[k].loading && !prices[k].error);

  useEffect(() => {
    if (KEVIN_HOLDINGS.length === 0) return;
    KEVIN_HOLDINGS.forEach((h: any) => {
      if (prices[h.ticker]) return;
      prices; // ensure re-render
    });
  }, []);

  const fetchAllPrices = () => {
    if (KEVIN_HOLDINGS.length === 0) return;
    setLoading(true);
    const newPrices: Record<string, PriceData> = { ...prices };
    let done = 0;
    KEVIN_HOLDINGS.forEach((h: any) => {
      const suffix = h.market === 'HK' ? '.HK' : '.SS';
      const sym = h.ticker.includes('.') ? h.ticker : h.ticker + suffix;
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=2d`)
        .then(r => r.json())
        .then(data => {
          const q = data?.chart?.result?.[0];
          const meta = q?.meta;
          const curr = meta?.regularMarketPrice ?? 0;
          const prev = meta?.previousClose ?? curr;
          newPrices[h.ticker] = {
            price: curr, change: curr - prev, changePct: (curr - prev) / prev,
            currency: h.market === 'HK' ? 'HKD' : 'CNY', market: h.market, loading: false,
          };
          setPrices({ ...newPrices });
          done++;
          if (done === KEVIN_HOLDINGS.length) { setLoading(false); }
        })
        .catch(() => {
          newPrices[h.ticker] = { price: 0, change: 0, changePct: 0, currency: 'CNY', market: h.market, loading: false, error: 'Failed' };
          setPrices({ ...newPrices });
          done++;
          if (done === KEVIN_HOLDINGS.length) setLoading(false);
        });
    });
  };

  useEffect(() => {
    const total = Object.values(prices).reduce((s: number, p: PriceData) => {
      if (p.loading || p.error) return s;
      const fx = p.market === 'HK' ? 0.93 : 1;
      return s + p.price * fx;
    }, 0);
    setLiveTotal(total);
    setLiveCount(Object.values(prices).filter((p: PriceData) => !p.loading && !p.error).length);
  }, [prices]);

  const diagnosis = runDiagnosis();
  const hasData = KEVIN_HOLDINGS.length > 0;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <Zap size={20} color={C.yellow} />
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>我的持仓</span>
        {loading && <Loader2 size={14} color={C.blue} style={{ animation: 'spin 1s linear infinite' }} />}
      </div>

      {!hasData ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.text3 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text2, marginBottom: 8 }}>暂无持仓数据</div>
          <div style={{ fontSize: 13, color: C.text3 }}>持仓数据已清除，请联系 Eva 更新你的持仓信息</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>实时持仓总值</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.green, fontFamily: 'JetBrains Mono, monospace' }}>{fmt$(liveTotal)}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{liveCount}/{totalTickers} 只已实时报价</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>持仓数量</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{KEVIN_HOLDINGS.length}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>只股票</div>
            </div>
          </div>

          {diagnosis.concentrationRisks.length > 0 && (
            <div style={{ background: '#ef444410', border: '1px solid #ef444440', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 8 }}>⚠️ 集中风险提示</div>
              {diagnosis.concentrationRisks.map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: C.text2, marginBottom: 4 }}>
                  {r.name}（{r.ticker}）占比 {fmtPct(r.pct)}，超过建议上限 25%
                </div>
              ))}
            </div>
          )}

          {diagnosis.suggestions.length > 0 && (
            <div style={{ background: '#38bdf810', border: '1px solid #38bdf840', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 8 }}>💡 AI 优化建议</div>
              {diagnosis.suggestions.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: C.text2, marginBottom: 4, display: 'flex', gap: 6 }}>
                  <span>{s.icon}</span><span>{s.text}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button onClick={fetchAllPrices} disabled={loading} style={{
              background: C.blue + '20', border: `1px solid ${C.blue}40`, borderRadius: 7, padding: '6px 14px',
              color: C.blue, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <RefreshCw size={12} />{loading ? '刷新中…' : '刷新实时价格'}
            </button>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['标的', '市场', '配置', '现价', '涨跌', '操作建议'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: h === '涨跌' ? 'right' : 'left', color: C.text3, fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {KEVIN_HOLDINGS.map((h: any, idx: number) => {
                  const p = prices[h.ticker];
                  const priceStr = p ? (p.loading ? '加载中…' : p.error ? '—' : `¥${p.price.toFixed(2)}`) : '—';
                  const changeStr = p && !p.loading && !p.error ? `${p.change >= 0 ? '+' : ''}${(p.changePct * 100).toFixed(2)}%` : '';
                  const changeColor = p && !p.loading && !p.error ? (p.change >= 0 ? C.green : C.red) : C.text3;
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: C.text }}>{h.name}</div>
                        <div style={{ fontSize: 10, color: C.text3 }}>{h.ticker}</div>
                      </td>
                      <td style={{ padding: '10px 12px', color: C.text3, fontSize: 11 }}>{h.market === 'HK' ? '港股' : 'A股'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: C.text2, fontSize: 12 }}>{fmtPct(h.allocation)}</span>
                        <div style={{ fontSize: 10, color: C.text3 }}>{h.sector}</div>
                      </td>
                      <td style={{ padding: '10px 12px', color: C.text, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{priceStr}</td>
                      <td style={{ padding: '10px 12px', color: changeColor, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{changeStr}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, color: C.text3 }}>—</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}