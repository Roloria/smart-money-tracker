/**
 * hkexFetcher.ts — HKEX 披露易持股数据
 * 抓取重大持仓披露 (Significant Shareholding Notices)
 * 数据源：港交所披露易 > 发行人股本证券 > 股权披露
 */
import type { Holding } from '../types';

const HKEX_DISCLOSURE_URL = 'https://www.hkex.com.hk/eng/investing/securities/equities/DiscloReptsofSHares/';

export interface HKEXDisclosure {
  stockCode: string;
  stockName: string;
  shareholderName: string;
  shareType: 'P' | 'S'; // P=好仓(Long), S=淡仓(Short)
  sharesHeld: number;
  pctOfTotal: number;
  filingDate: string;
  releaseDate: string;
}

/** 通过网页抓取某只港股的大股东持仓（示例） */
export async function fetchHKEXDisclosures(ticker: string): Promise<HKEXDisclosure[]> {
  // TODO: 实现 HKEX 披露易网页爬虫
  // https://www.hkex.com.hk/eng/investing/securities/equities/DiscloReptsofSHares/
  // 返回数据结构见 HKEXDisclosure
  return [];
}

/** 获取指定机构的大股东持仓 */
export async function fetchInstitutionHKEXHoldings(
  instName: string,
  stockTicker: string
): Promise<Holding[]> {
  const disclosures = await fetchHKEXDisclosures(stockTicker);
  const filtered = disclosures.filter(
    d => d.shareholderName.toLowerCase().includes(instName.toLowerCase())
  );
  return filtered.map(d => ({
    id: Math.random(),
    institutionId: 0,
    stockTicker: d.stockCode,
    stockName: d.stockName,
    sector: '',
    shares: d.sharesHeld,
    marketValue: 0,
    ownershipPercent: d.pctOfTotal,
    market: 'HK',
    quarter: new Date().toISOString().slice(0, 7) + 'Q',
    changeShares: 0,
    changePercent: 0,
  }));
}
