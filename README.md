# 🛡️ 聪明钱去了哪儿 — Smart Money Tracker

> 追踪全球顶级主权基金与对冲机构的真实持仓，让散户也能跟踪"聪明钱"的流向

**线上地址：** https://lkr23leyg4y0.space.minimaxi.com

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Recharts](https://img.shields.io/badge/Recharts-2.15-FF6384)](https://recharts.org)

---

## ✨ 核心功能

### 1. 📊 机构持仓总览
- 覆盖 **12家全球顶级投资机构**（TCI、桥水、高盛、摩根大通、贝莱德、富达、路博迈、联博、ADIA、科威特投资局、摩根士丹利）
- 支持按机构类型（对冲基金/主权基金/资产管理/银行）、市场（美股/港股/A股）筛选
- 季度持仓市值 + 持股占比 + 机构类型标签

### 2. 📈 持仓变化分析
- **增持/减持排行榜**：按季度变化率排名，支持市场过滤
- **机构重合度分析**：哪些机构同时持有同一只股票
- **板块热力图**：按持仓占比渲染板块分布

### 3. 🔍 持仓搜索
- 输入股票代码/名称，快速找出持有该股票的所有机构
- 显示机构类型、持股数、持仓市值、占总股本比例、季度变化

### 4. 📋 持仓异动追踪
- 季度持仓变化记录：新增/增持/减持/退出
- 按机构、股票类型、时间筛选

### 5. 📡 AI 产业链追踪
- 5大AI产业层：芯片/云基础设施/应用层/终端机器人/中国AI
- 每层显示机构持仓市值合计与关键股票

### 6. 🏢 小盘股建仓监测
- 监测机构新建仓/加仓的小盘股信号
- 展示机构持仓明细与季度变化

### 7. 💼 Kevin 个人持仓追踪
- 真实持仓（小米集团 39.1%、安克创新 24.6%、腾讯控股 13.0%、美团 11.6%、泡泡玛特 11.6%、现金 4%）
- 实时行情价格（Yahoo Finance）+ 今日涨跌
- 仓位权重可视化（占总资金60万）

### 8. 🔔 预警规则
- 可视化配置股票异动预警（阈值设定）
- 预警历史记录

### 9. ⚙️ 数据源管理
- 展示各数据源状态（SEC EDGAR / HKEX / 东方财富QFII / Tushare沪深港通）
- 一键刷新最新数据

---

## 🏗️ 技术架构

```
Frontend (SPA — 单页应用)
  React 19 + TypeScript + Vite + TailwindCSS + Recharts
  路由：11个Tab页面（总览/机构/搜索/变化/预警/AI链/小盘股/我的持仓/数据源/设置）
  行情：Yahoo Finance 实时API（免费，无需Key）

Backend (Node.js API Server)
  Express.js + Python Scraper
  数据源：SEC EDGAR 13F · HKEX 披露易 · 东方财富QFII · Tushare沪深港通

部署
  Vercel (Frontend) + GitHub Actions Cron
```

---

## 🚀 快速开始

### 前置依赖
- Node.js ≥ 18
- Bun 或 npm

### 安装
```bash
git clone https://github.com/Roloria/where-smart-money-go.git
cd where-smart-money-go

# 安装依赖
bun install   # 或 npm install

# 启动开发服务器
bun run dev   # 或 npm run dev

# 构建生产版本
bun run build

# 启动后端API服务器（可选）
node server/index.js
```

访问 `http://localhost:5173`

---

## 📡 覆盖机构

| 机构 | 类型 | 国家 | 覆盖市场 |
|------|------|------|---------|
| TCI Fund | 对冲基金 | 🇬🇧 英国 | 美股 |
| Bridgewater | 对冲基金 | 🇺🇸 美国 | 美股 |
| Goldman Sachs | 投资银行 | 🇺🇸 美国 | 美股 |
| JPMorgan Chase | 银行/资管 | 🇺🇸 美国 | 美股 |
| BlackRock | 资产管理 | 🇺🇸 美国 | 美股 |
| Fidelity Investments | 资产管理 | 🇺🇸 美国 | 美股 |
| Neuberger Berman | 资产管理 | 🇺🇸 美国 | 美股 |
| AllianceBernstein | 资产管理 | 🇺🇸 美国 | 美股 |
| Abu Dhabi IA | 主权基金 | 🇦🇪 阿联酋 | 美股/港股/A股 |
| Kuwait IA | 主权基金 | 🇰🇼 科威特 | 美股/港股/A股 |
| Morgan Stanley | 投资银行 | 🇺🇸 美国 | 美股 |
| 乖宝宠物 | A股外资 | 🇨🇳 中国 | A股 |

---

## 📂 项目结构

```
smart-money-tracker/
├── src/
│   ├── components/         # 可复用UI组件
│   │   ├── AppLayout.tsx        # 侧边导航布局
│   │   ├── InstitutionRankings.tsx  # 机构排行榜
│   │   ├── InstitutionOverlap.tsx   # 机构重合度
│   │   ├── SectorHeatmap.tsx    # 板块热力图
│   │   ├── DataSourcePanel.tsx  # 数据源管理面板
│   │   └── KevinPortfolio.tsx   # Kevin个人持仓
│   ├── pages/              # 页面组件
│   │   ├── SmartMoney.tsx       # 主页面（所有Tab内容）
│   │   ├── AIChainPage.tsx      # AI产业链详情
│   │   ├── AIChainPanel.tsx     # AI产业链面板
│   │   ├── AIFlowPage.tsx       # AI资金流向
│   │   ├── InstitutionDetailPage.tsx  # 机构详情
│   │   ├── SmallCapPage.tsx     # 小盘股监测
│   │   ├── Changes.tsx           # 持仓变化
│   │   ├── Search.tsx           # 持仓搜索
│   │   ├── AlertRules.tsx       # 预警规则
│   │   └── Settings.tsx         # 设置
│   ├── data/                # 数据层
│   │   ├── mockData.ts          # 模拟数据（美股机构）
│   │   ├── realData.ts          # 真实数据（港股/A股机构）
│   │   ├── aiChain.ts           # AI产业链数据
│   │   └── hkexFetcher.ts       # HKEX数据抓取器
│   ├── lib/
│   │   ├── stockPrices.ts       # Yahoo Finance行情API
│   │   └── utils.ts             # 工具函数
│   └── types/
│       └── index.ts             # TypeScript类型定义
├── server/                  # Node.js API服务器
│   └── index.js              # 路由：/api/sources · /api/refresh/:id
├── scripts/                 # Python数据抓取脚本
│   ├── sec_13f_scraper.py   # SEC EDGAR 13F 爬虫
│   ├── hkex_scraper.py      # HKEX 披露易爬虫
│   ├── eastmoney_scraper.py # 东方财富QFII爬虫
│   └── merge_data.py        # 数据合并脚本
└── dist/                    # 生产构建输出
```

---

## 🔜 路线图

- [x] MVP 仪表盘 + 持仓列表
- [x] 机构筛选 + 搜索
- [x] 季度变化可视化图表
- [x] 增持/减持排行榜
- [x] 板块热力图
- [x] 机构重合度分析
- [x] 预警规则配置（前端）
- [x] Kevin 个人持仓追踪（实时行情）
- [x] AI 产业链追踪（5大层）
- [x] 小盘股建仓监测
- [x] 数据源管理面板
- [x] SEC EDGAR 13F Scraper（Python）
- [x] HKEX 数据爬虫（含mock fallback）
- [x] 东方财富 QFII 爬虫
- [x] A股持仓数据（东方财富 + Tushare）
- [ ] 飞书/Email 预警通知（后端对接）
- [ ] 持仓历史趋势图
- [ ] 机构持仓历史走势
- [x] 移动端适配
- [ ] 公开分享链接

---

## 📄 License

MIT License
