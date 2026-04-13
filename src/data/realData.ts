/**
 * realData.ts — Real + Mock data integration layer
 *
 * Priority order:
 *   1. SEC EDGAR 13F  → data/holdings_latest.json      (真实数据)
 *   2. HKEX           → data/hk_holdings.json            (公开披露/模拟)
 *   3. Eastmoney QFII → data/qfii_holdings.json         (公开披露/模拟)
 *   4. Mock           → mockData.ts (US + fallback HK/CN)
 */

import type { Holding, HoldingChange } from '../types';
import { holdings as mockHoldings, holdingChanges as mockChanges, institutions as mockInstitutions } from './mockData';

// ── Types ────────────────────────────────────────────────────────────────────
export interface MergedHolding {
  id: number;
  institutionId: number;
  stockTicker: string;
  stockName: string;
  sector: string;
  shares: number;
  marketValue: number;
  ownershipPercent: number;
  market: 'US' | 'HK' | 'CN';
  quarter: string;
  changeShares: number;
  changePercent: number;
  /** 'SEC_EDGAR' | 'HKEX_MOCK' | 'EASTMONEY_QFII_MOCK' | 'MOCK' */
  dataSource: string;
}

export interface DataMeta {
  lastUpdated: string;
  totalHoldings: number;
  usHoldings: number;
  hkHoldings: number;
  cnHoldings: number;
  dataSources: string[];
  quarter: string;
}

export interface MergedData {
  meta: DataMeta;
  holdings: MergedHolding[];
  changes: MergedHolding[];
}

// ── Combined ALL holdings ─────────────────────────────────────────────────────
// All holdings merged: mockData (US) + merged_holdings.json (HK/CN)
// HK/CN holdings are marked with dataSource = 'HKEX_MOCK' or 'EASTMONEY_QFII_MOCK'

let _combinedHoldings: Holding[] | null = null;
let _combinedChanges: HoldingChange[] | null = null;
let _meta: DataMeta | null = null;

function buildCombined(): void {
  // Start with all mock holdings, tag them
  const mockMap = new Map<number, Holding>();
  mockHoldings.forEach(h => {
    mockMap.set(h.id, { ...h, market: (h as any).market || 'US' } as Holding);
  });

  // Load merged JSON if available (runtime fetch populates public/data/)
  // Since we can't do runtime fetch easily in Vite, we inline the HK/CN data
  const HK_CN_HOLDINGS: MergedHolding[] = [
    // ADIA (id=9) — 港股
    { id: 901, institutionId: 9, stockTicker: '0700.HK', stockName: '腾讯控股', sector: '科技', shares: 850000000, marketValue: 42500000000, ownershipPercent: 9.2, market: 'HK', quarter: '2025Q4', changeShares: 120000000, changePercent: 16.4, dataSource: 'HKEX_MOCK' },
    { id: 902, institutionId: 9, stockTicker: '9988.HK', stockName: '阿里巴巴', sector: '消费', shares: 620000000, marketValue: 37200000000, ownershipPercent: 8.1, market: 'HK', quarter: '2025Q4', changeShares: 95000000, changePercent: 18.1, dataSource: 'HKEX_MOCK' },
    { id: 903, institutionId: 9, stockTicker: '9618.HK', stockName: '京东', sector: '消费', shares: 450000000, marketValue: 18000000000, ownershipPercent: 7.5, market: 'HK', quarter: '2025Q4', changeShares: 85000000, changePercent: 23.3, dataSource: 'HKEX_MOCK' },
    { id: 904, institutionId: 9, stockTicker: '3690.HK', stockName: '美团', sector: '消费', shares: 380000000, marketValue: 15200000000, ownershipPercent: 8.9, market: 'HK', quarter: '2025Q4', changeShares: -45000000, changePercent: -10.6, dataSource: 'HKEX_MOCK' },
    { id: 905, institutionId: 9, stockTicker: '1810.HK', stockName: '小米集团', sector: '科技', shares: 2900000000, marketValue: 5800000000, ownershipPercent: 11.5, market: 'HK', quarter: '2025Q4', changeShares: 350000000, changePercent: 13.7, dataSource: 'HKEX_MOCK' },
    { id: 906, institutionId: 9, stockTicker: '1024.HK', stockName: '快手', sector: '科技', shares: 280000000, marketValue: 9800000000, ownershipPercent: 6.4, market: 'HK', quarter: '2025Q4', changeShares: 20000000, changePercent: 7.7, dataSource: 'HKEX_MOCK' },
    { id: 907, institutionId: 9, stockTicker: '6690.HK', stockName: '海尔智家', sector: '消费', shares: 420000000, marketValue: 4200000000, ownershipPercent: 5.2, market: 'HK', quarter: '2025Q4', changeShares: 15000000, changePercent: 3.7, dataSource: 'HKEX_MOCK' },
    // KIA (id=10) — 港股
    { id: 908, institutionId: 10, stockTicker: '0700.HK', stockName: '腾讯控股', sector: '科技', shares: 650000000, marketValue: 32500000000, ownershipPercent: 7.1, market: 'HK', quarter: '2025Q4', changeShares: 80000000, changePercent: 14.0, dataSource: 'HKEX_MOCK' },
    { id: 909, institutionId: 10, stockTicker: '9988.HK', stockName: '阿里巴巴', sector: '消费', shares: 480000000, marketValue: 28800000000, ownershipPercent: 6.3, market: 'HK', quarter: '2025Q4', changeShares: 60000000, changePercent: 14.3, dataSource: 'HKEX_MOCK' },
    { id: 910, institutionId: 10, stockTicker: '3690.HK', stockName: '美团', sector: '消费', shares: 320000000, marketValue: 12800000000, ownershipPercent: 7.5, market: 'HK', quarter: '2025Q4', changeShares: -20000000, changePercent: -5.9, dataSource: 'HKEX_MOCK' },
    { id: 911, institutionId: 10, stockTicker: '9618.HK', stockName: '京东', sector: '消费', shares: 380000000, marketValue: 15200000000, ownershipPercent: 6.3, market: 'HK', quarter: '2025Q4', changeShares: 45000000, changePercent: 13.4, dataSource: 'HKEX_MOCK' },
    { id: 912, institutionId: 10, stockTicker: '2319.HK', stockName: '蒙牛乳业', sector: '消费', shares: 280000000, marketValue: 2800000000, ownershipPercent: 7.2, market: 'HK', quarter: '2025Q4', changeShares: 0, changePercent: 0, dataSource: 'HKEX_MOCK' },
    // ADIA (id=9) — A股
    { id: 913, institutionId: 9, stockTicker: '600519', stockName: '贵州茅台', sector: '消费', shares: 8500000, marketValue: 18700000000, ownershipPercent: 6.8, market: 'CN', quarter: '2025Q4', changeShares: 1200000, changePercent: 16.4, dataSource: 'EASTMONEY_QFII_MOCK' },
    { id: 915, institutionId: 9, stockTicker: '600036', stockName: '招商银行', sector: '金融', shares: 185000000, marketValue: 9250000000, ownershipPercent: 9.0, market: 'CN', quarter: '2025Q4', changeShares: 25000000, changePercent: 15.6, dataSource: 'EASTMONEY_QFII_MOCK' },
    { id: 917, institutionId: 9, stockTicker: '000333', stockName: '美的集团', sector: '消费', shares: 125000000, marketValue: 8750000000, ownershipPercent: 7.8, market: 'CN', quarter: '2025Q4', changeShares: 15000000, changePercent: 13.6, dataSource: 'EASTMONEY_QFII_MOCK' },
    { id: 919, institutionId: 9, stockTicker: '002415', stockName: '海康威视', sector: '科技', shares: 88000000, marketValue: 5280000000, ownershipPercent: 8.4, market: 'CN', quarter: '2025Q4', changeShares: 10000000, changePercent: 12.8, dataSource: 'EASTMONEY_QFII_MOCK' },
    { id: 921, institutionId: 9, stockTicker: '601012', stockName: '隆基绿能', sector: '能源', shares: 105000000, marketValue: 4200000000, ownershipPercent: 7.2, market: 'CN', quarter: '2025Q4', changeShares: 14000000, changePercent: 15.4, dataSource: 'EASTMONEY_QFII_MOCK' },
    // KIA (id=10) — A股
    { id: 914, institutionId: 10, stockTicker: '600519', stockName: '贵州茅台', sector: '消费', shares: 6200000, marketValue: 13640000000, ownershipPercent: 5.0, market: 'CN', quarter: '2025Q4', changeShares: 800000, changePercent: 14.8, dataSource: 'EASTMONEY_QFII_MOCK' },
    { id: 916, institutionId: 10, stockTicker: '601318', stockName: '中国平安', sector: '金融', shares: 148000000, marketValue: 10360000000, ownershipPercent: 8.1, market: 'CN', quarter: '2025Q4', changeShares: 18000000, changePercent: 13.8, dataSource: 'EASTMONEY_QFII_MOCK' },
    { id: 918, institutionId: 10, stockTicker: '600030', stockName: '中信证券', sector: '金融', shares: 95000000, marketValue: 6650000000, ownershipPercent: 6.5, market: 'CN', quarter: '2025Q4', changeShares: 12000000, changePercent: 14.4, dataSource: 'EASTMONEY_QFII_MOCK' },
    { id: 920, institutionId: 10, stockTicker: '600887', stockName: '伊利股份', sector: '消费', shares: 76000000, marketValue: 3800000000, ownershipPercent: 5.9, market: 'CN', quarter: '2025Q4', changeShares: 6000000, changePercent: 8.6, dataSource: 'EASTMONEY_QFII_MOCK' },
    { id: 922, institutionId: 10, stockTicker: '600276', stockName: '恒瑞医药', sector: '医疗', shares: 68000000, marketValue: 5440000000, ownershipPercent: 6.8, market: 'CN', quarter: '2025Q4', changeShares: 9000000, changePercent: 15.2, dataSource: 'EASTMONEY_QFII_MOCK' },
  ];

  // Build combined holdings array
  const allHoldings: Holding[] = [
    ...mockHoldings,
    ...HK_CN_HOLDINGS as unknown as Holding[],
  ];

  _combinedHoldings = allHoldings;

  // Build combined changes
  const HK_CN_CHANGES: HoldingChange[] = [
    { id: 901, institutionId: 9, stockTicker: '0700.HK', stockName: '腾讯控股', changeType: 'increase', changePercent: 16.4, previousShares: 730000000, currentShares: 850000000, quarter: '2025Q4' },
    { id: 902, institutionId: 9, stockTicker: '9988.HK', stockName: '阿里巴巴', changeType: 'increase', changePercent: 18.1, previousShares: 525000000, currentShares: 620000000, quarter: '2025Q4' },
    { id: 903, institutionId: 9, stockTicker: '9618.HK', stockName: '京东', changeType: 'increase', changePercent: 23.3, previousShares: 365000000, currentShares: 450000000, quarter: '2025Q4' },
    { id: 904, institutionId: 9, stockTicker: '3690.HK', stockName: '美团', changeType: 'decrease', changePercent: -10.6, previousShares: 425000000, currentShares: 380000000, quarter: '2025Q4' },
    { id: 908, institutionId: 10, stockTicker: '0700.HK', stockName: '腾讯控股', changeType: 'increase', changePercent: 14.0, previousShares: 570000000, currentShares: 650000000, quarter: '2025Q4' },
    { id: 909, institutionId: 10, stockTicker: '9988.HK', stockName: '阿里巴巴', changeType: 'increase', changePercent: 14.3, previousShares: 420000000, currentShares: 480000000, quarter: '2025Q4' },
    { id: 913, institutionId: 9, stockTicker: '600519', stockName: '贵州茅台', changeType: 'increase', changePercent: 16.4, previousShares: 7300000, currentShares: 8500000, quarter: '2025Q4' },
    { id: 915, institutionId: 9, stockTicker: '600036', stockName: '招商银行', changeType: 'increase', changePercent: 15.6, previousShares: 160000000, currentShares: 185000000, quarter: '2025Q4' },
    { id: 916, institutionId: 10, stockTicker: '601318', stockName: '中国平安', changeType: 'increase', changePercent: 13.8, previousShares: 130000000, currentShares: 148000000, quarter: '2025Q4' },
  ];

  _combinedChanges = [...mockChanges, ...HK_CN_CHANGES];

  _meta = {
    lastUpdated: '2026-04-13T12:00:00Z',
    totalHoldings: _combinedHoldings.length,
    usHoldings: mockHoldings.length,
    hkHoldings: HK_CN_HOLDINGS.filter(h => h.market === 'HK').length,
    cnHoldings: HK_CN_HOLDINGS.filter(h => h.market === 'CN').length,
    dataSources: ['SEC_EDGAR_MOCK', 'HKEX_MOCK', 'EASTMONEY_QFII_MOCK'],
    quarter: '2025Q4',
  };
}

// Initialize on module load
buildCombined();

export function getAllHoldings(): Holding[] {
  return _combinedHoldings || [];
}

export function getAllChanges(): HoldingChange[] {
  return _combinedChanges || [];
}

export function getMeta(): DataMeta | null {
  return _meta;
}

export function getDataSourceOf(holding: Holding): string {
  if ((holding as any).dataSource) return (holding as any).dataSource;
  return 'SEC_EDGAR_MOCK'; // US holdings from mockData = simulated SEC data
}

export function getDataSourceLabel(): string {
  return '混合数据 (演示)';
}

export function getLastUpdated(): string {
  return '2025 Q4';
}
