export interface Institution {
  id: number;
  name: string;        // 中文名
  nameEn: string;
  type: 'hedge' | 'sovereign' | 'asset_manager' | 'bank';
  country: string;
  color: string;
  totalValue: number;
  holdingCount: number;
}

export interface Holding {
  id: number;
  institutionId: number;
  stockTicker: string;
  stockName: string;
  sector: string;
  shares: number;
  marketValue: number;
  ownershipPercent: number;
  quarter: string;
  changeShares: number;
  changePercent: number;
  market?: 'US' | 'HK' | 'CN';
  /** 数据来源标签（SEC_EDGAR / EASTMONEY_QFII / TUSHARE_HSGT / HKEX） */
  _dataSource?: string;
  /** 是否来自真实数据源 */
  _isRealData?: boolean;
}

export interface AlertRule {
  id: number;
  stockTicker: string;
  stockName: string;
  institutionIds: number[] | 'all';
  thresholdPercent: number;
  notifyEmail: boolean;
  notifyFeishu: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface HoldingChange {
  id: number;
  institutionId: number;
  stockTicker: string;
  stockName: string;
  changeType: 'increase' | 'decrease' | 'new' | 'exited';
  changePercent: number;
  previousShares: number;
  currentShares: number;
  quarter: string;
}
