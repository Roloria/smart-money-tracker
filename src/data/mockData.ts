import { Institution, Holding, AlertRule, HoldingChange } from '../types';

export const institutions: Institution[] = [
  { id: 1, name: 'TCI Fund', nameEn: 'TCI Fund Management', type: 'hedge', country: '英国', color: '#6366f1', totalValue: 45200000000, holdingCount: 28 },
  { id: 2, name: '桥水基金', nameEn: 'Bridgewater Associates', type: 'hedge', country: '美国', color: '#f59e0b', totalValue: 124500000000, holdingCount: 186 },
  { id: 3, name: '高盛', nameEn: 'Goldman Sachs', type: 'bank', country: '美国', color: '#facc15', totalValue: 89000000000, holdingCount: 312 },
  { id: 4, name: '摩根大通', nameEn: 'JPMorgan Chase', type: 'bank', country: '美国', color: '#16a34a', totalValue: 112300000000, holdingCount: 405 },
  { id: 5, name: '贝莱德', nameEn: 'BlackRock', type: 'asset_manager', country: '美国', color: '#0ea5e9', totalValue: 234000000000, holdingCount: 892 },
  { id: 6, name: '富达投资', nameEn: 'Fidelity Investments', type: 'asset_manager', country: '美国', color: '#22c55e', totalValue: 178000000000, holdingCount: 624 },
  { id: 7, name: '路博迈', nameEn: 'Neuberger Berman', type: 'asset_manager', country: '美国', color: '#a78bfa', totalValue: 41200000000, holdingCount: 156 },
  { id: 8, name: '联博资管', nameEn: 'AllianceBernstein', type: 'asset_manager', country: '美国', color: '#f43f5e', totalValue: 35600000000, holdingCount: 98 },
  { id: 9, name: '阿布扎比投资局', nameEn: 'Abu Dhabi Investment Authority', type: 'sovereign', country: '阿联酋', color: '#84cc16', totalValue: 993000000000, holdingCount: 542 },
  { id: 10, name: '科威特投资局', nameEn: 'Kuwait Investment Authority', type: 'sovereign', country: '科威特', color: '#e879f9', totalValue: 750000000000, holdingCount: 387 },
  { id: 11, name: '摩根士丹利', nameEn: 'Morgan Stanley', type: 'bank', country: '美国', color: '#ec4899', totalValue: 95000000000, holdingCount: 220 },
];

export const holdings: Holding[] = [
  // TCI Fund
  { id: 1, institutionId: 1, stockTicker: 'AAPL', stockName: '苹果', sector: '科技', shares: 45000000, marketValue: 9450000000, ownershipPercent: 2.9, market: 'US', quarter: '2025Q4', changeShares: 5000000, changePercent: 12.5 },
  { id: 2, institutionId: 1, stockTicker: 'MSFT', stockName: '微软', sector: '科技', shares: 22000000, marketValue: 9240000000, ownershipPercent: 2.1, market: 'US', quarter: '2025Q4', changeShares: 3000000, changePercent: 15.8 },
  { id: 3, institutionId: 1, stockTicker: 'GOOGL', stockName: '谷歌', sector: '科技', shares: 15000000, marketValue: 2700000000, ownershipPercent: 1.8, market: 'US', quarter: '2025Q4', changeShares: -2000000, changePercent: -11.8 },
  { id: 4, institutionId: 1, stockTicker: 'AMZN', stockName: '亚马逊', sector: '消费', shares: 8000000, marketValue: 1680000000, ownershipPercent: 1.2, market: 'US', quarter: '2025Q4', changeShares: 1000000, changePercent: 14.3 },
  { id: 5, institutionId: 1, stockTicker: 'NVDA', stockName: '英伟达', sector: '科技', shares: 3500000, marketValue: 4550000000, ownershipPercent: 0.9, market: 'US', quarter: '2025Q4', changeShares: 500000, changePercent: 16.7 },
  // Bridgewater
  { id: 6, institutionId: 2, stockTicker: 'AAPL', stockName: '苹果', sector: '科技', shares: 120000000, marketValue: 25200000000, ownershipPercent: 7.8, market: 'US', quarter: '2025Q4', changeShares: -10000000, changePercent: -7.7 },
  { id: 7, institutionId: 2, stockTicker: 'BRK.B', stockName: '伯克希尔B', sector: '金融', shares: 45000000, marketValue: 18900000000, ownershipPercent: 4.2, market: 'US', quarter: '2025Q4', changeShares: 2000000, changePercent: 4.7 },
  { id: 8, institutionId: 2, stockTicker: 'JNJ', stockName: '强生', sector: '医疗', shares: 28000000, marketValue: 3920000000, ownershipPercent: 2.1, market: 'US', quarter: '2025Q4', changeShares: -3000000, changePercent: -9.7 },
  { id: 9, institutionId: 2, stockTicker: 'KO', stockName: '可口可乐', sector: '消费', shares: 55000000, marketValue: 3300000000, ownershipPercent: 3.5, market: 'US', quarter: '2025Q4', changeShares: 0, changePercent: 0 },
  { id: 10, institutionId: 2, stockTicker: 'XOM', stockName: '埃克森美孚', sector: '能源', shares: 38000000, marketValue: 3800000000, ownershipPercent: 2.8, market: 'US', quarter: '2025Q4', changeShares: 4000000, changePercent: 11.8 },
  // Goldman Sachs
  { id: 11, institutionId: 3, stockTicker: 'AAPL', stockName: '苹果', sector: '科技', shares: 85000000, marketValue: 17850000000, ownershipPercent: 5.5, market: 'US', quarter: '2025Q4', changeShares: 12000000, changePercent: 16.4 },
  { id: 12, institutionId: 3, stockTicker: 'MSFT', stockName: '微软', sector: '科技', shares: 48000000, marketValue: 20160000000, ownershipPercent: 4.6, market: 'US', quarter: '2025Q4', changeShares: 6000000, changePercent: 14.3 },
  { id: 13, institutionId: 3, stockTicker: 'GS', stockName: '高盛', sector: '金融', shares: 22000000, marketValue: 9680000000, ownershipPercent: 8.9, market: 'US', quarter: '2025Q4', changeShares: -1500000, changePercent: -6.4 },
  { id: 14, institutionId: 3, stockTicker: 'META', stockName: 'Meta', sector: '科技', shares: 35000000, marketValue: 19950000000, ownershipPercent: 3.9, market: 'US', quarter: '2025Q4', changeShares: 7000000, changePercent: 25.0 },
  { id: 15, institutionId: 3, stockTicker: 'TSLA', stockName: '特斯拉', sector: '新能源', shares: 18000000, marketValue: 7200000000, ownershipPercent: 2.1, market: 'US', quarter: '2025Q4', changeShares: -5000000, changePercent: -21.7 },
  // JPMorgan
  { id: 16, institutionId: 4, stockTicker: 'AAPL', stockName: '苹果', sector: '科技', shares: 95000000, marketValue: 19950000000, ownershipPercent: 6.2, market: 'US', quarter: '2025Q4', changeShares: 5000000, changePercent: 5.6 },
  { id: 17, institutionId: 4, stockTicker: 'JPM', stockName: '摩根大通', sector: '金融', shares: 350000000, marketValue: 80500000000, ownershipPercent: 12.4, market: 'US', quarter: '2025Q4', changeShares: 15000000, changePercent: 4.5 },
  { id: 18, institutionId: 4, stockTicker: 'V', stockName: 'Visa', sector: '金融', shares: 42000000, marketValue: 14700000000, ownershipPercent: 3.8, market: 'US', quarter: '2025Q4', changeShares: 3000000, changePercent: 7.7 },
  { id: 19, institutionId: 4, stockTicker: 'UNH', stockName: '联合健康', sector: '医疗', shares: 12000000, marketValue: 5400000000, ownershipPercent: 2.1, market: 'US', quarter: '2025Q4', changeShares: -2000000, changePercent: -14.3 },
  { id: 20, institutionId: 4, stockTicker: 'NVDA', stockName: '英伟达', sector: '科技', shares: 25000000, marketValue: 32500000000, ownershipPercent: 3.4, market: 'US', quarter: '2025Q4', changeShares: 8000000, changePercent: 47.1 },
  // BlackRock
  { id: 21, institutionId: 5, stockTicker: 'AAPL', stockName: '苹果', sector: '科技', shares: 320000000, marketValue: 67200000000, ownershipPercent: 20.8, market: 'US', quarter: '2025Q4', changeShares: 25000000, changePercent: 8.5 },
  { id: 22, institutionId: 5, stockTicker: 'MSFT', stockName: '微软', sector: '科技', shares: 280000000, marketValue: 117600000000, ownershipPercent: 26.9, market: 'US', quarter: '2025Q4', changeShares: 18000000, changePercent: 6.9 },
  { id: 23, institutionId: 5, stockTicker: 'NVDA', stockName: '英伟达', sector: '科技', shares: 180000000, marketValue: 234000000000, ownershipPercent: 24.5, market: 'US', quarter: '2025Q4', changeShares: 30000000, changePercent: 20.0 },
  { id: 24, institutionId: 5, stockTicker: 'AMZN', stockName: '亚马逊', sector: '消费', shares: 210000000, marketValue: 44100000000, ownershipPercent: 29.7, market: 'US', quarter: '2025Q4', changeShares: 15000000, changePercent: 7.7 },
  { id: 25, institutionId: 5, stockTicker: 'GOOGL', stockName: '谷歌', sector: '科技', shares: 155000000, marketValue: 27900000000, ownershipPercent: 18.6, market: 'US', quarter: '2025Q4', changeShares: 10000000, changePercent: 6.9 },
  // Fidelity
  { id: 26, institutionId: 6, stockTicker: 'AAPL', stockName: '苹果', sector: '科技', shares: 280000000, marketValue: 58800000000, ownershipPercent: 18.2, market: 'US', quarter: '2025Q4', changeShares: 20000000, changePercent: 7.7 },
  { id: 27, institutionId: 6, stockTicker: 'NVDA', stockName: '英伟达', sector: '科技', shares: 120000000, marketValue: 156000000000, ownershipPercent: 16.3, market: 'US', quarter: '2025Q4', changeShares: 22000000, changePercent: 22.4 },
  { id: 28, institutionId: 6, stockTicker: 'TSLA', stockName: '特斯拉', sector: '新能源', shares: 95000000, marketValue: 38000000000, ownershipPercent: 11.1, market: 'US', quarter: '2025Q4', changeShares: 18000000, changePercent: 23.4 },
  { id: 29, institutionId: 6, stockTicker: 'META', stockName: 'Meta', sector: '科技', shares: 88000000, marketValue: 50200000000, ownershipPercent: 9.8, market: 'US', quarter: '2025Q4', changeShares: 5000000, changePercent: 6.0 },
  { id: 30, institutionId: 6, stockTicker: 'AMZN', stockName: '亚马逊', sector: '消费', shares: 145000000, marketValue: 30450000000, ownershipPercent: 20.5, market: 'US', quarter: '2025Q4', changeShares: 10000000, changePercent: 7.4 },
  // Neuberger Berman
  { id: 31, institutionId: 7, stockTicker: 'MSFT', stockName: '微软', sector: '科技', shares: 18000000, marketValue: 7560000000, ownershipPercent: 1.7, market: 'US', quarter: '2025Q4', changeShares: 2500000, changePercent: 16.1 },
  { id: 32, institutionId: 7, stockTicker: 'AAPL', stockName: '苹果', sector: '科技', shares: 22000000, marketValue: 4620000000, ownershipPercent: 1.4, market: 'US', quarter: '2025Q4', changeShares: -1000000, changePercent: -4.3 },
  { id: 33, institutionId: 7, stockTicker: 'V', stockName: 'Visa', sector: '金融', shares: 12000000, marketValue: 4200000000, ownershipPercent: 1.1, market: 'US', quarter: '2025Q4', changeShares: 1500000, changePercent: 14.3 },
  // AllianceBernstein
  { id: 34, institutionId: 8, stockTicker: 'JPM', stockName: '摩根大通', sector: '金融', shares: 25000000, marketValue: 5750000000, ownershipPercent: 0.9, market: 'US', quarter: '2025Q4', changeShares: 2000000, changePercent: 8.7 },
  { id: 35, institutionId: 8, stockTicker: 'JNJ', stockName: '强生', sector: '医疗', shares: 18000000, marketValue: 2520000000, ownershipPercent: 1.4, market: 'US', quarter: '2025Q4', changeShares: -1000000, changePercent: -5.3 },
  // ADIA
  { id: 36, institutionId: 9, stockTicker: 'AAPL', stockName: '苹果', sector: '科技', shares: 180000000, marketValue: 37800000000, ownershipPercent: 11.7, market: 'US', quarter: '2025Q4', changeShares: 15000000, changePercent: 9.1 },
  { id: 37, institutionId: 9, stockTicker: 'MSFT', stockName: '微软', sector: '科技', shares: 140000000, marketValue: 58800000000, ownershipPercent: 13.5, market: 'US', quarter: '2025Q4', changeShares: 10000000, changePercent: 7.7 },
  { id: 38, institutionId: 9, stockTicker: 'NVDA', stockName: '英伟达', sector: '科技', shares: 95000000, marketValue: 123500000000, ownershipPercent: 12.9, market: 'US', quarter: '2025Q4', changeShares: 20000000, changePercent: 26.7 },
  { id: 39, institutionId: 9, stockTicker: 'XOM', stockName: '埃克森美孚', sector: '能源', shares: 120000000, marketValue: 12000000000, ownershipPercent: 4.5, market: 'US', quarter: '2025Q4', changeShares: -5000000, changePercent: -4.0 },
  { id: 40, institutionId: 9, stockTicker: 'PFE', stockName: '辉瑞', sector: '医疗', shares: 250000000, marketValue: 6500000000, ownershipPercent: 6.2, market: 'US', quarter: '2025Q4', changeShares: 30000000, changePercent: 13.6 },
  // KIA
  { id: 41, institutionId: 10, stockTicker: 'AAPL', stockName: '苹果', sector: '科技', shares: 150000000, marketValue: 31500000000, ownershipPercent: 9.7, market: 'US', quarter: '2025Q4', changeShares: 12000000, changePercent: 8.7 },
  { id: 42, institutionId: 10, stockTicker: 'MSFT', stockName: '微软', sector: '科技', shares: 110000000, marketValue: 46200000000, ownershipPercent: 10.6, market: 'US', quarter: '2025Q4', changeShares: 8000000, changePercent: 7.8 },
  { id: 43, institutionId: 10, stockTicker: 'GOOGL', stockName: '谷歌', sector: '科技', shares: 95000000, marketValue: 17100000000, ownershipPercent: 11.4, market: 'US', quarter: '2025Q4', changeShares: 6000000, changePercent: 6.7 },
  { id: 44, institutionId: 10, stockTicker: 'BRK.B', stockName: '伯克希尔B', sector: '金融', shares: 60000000, marketValue: 25200000000, ownershipPercent: 5.6, market: 'US', quarter: '2025Q4', changeShares: 3000000, changePercent: 5.3 },
  { id: 45, institutionId: 10, stockTicker: 'KO', stockName: '可口可乐', sector: '消费', shares: 180000000, marketValue: 10800000000, ownershipPercent: 11.4, market: 'US', quarter: '2025Q4', changeShares: 0, changePercent: 0 },
  // Morgan Stanley
  { id: 46, institutionId: 11, stockTicker: 'AAPL', stockName: '苹果', sector: '科技', shares: 70000000, marketValue: 14700000000, ownershipPercent: 4.5, market: 'US', quarter: '2025Q4', changeShares: 5000000, changePercent: 7.7 },
  { id: 47, institutionId: 11, stockTicker: 'MSFT', stockName: '微软', sector: '科技', shares: 45000000, marketValue: 18900000000, ownershipPercent: 4.3, market: 'US', quarter: '2025Q4', changeShares: 3000000, changePercent: 7.2 },
  { id: 48, institutionId: 11, stockTicker: 'AMZN', stockName: '亚马逊', sector: '消费', shares: 22000000, marketValue: 4620000000, ownershipPercent: 3.1, market: 'US', quarter: '2025Q4', changeShares: 1500000, changePercent: 7.3 },
  { id: 49, institutionId: 11, stockTicker: 'GS', stockName: '高盛', sector: '金融', shares: 15000000, marketValue: 6600000000, ownershipPercent: 6.1, market: 'US', quarter: '2025Q4', changeShares: 1000000, changePercent: 7.1 },
  { id: 50, institutionId: 11, stockTicker: 'BAC', stockName: '美国银行', sector: '金融', shares: 65000000, marketValue: 2600000000, ownershipPercent: 5.2, market: 'US', quarter: '2025Q4', changeShares: 3000000, changePercent: 4.9 },
  { id: 51, institutionId: 11, stockTicker: 'BLK', stockName: '贝莱德', sector: '金融', shares: 4500000, marketValue: 4725000000, ownershipPercent: 3.8, market: 'US', quarter: '2025Q4', changeShares: 500000, changePercent: 12.5 },
  { id: 52, institutionId: 11, stockTicker: 'META', stockName: 'Meta', sector: '科技', shares: 12000000, marketValue: 6840000000, ownershipPercent: 1.3, market: 'US', quarter: '2025Q4', changeShares: -1000000, changePercent: -7.7 },
  { id: 53, institutionId: 11, stockTicker: 'GOOGL', stockName: '谷歌', sector: '科技', shares: 28000000, marketValue: 5040000000, ownershipPercent: 3.4, market: 'US', quarter: '2025Q4', changeShares: 1500000, changePercent: 5.7 },
  { id: 54, institutionId: 11, stockTicker: 'SPY', stockName: '标普500ETF', sector: 'ETF', shares: 15000000, marketValue: 8100000000, ownershipPercent: 0.8, market: 'US', quarter: '2025Q4', changeShares: 2000000, changePercent: 3.2 },
  { id: 55, institutionId: 11, stockTicker: 'QQQ', stockName: '纳指100ETF', sector: 'ETF', shares: 8000000, marketValue: 3280000000, ownershipPercent: 0.6, market: 'US', quarter: '2025Q4', changeShares: 500000, changePercent: 4.8 },
  { id: 56, institutionId: 11, stockTicker: 'PFE', stockName: '辉瑞', sector: '医疗', shares: 35000000, marketValue: 910000000, ownershipPercent: 4.1, market: 'US', quarter: '2025Q4', changeShares: 1000000, changePercent: 2.9 },
  { id: 57, institutionId: 11, stockTicker: 'JPM', stockName: '摩根大通', sector: '金融', shares: 22000000, marketValue: 5060000000, ownershipPercent: 1.8, market: 'US', quarter: '2025Q4', changeShares: 1000000, changePercent: 4.8 },
];

export const alertRules: AlertRule[] = [
  { id: 1, stockTicker: 'NVDA', stockName: '英伟达', institutionIds: 'all', thresholdPercent: 20, notifyEmail: true, notifyFeishu: true, isActive: true, createdAt: '2025-10-01' },
  { id: 2, stockTicker: 'AAPL', stockName: '苹果', institutionIds: [1, 5, 9], thresholdPercent: 15, notifyEmail: false, notifyFeishu: true, isActive: true, createdAt: '2025-10-05' },
  { id: 3, stockTicker: 'TSLA', stockName: '特斯拉', institutionIds: 'all', thresholdPercent: 25, notifyEmail: true, notifyFeishu: false, isActive: false, createdAt: '2025-09-20' },
  { id: 4, stockTicker: 'MSFT', stockName: '微软', institutionIds: [5, 6], thresholdPercent: 10, notifyEmail: true, notifyFeishu: true, isActive: true, createdAt: '2025-11-01' },
];

export const holdingChanges: HoldingChange[] = [
  { id: 1, institutionId: 10, stockTicker: 'NVDA', stockName: '英伟达', changeType: 'increase', changePercent: 38.5, previousShares: 68000000, currentShares: 95000000, quarter: '2025Q4' },
  { id: 2, institutionId: 9, stockTicker: 'NVDA', stockName: '英伟达', changeType: 'increase', changePercent: 26.7, previousShares: 75000000, currentShares: 95000000, quarter: '2025Q4' },
  { id: 3, institutionId: 6, stockTicker: 'NVDA', stockName: '英伟达', changeType: 'increase', changePercent: 22.4, previousShares: 98000000, currentShares: 120000000, quarter: '2025Q4' },
  { id: 4, institutionId: 6, stockTicker: 'TSLA', stockName: '特斯拉', changeType: 'increase', changePercent: 23.4, previousShares: 77000000, currentShares: 95000000, quarter: '2025Q4' },
  { id: 5, institutionId: 3, stockTicker: 'META', stockName: 'Meta', changeType: 'increase', changePercent: 25.0, previousShares: 28000000, currentShares: 35000000, quarter: '2025Q4' },
  { id: 6, institutionId: 5, stockTicker: 'NVDA', stockName: '英伟达', changeType: 'increase', changePercent: 20.0, previousShares: 150000000, currentShares: 180000000, quarter: '2025Q4' },
  { id: 7, institutionId: 3, stockTicker: 'TSLA', stockName: '特斯拉', changeType: 'decrease', changePercent: -21.7, previousShares: 23000000, currentShares: 18000000, quarter: '2025Q4' },
  { id: 8, institutionId: 1, stockTicker: 'GOOGL', stockName: '谷歌', changeType: 'decrease', changePercent: -11.8, previousShares: 17000000, currentShares: 15000000, quarter: '2025Q4' },
  { id: 9, institutionId: 2, stockTicker: 'JNJ', stockName: '强生', changeType: 'decrease', changePercent: -9.7, previousShares: 31000000, currentShares: 28000000, quarter: '2025Q4' },
  { id: 10, institutionId: 3, stockTicker: 'GS', stockName: '高盛', changeType: 'decrease', changePercent: -6.4, previousShares: 23500000, currentShares: 22000000, quarter: '2025Q4' },
  { id: 11, institutionId: 7, stockTicker: 'MSFT', stockName: '微软', changeType: 'new', changePercent: 100, previousShares: 0, currentShares: 18000000, quarter: '2025Q4' },
  { id: 12, institutionId: 1, stockTicker: 'NVDA', stockName: '英伟达', changeType: 'increase', changePercent: 16.7, previousShares: 3000000, currentShares: 3500000, quarter: '2025Q4' },
  { id: 13, institutionId: 4, stockTicker: 'NVDA', stockName: '英伟达', changeType: 'increase', changePercent: 47.1, previousShares: 17000000, currentShares: 25000000, quarter: '2025Q4' },
  { id: 14, institutionId: 4, stockTicker: 'UNH', stockName: '联合健康', changeType: 'decrease', changePercent: -14.3, previousShares: 14000000, currentShares: 12000000, quarter: '2025Q4' },
  { id: 15, institutionId: 8, stockTicker: 'JPM', stockName: '摩根大通', changeType: 'increase', changePercent: 8.7, previousShares: 23000000, currentShares: 25000000, quarter: '2025Q4' },
  { id: 16, institutionId: 11, stockTicker: 'MSFT', stockName: '微软', changeType: 'increase', changePercent: 7.2, previousShares: 42000000, currentShares: 45000000, quarter: '2025Q4' },
  { id: 17, institutionId: 11, stockTicker: 'BLK', stockName: '贝莱德', changeType: 'increase', changePercent: 12.5, previousShares: 4000000, currentShares: 4500000, quarter: '2025Q4' },
  { id: 18, institutionId: 11, stockTicker: 'META', stockName: 'Meta', changeType: 'decrease', changePercent: -7.7, previousShares: 13000000, currentShares: 12000000, quarter: '2025Q4' },
];

export function formatNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n}`;
}

export function formatShares(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n}`;
}

export function formatPercent(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

export const typeLabels: Record<string, string> = {
  hedge: '对冲基金',
  sovereign: '主权基金',
  asset_manager: '资产管理',
  bank: '银行',
};

export const typeColors: Record<string, string> = {
  hedge: '#f59e0b',
  sovereign: '#22c55e',
  asset_manager: '#38bdf8',
  bank: '#a78bfa',
};
