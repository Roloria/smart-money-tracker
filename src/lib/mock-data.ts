// ============================================================
// Mock Data — 13F Institutional Holdings (SEC EDGAR based)
// ============================================================

export type Market = 'US' | 'HK' | 'CN'

export interface Institution {
  id: number
  name: string
  nameCn: string
  type: 'hedge' | 'sovereign' | 'asset_manager' | 'bank'
  country: string
  // SEC 13F info
  cik: string // SEC Central Index Key
  filerName: string
  // Latest filing
  latestFiling?: string // YYYY-QN
  latestFilingDate?: string
  totalHoldings?: number
  totalValue?: number // USD
  totalValueUsd?: number // USD alias
}

export interface Holding {
  id: number
  institutionId: number
  ticker: string
  stockName: string
  market: Market
  shares: number
  marketValueUsd: number
  ownershipPercent: number // %
  quarter: string // "2025-Q4"
  filingDate: string
  // QoQ changes
  sharesChange?: number
  sharesChangePercent?: number
  valueChangePercent?: number
}

export interface AlertRule {
  id: number
  institutionId: number
  ticker: string
  thresholdPct: number
  isActive: boolean
  channels: ('email' | 'telegram' | 'feishu')[]
}

export interface AlertLog {
  id: number
  institutionId: number
  institutionName: string
  ticker: string
  changePct: number
  direction: 'increase' | 'decrease'
  quarter: string
  notifiedAt: string
  channel: 'email' | 'feishu'
}

// --- Institutions ---

export const INSTITUTIONS: Institution[] = [
  {
    id: 1,
    name: 'TCI Fund Management',
    nameCn: 'TCI资本',
    type: 'hedge',
    country: 'UK',
    cik: '0001777614',
    filerName: 'TCI Fund Management Ltd',
    latestFiling: '2025-Q4',
    latestFilingDate: '2026-02-14',
    totalHoldings: 27,
    totalValueUsd: 18_400_000_000,
  },
  {
    id: 2,
    name: 'Bridgewater Associates',
    nameCn: '桥水基金',
    type: 'hedge',
    country: 'USA',
    cik: '0001350694',
    filerName: 'Bridgewater Associates LP',
    latestFiling: '2025-Q4',
    latestFilingDate: '2026-02-13',
    totalHoldings: 152,
    totalValueUsd: 113_000_000_000,
  },
  {
    id: 3,
    name: 'Goldman Sachs Group',
    nameCn: '高盛集团',
    type: 'bank',
    country: 'USA',
    cik: '0000886982',
    filerName: 'GOLDMAN SACHS GROUP INC',
    latestFiling: '2025-Q4',
    latestFilingDate: '2026-02-13',
    totalHoldings: 3247,
    totalValueUsd: 556_000_000_000,
  },
  {
    id: 4,
    name: 'JPMorgan Chase',
    nameCn: '摩根大通',
    type: 'bank',
    country: 'USA',
    cik: '0000019617',
    filerName: 'JPMORGAN CHASE & CO',
    latestFiling: '2025-Q4',
    latestFilingDate: '2026-02-13',
    totalHoldings: 4122,
    totalValueUsd: 612_000_000_000,
  },
  {
    id: 5,
    name: 'BlackRock',
    nameCn: '贝莱德',
    type: 'asset_manager',
    country: 'USA',
    cik: '0001364742',
    filerName: 'BLACKROCK INC',
    latestFiling: '2025-Q4',
    latestFilingDate: '2026-02-13',
    totalHoldings: 5234,
    totalValueUsd: 4_280_000_000_000,
  },
  {
    id: 6,
    name: 'Fidelity Investments',
    nameCn: '富达投资',
    type: 'asset_manager',
    country: 'USA',
    cik: '0000717243',
    filerName: 'FMR LLC',
    latestFiling: '2025-Q4',
    latestFilingDate: '2026-02-13',
    totalHoldings: 4872,
    totalValueUsd: 4_120_000_000_000,
  },
  {
    id: 7,
    name: 'Neuberger Berman',
    nameCn: '路博迈',
    type: 'asset_manager',
    country: 'USA',
    cik: '0001169269',
    filerName: 'NEUBERGER BERMAN GROUP LLC',
    latestFiling: '2025-Q4',
    latestFilingDate: '2026-02-14',
    totalHoldings: 892,
    totalValueUsd: 412_000_000_000,
  },
  {
    id: 8,
    name: 'AllianceBernstein',
    nameCn: '联博',
    type: 'asset_manager',
    country: 'USA',
    cik: '0000815917',
    filerName: 'ALLIANCEBERNSTEIN LP',
    latestFiling: '2025-Q4',
    latestFilingDate: '2026-02-13',
    totalHoldings: 1240,
    totalValueUsd: 318_000_000_000,
  },
  {
    id: 9,
    name: 'Abu Dhabi Investment Authority',
    nameCn: '阿布达比投资局',
    type: 'sovereign',
    country: 'UAE',
    cik: '0001037089',
    filerName: 'ABU DHABI INVESTMENT AUTHORITY',
    latestFiling: '2025-Q3',
    latestFilingDate: '2025-11-14',
    totalHoldings: 412,
    totalValueUsd: 993_000_000_000,
  },
  {
    id: 10,
    name: 'Kuwait Investment Authority',
    nameCn: '科威特投资局',
    type: 'sovereign',
    country: 'Kuwait',
    cik: '0001039260',
    filerName: 'STATE OF KUWAIT MINISTRY OF FINANCE',
    latestFiling: '2025-Q3',
    latestFilingDate: '2025-11-14',
    totalHoldings: 189,
    totalValueUsd: 122_000_000_000,
  },
]

// --- Holdings ---

export const HOLDINGS: Holding[] = [
  // TCI Fund — Q4 2025 (Top positions)
  {
    id: 1,
    institutionId: 1,
    ticker: 'GOOGL',
    stockName: 'Alphabet Inc Class A',
    market: 'US',
    shares: 35_000_000,
    marketValueUsd: 6_125_000_000,
    ownershipPercent: 5.72,
    quarter: '2025-Q4',
    filingDate: '2026-02-14',
    sharesChange: -2_100_000,
    sharesChangePercent: -5.66,
    valueChangePercent: -4.8,
  },
  {
    id: 2,
    institutionId: 1,
    ticker: 'AMZN',
    stockName: 'Amazon.com Inc',
    market: 'US',
    shares: 28_000_000,
    marketValueUsd: 5_488_000_000,
    ownershipPercent: 2.81,
    quarter: '2025-Q4',
    filingDate: '2026-02-14',
    sharesChange: 4_200_000,
    sharesChangePercent: 17.65,
    valueChangePercent: 18.9,
  },
  {
    id: 3,
    institutionId: 1,
    ticker: 'MSFT',
    stockName: 'Microsoft Corp',
    market: 'US',
    shares: 14_500_000,
    marketValueUsd: 5_985_000_000,
    ownershipPercent: 2.04,
    quarter: '2025-Q4',
    filingDate: '2026-02-14',
    sharesChange: 0,
    sharesChangePercent: 0,
    valueChangePercent: 2.1,
  },
  {
    id: 4,
    institutionId: 1,
    ticker: 'META',
    stockName: 'Meta Platforms',
    market: 'US',
    shares: 9_800_000,
    marketValueUsd: 4_410_000_000,
    ownershipPercent: 3.92,
    quarter: '2025-Q4',
    filingDate: '2026-02-14',
    sharesChange: -800_000,
    sharesChangePercent: -7.55,
    valueChangePercent: -6.2,
  },

  // Bridgewater — Q4 2025
  {
    id: 5,
    institutionId: 2,
    ticker: 'SPY',
    stockName: 'SPDR S&P 500 ETF Trust',
    market: 'US',
    shares: 17_500_000,
    marketValueUsd: 8_750_000_000,
    ownershipPercent: 4.12,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: 0,
    sharesChangePercent: 0,
    valueChangePercent: -1.8,
  },
  {
    id: 6,
    institutionId: 2,
    ticker: 'IEMG',
    stockName: 'iShares Core MSCI EM ETF',
    market: 'US',
    shares: 22_000_000,
    marketValueUsd: 8_580_000_000,
    ownershipPercent: 3.44,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: 1_500_000,
    sharesChangePercent: 7.32,
    valueChangePercent: 8.1,
  },
  {
    id: 7,
    institutionId: 2,
    ticker: 'EWJ',
    stockName: 'iShares MSCI Japan ETF',
    market: 'US',
    shares: 45_000_000,
    marketValueUsd: 4_185_000_000,
    ownershipPercent: 5.88,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: -3_000_000,
    sharesChangePercent: -6.25,
    valueChangePercent: -5.9,
  },

  // BlackRock — Q4 2025 (sample top holdings)
  {
    id: 8,
    institutionId: 5,
    ticker: 'AAPL',
    stockName: 'Apple Inc',
    market: 'US',
    shares: 3_200_000_000,
    marketValueUsd: 614_400_000_000,
    ownershipPercent: 6.82,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: 45_000_000,
    sharesChangePercent: 1.43,
    valueChangePercent: 3.2,
  },
  {
    id: 9,
    institutionId: 5,
    ticker: 'MSFT',
    stockName: 'Microsoft Corp',
    market: 'US',
    shares: 2_450_000_000,
    marketValueUsd: 1_012_000_000_000,
    ownershipPercent: 3.48,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: 12_000_000,
    sharesChangePercent: 0.49,
    valueChangePercent: 2.1,
  },
  {
    id: 10,
    institutionId: 5,
    ticker: 'NVDA',
    stockName: 'NVIDIA Corp',
    market: 'US',
    shares: 2_180_000_000,
    marketValueUsd: 2_073_000_000_000,
    ownershipPercent: 8.91,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: 185_000_000,
    sharesChangePercent: 9.28,
    valueChangePercent: 12.4,
  },

  // Goldman Sachs — Q4 2025
  {
    id: 11,
    institutionId: 3,
    ticker: 'SPY',
    stockName: 'SPDR S&P 500 ETF Trust',
    market: 'US',
    shares: 28_000_000,
    marketValueUsd: 14_000_000_000,
    ownershipPercent: 3.31,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: 2_100_000,
    sharesChangePercent: 8.11,
    valueChangePercent: 9.5,
  },
  {
    id: 12,
    institutionId: 3,
    ticker: 'NVDA',
    stockName: 'NVIDIA Corp',
    market: 'US',
    shares: 48_000_000,
    marketValueUsd: 45_600_000_000,
    ownershipPercent: 1.97,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: 18_000_000,
    sharesChangePercent: 60.0,
    valueChangePercent: 68.2,
  },
  {
    id: 13,
    institutionId: 3,
    ticker: 'AAPL',
    stockName: 'Apple Inc',
    market: 'US',
    shares: 95_000_000,
    marketValueUsd: 18_240_000_000,
    ownershipPercent: 0.62,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: -22_000_000,
    sharesChangePercent: -18.8,
    valueChangePercent: -16.5,
  },

  // JPMorgan — Q4 2025
  {
    id: 14,
    institutionId: 4,
    ticker: 'JPM',
    stockName: 'JPMorgan Chase',
    market: 'US',
    shares: 2_180_000_000,
    marketValueUsd: 435_600_000_000,
    ownershipPercent: 7.82,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: 35_000_000,
    sharesChangePercent: 1.63,
    valueChangePercent: 4.1,
  },
  {
    id: 15,
    institutionId: 4,
    ticker: 'BAC',
    stockName: 'Bank of America',
    market: 'US',
    shares: 3_200_000_000,
    marketValueUsd: 138_200_000_000,
    ownershipPercent: 9.12,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: -80_000_000,
    sharesChangePercent: -2.44,
    valueChangePercent: -1.2,
  },

  // Fidelity — Q4 2025
  {
    id: 16,
    institutionId: 6,
    ticker: 'AAPL',
    stockName: 'Apple Inc',
    market: 'US',
    shares: 1_850_000_000,
    marketValueUsd: 355_200_000_000,
    ownershipPercent: 3.95,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: 28_000_000,
    sharesChangePercent: 1.54,
    valueChangePercent: 3.1,
  },
  {
    id: 17,
    institutionId: 6,
    ticker: 'NVDA',
    stockName: 'NVIDIA Corp',
    market: 'US',
    shares: 950_000_000,
    marketValueUsd: 903_000_000_000,
    ownershipPercent: 3.88,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: 120_000_000,
    sharesChangePercent: 14.46,
    valueChangePercent: 17.8,
  },
  {
    id: 18,
    institutionId: 6,
    ticker: 'AMZN',
    stockName: 'Amazon.com Inc',
    market: 'US',
    shares: 780_000_000,
    marketValueUsd: 152_800_000_000,
    ownershipPercent: 2.18,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: 65_000_000,
    sharesChangePercent: 9.09,
    valueChangePercent: 10.4,
  },

  // ADIA — Q3 2025
  {
    id: 19,
    institutionId: 9,
    ticker: 'BRK.B',
    stockName: 'Berkshire Hathaway B',
    market: 'US',
    shares: 28_000_000,
    marketValueUsd: 12_180_000_000,
    ownershipPercent: 1.88,
    quarter: '2025-Q3',
    filingDate: '2025-11-14',
    sharesChange: 0,
    sharesChangePercent: 0,
    valueChangePercent: 1.2,
  },
  {
    id: 20,
    institutionId: 9,
    ticker: 'XOM',
    stockName: 'Exxon Mobil Corp',
    market: 'US',
    shares: 18_000_000,
    marketValueUsd: 1_980_000_000,
    ownershipPercent: 0.48,
    quarter: '2025-Q3',
    filingDate: '2025-11-14',
    sharesChange: -2_000_000,
    sharesChangePercent: -10.0,
    valueChangePercent: -8.4,
  },
  {
    id: 21,
    institutionId: 9,
    ticker: 'T',
    stockName: 'AT&T Inc',
    market: 'US',
    shares: 85_000_000,
    marketValueUsd: 1_955_000_000,
    ownershipPercent: 1.18,
    quarter: '2025-Q3',
    filingDate: '2025-11-14',
    sharesChange: 8_500_000,
    sharesChangePercent: 11.1,
    valueChangePercent: 12.8,
  },

  // Neuberger Berman — Q4 2025
  {
    id: 22,
    institutionId: 7,
    ticker: 'TSLA',
    stockName: 'Tesla Inc',
    market: 'US',
    shares: 12_000_000,
    marketValueUsd: 4_800_000_000,
    ownershipPercent: 3.85,
    quarter: '2025-Q4',
    filingDate: '2026-02-14',
    sharesChange: 3_500_000,
    sharesChangePercent: 41.18,
    valueChangePercent: 48.2,
  },

  // AllianceBernstein — Q4 2025
  {
    id: 23,
    institutionId: 8,
    ticker: 'PFE',
    stockName: 'Pfizer Inc',
    market: 'US',
    shares: 42_000_000,
    marketValueUsd: 1_218_000_000,
    ownershipPercent: 2.28,
    quarter: '2025-Q4',
    filingDate: '2026-02-13',
    sharesChange: -5_000_000,
    sharesChangePercent: -10.64,
    valueChangePercent: -9.2,
  },
]

// --- Alert Logs ---

export const ALERT_LOGS: AlertLog[] = [
  {
    id: 1,
    institutionId: 3,
    institutionName: 'Goldman Sachs',
    ticker: 'NVDA',
    changePct: 60.0,
    direction: 'increase',
    quarter: '2025-Q4',
    notifiedAt: '2026-02-13 21:00',
    channel: 'feishu',
  },
  {
    id: 2,
    institutionId: 3,
    institutionName: 'Goldman Sachs',
    ticker: 'AAPL',
    changePct: -18.8,
    direction: 'decrease',
    quarter: '2025-Q4',
    notifiedAt: '2026-02-13 21:00',
    channel: 'feishu',
  },
  {
    id: 3,
    institutionId: 7,
    institutionName: 'Neuberger Berman',
    ticker: 'TSLA',
    changePct: 41.18,
    direction: 'increase',
    quarter: '2025-Q4',
    notifiedAt: '2026-02-14 21:00',
    channel: 'feishu',
  },
  {
    id: 4,
    institutionId: 8,
    institutionName: 'AllianceBernstein',
    ticker: 'PFE',
    changePct: -10.64,
    direction: 'decrease',
    quarter: '2025-Q4',
    notifiedAt: '2026-02-13 21:00',
    channel: 'feishu',
  },
  {
    id: 5,
    institutionId: 9,
    institutionName: 'ADIA',
    ticker: 'XOM',
    changePct: -10.0,
    direction: 'decrease',
    quarter: '2025-Q3',
    notifiedAt: '2025-11-14 21:00',
    channel: 'feishu',
  },
]

// Alert rules
export const ALERT_RULES: AlertRule[] = [
  { id: 1, institutionId: 1, ticker: 'GOOGL', thresholdPct: 20, isActive: true, channels: ['feishu'] },
  { id: 2, institutionId: 1, ticker: 'AMZN', thresholdPct: 20, isActive: true, channels: ['feishu'] },
  { id: 3, institutionId: 2, ticker: 'SPY', thresholdPct: 15, isActive: true, channels: ['feishu'] },
  { id: 4, institutionId: 3, ticker: 'NVDA', thresholdPct: 30, isActive: true, channels: ['feishu', 'email'] },
  { id: 5, institutionId: 4, ticker: 'JPM', thresholdPct: 20, isActive: true, channels: ['feishu'] },
  { id: 6, institutionId: 5, ticker: 'NVDA', thresholdPct: 30, isActive: false, channels: ['feishu'] },
  { id: 7, institutionId: 6, ticker: 'TSLA', thresholdPct: 25, isActive: true, channels: ['feishu'] },
]

// Stats summary
export const STATS_SUMMARY = {
  totalInstitutions: 10,
  totalHoldings: 18_420_000_000,
  totalValueUsd: 12_800_000_000_000,
  topGainer: { ticker: 'NVDA', institution: 'Goldman Sachs', change: 60.0 },
  topLoser: { ticker: 'AAPL', institution: 'Goldman Sachs', change: -18.8 },
  recentAlerts: 5,
  lastUpdated: '2026-02-14',
}
