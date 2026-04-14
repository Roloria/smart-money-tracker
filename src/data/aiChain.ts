/**
 * aiChain.ts — AI 产业链 & 小盘股 追踪数据
 * Phase 6: 拆解 AI 产业链各层机构的持仓动向 + 小盘股建仓监测
 */

import { getAllHoldings } from './realData';
import type { Holding } from '../types';

// ── AI 产业链分层定义 ─────────────────────────────────────────────────────────
export type AILayer = 'chip' | 'cloud' | 'app' | 'robot' | 'china_ai';

export interface AILayerInfo {
  layer: AILayer;
  label: string;
  labelShort: string;
  labelEn: string;
  color: string;
  description: string;
  keywords: string[];  // 股票代码关键词
}

export const AI_LAYERS: AILayerInfo[] = [
  {
    layer: 'chip',
    label: 'AI 芯片/算力',
    labelShort: '芯片',
    labelEn: 'AI Chips & Compute',
    color: '#f59e0b',
    description: 'GPU、CPU、ASIC、存储 — AI 算力基础层',
    keywords: ['NVDA', 'AMD', 'INTC', 'TSM', 'AMAT', 'LRCX', 'MU', 'SMCI'],
  },
  {
    layer: 'cloud',
    label: 'AI 云/基础设施',
    labelShort: '云',
    labelEn: 'AI Cloud & Infra',
    color: '#38bdf8',
    description: '超大规模云服务商、Data Center、AI 网络',
    keywords: ['MSFT', 'GOOGL', 'AMZN', 'META', 'CRM', 'ORCL', 'IBM'],
  },
  {
    layer: 'app',
    label: 'AI 应用层',
    labelShort: '应用',
    labelEn: 'AI Applications',
    color: '#22c55e',
    description: '企业 AI 软件、自动化、安全、内容生成',
    keywords: ['NOW', 'PANW', 'DDOG', 'SNOW', 'NET', 'ZS', 'HUBS', 'PATH'],
  },
  {
    layer: 'robot',
    label: 'AI 终端/机器人',
    labelShort: '终端',
    labelEn: 'AI Devices & Robotics',
    color: '#a78bfa',
    description: '自动驾驶、智能硬件、机器人、消费 AI 设备',
    keywords: ['TSLA', 'HON', 'AMBA', 'ISRG', 'LTHM'],
  },
  {
    layer: 'china_ai',
    label: '中国 AI',
    labelShort: '中国AI',
    labelEn: 'China AI',
    color: '#f43f5e',
    description: '中国 AI 产业链：芯片/安防/大模型/云计算',
    keywords: ['002415', '600036', '300866', '688110', '1810.HK', '1024.HK', '6690.HK', '000333'],
  },
];

// ── 小盘股定义 ───────────────────────────────────────────────────────────────
export interface SmallCapMeta {
  ticker: string;
  name: string;
  market: string;
  /** 市值（亿美元或等值） */
  marketCap: number;
  /** 是否被机构新建仓 */
  isNewPosition: boolean;
  /** 机构持仓季度变化 */
  instAccumulating: boolean;
  notes: string;
}

export const SMALL_CAP_TRACKED: SmallCapMeta[] = [
  // A股小盘AI
  { ticker: '002415', name: '海康威视', market: 'CN', marketCap: 60, isNewPosition: false, instAccumulating: true, notes: 'AI 安防龙头，视觉大模型落地' },
  { ticker: '688110', name: '东芯股份', market: 'CN', marketCap: 28, isNewPosition: true, instAccumulating: true, notes: 'AI存储芯片，小市值高弹性' },
  { ticker: '300866', name: '安克创新', market: 'CN', marketCap: 45, isNewPosition: false, instAccumulating: true, notes: 'AI+智能硬件出海，ANKER品牌' },
  // 港股小盘
  { ticker: '6690.HK', name: '海尔智家', market: 'HK', marketCap: 42, isNewPosition: false, instAccumulating: true, notes: '智能家居，AI 家电整合' },
  { ticker: '2319.HK', name: '蒙牛乳业', market: 'HK', marketCap: 28, isNewPosition: false, instAccumulating: false, notes: '消费小盘，估值低位' },
];

// ── AI Layer 过滤 ─────────────────────────────────────────────────────────────
export function getAILayerHoldings(layer: AILayer): (Holding & { aiLayer: AILayerInfo })[] {
  const layerInfo = AI_LAYERS.find(l => l.layer === layer)!;
  const all = getAllHoldings();
  return all
    .filter(h => layerInfo.keywords.some(k => h.stockTicker.includes(k.replace('.HK', '.HK').replace('.SZ', '.SZ'))))
    .map(h => ({ ...h, aiLayer: layerInfo }));
}

// ── 所有 AI 产业链汇总 ───────────────────────────────────────────────────────
export interface AIStockSummary {
  ticker: string;
  name: string;
  market: string;
  sector: string;
  layers: AILayer[];
  totalValue: number;
  instCount: number;
  avgChange: number;
  marketCap?: number;
  isSmallCap: boolean;
  isNewPosition: boolean;
  accumulating: boolean;
  priceLevel: 'high' | 'mid' | 'low';
}

export function getAIChainSummary(): AIStockSummary[] {
  const all = getAllHoldings();
  const aiTickers = new Set(AI_LAYERS.flatMap(l => l.keywords));

  // Deduplicate by ticker
  const tickerMap = new Map<string, AIStockSummary>();

  all.filter(h => {
    const t = h.stockTicker;
    return aiTickers.has(t) || SMALL_CAP_TRACKED.some(s => s.ticker === t);
  }).forEach(h => {
    if (tickerMap.has(h.stockTicker)) {
      const existing = tickerMap.get(h.stockTicker)!;
      existing.totalValue += h.marketValue;
      existing.instCount += 1;
      existing.avgChange = (existing.avgChange + h.changePercent) / 2;
    } else {
      const smallCapMeta = SMALL_CAP_TRACKED.find(s => s.ticker === h.stockTicker);
      const matchingLayers = AI_LAYERS.filter(l =>
        l.keywords.includes(h.stockTicker)
      ).map(l => l.layer);

      tickerMap.set(h.stockTicker, {
        ticker: h.stockTicker,
        name: h.stockName,
        market: h.market,
        sector: h.sector,
        layers: matchingLayers,
        totalValue: h.marketValue,
        instCount: 1,
        avgChange: h.changePercent,
        marketCap: smallCapMeta?.marketCap,
        isSmallCap: !!smallCapMeta,
        isNewPosition: smallCapMeta?.isNewPosition || false,
        accumulating: smallCapMeta?.instAccumulating || h.changePercent > 0,
        priceLevel: h.marketValue > 10e9 ? 'high' : h.marketValue > 1e9 ? 'mid' : 'low',
      });
    }
  });

  return Array.from(tickerMap.values())
    .sort((a, b) => b.totalValue - a.totalValue);
}

// ── 小盘股监测信号 ────────────────────────────────────────────────────────────
export interface SmallCapSignal {
  ticker: string;
  name: string;
  market: string;
  signal: 'new_position' | 'accumulating' | 'distributing' | 'momentum';
  severity: 'high' | 'medium' | 'low';
  description: string;
  institutions: string[];
  lastUpdated: string;
}

export function getSmallCapSignals(): SmallCapSignal[] {
  const all = getAllHoldings();
  const trackedSet = new Set(SMALL_CAP_TRACKED.map(s => s.ticker));
  const trackedMeta = new Map(SMALL_CAP_TRACKED.map(s => [s.ticker, s]));

  const signals: SmallCapSignal[] = [];

  trackedSet.forEach(ticker => {
    const holdings = all.filter(h => h.stockTicker === ticker);
    if (holdings.length === 0) return;

    const meta = trackedMeta.get(ticker)!;
    const instNames = holdings.map(h => {
      const inst = (all as any[]).find((x: any) => x.institutionId === h.institutionId);
      return inst?.name || `机构${h.institutionId}`;
    });
    const avgChange = holdings.reduce((s, h) => s + h.changePercent, 0) / holdings.length;

    let signalType: SmallCapSignal['signal'] = 'momentum';
    let severity: SmallCapSignal['severity'] = 'low';
    let desc = '';

    if (meta.isNewPosition && holdings.length >= 1) {
      signalType = 'new_position';
      severity = 'high';
      desc = `新进小盘股：${meta.notes}`;
    } else if (meta.instAccumulating && avgChange > 5) {
      signalType = 'accumulating';
      severity = 'medium';
      desc = `机构持续买入，均价变化 ${avgChange.toFixed(1)}%`;
    } else if (avgChange < -5) {
      signalType = 'distributing';
      severity = 'medium';
      desc = `机构减仓，变化 ${avgChange.toFixed(1)}%`;
    } else if (avgChange > 10) {
      signalType = 'momentum';
      severity = 'high';
      desc = `强劲 momentum，季度增幅 ${avgChange.toFixed(1)}%`;
    } else {
      desc = `平稳持仓，变化 ${avgChange.toFixed(1)}%`;
    }

    signals.push({
      ticker,
      name: meta.name,
      market: meta.market,
      signal: signalType,
      severity,
      description: desc,
      institutions: [...new Set(instNames)],
      lastUpdated: '2025Q4',
    });
  });

  return signals.sort((a, b) => {
    const order = { new_position: 0, accumulating: 1, momentum: 2, distributing: 3 };
    return order[a.signal] - order[b.signal];
  });
}

// ── Layer 机构分布统计 ────────────────────────────────────────────────────────
export interface LayerStats {
  layer: AILayerInfo;
  totalValue: number;
  instCount: number;
  avgChange: number;
  topStock: string;
  stocks: number;
}

export function getLayerStats(): LayerStats[] {
  return AI_LAYERS.map(layer => {
    const holdings = getAILayerHoldings(layer.layer);
    const totalValue = holdings.reduce((s, h) => s + h.marketValue, 0);
    const instCount = holdings.length;
    const avgChange = instCount > 0
      ? holdings.reduce((s, h) => s + h.changePercent, 0) / instCount
      : 0;
    const topStock = holdings.sort((a, b) => b.marketValue - a.marketValue)[0]?.stockTicker || '—';
    return { layer, totalValue, instCount, avgChange, topStock, stocks: holdings.length };
  });
}
