# 🛡️ 聪明钱去了哪儿 — Smart Money Tracker

> 追踪全球顶级主权基金与对冲机构的真实持仓，让散户也能跟踪"聪明钱"的流向

**线上地址：** https://e4z7bny76afs.space.minimaxi.com（v20+ · Phase 8 · Dashboard动态时间戳）

> v22 新增：**💡 AI 持仓诊断** — 规则引擎分析 Kevin 个人持仓，对比机构平均配置，输出超配/低配信号 + 集中度风险 + 3条文字建议 + 纯 CSS 板块对比图

> v21 新增：**📲 飞书预警推送** — 保存预警规则自动触发飞书 Card 通知，绿/红/黄配色标识增持/减持/新建仓信号

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

### 7. 💰 AI 资金流向预测
- 规则引擎（非 AI API）分析机构季度持仓变化，自动计算个股与板块信号
- 信号类型：强势买入 / 买入 / 新建仓 / 观望 / 减仓 / 清仓警示
- 板块资金流向图：Top 流入板块 & Top 流出板块
- 个股信号列表（颜色标签 + 机构数量 + 平均变化幅度）
- 纯 div 条形图实现，无额外图表依赖

### 8. 💼 Kevin 个人持仓追踪 + 💡 AI 持仓诊断（v22 新增）
- 真实持仓（小米集团 39.1%、安克创新 24.6%、腾讯控股 13.0%、美团 11.6%、泡泡玛特 11.6%、现金 4%）
- 实时行情价格（Yahoo Finance）+ 今日涨跌
- 仓位权重可视化（占总资金60万）
- **AI 持仓诊断（v22 新增）** — 规则引擎（非 AI API）诊断功能：
  - **板块超配/低配分析**：Kevin 持仓 vs 机构平均配置对比，超配 > 2倍显示「⚠️ 超配」，< 50% 显示「📉 低配」，否则「✅ 正常」
  - **集中度风险**：单只股票占总仓位 > 40% 触发红色警告
  - **AI 建议**：根据诊断结果输出 2-3 条 if/else 规则文字建议（高/中/低优先级）
  - **纯 CSS 板块对比条形图**：金色（Kevin）vs 灰色（机构平均）横向条形图，无 recharts 依赖

### 9. 🔔 预警规则
- 可视化配置股票异动预警（阈值设定）
- 预警历史记录

### 10. 📲 飞书预警推送（v21 新增）
- 后端 `/api/alert-test` — 发送测试消息验证 Webhook 连通性
- 后端 `/api/alert-trigger` — 保存规则时自动触发飞书推送（仅异动时）
- 飞书 Card 消息格式：绿（增持）/ 红（减持）/ 黄（新建仓）配色
- 显示字段：股票代码、名称、变化幅度、机构名称、季度、触发阈值

### 11. ⚙️ 数据源管理
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
  预警推送：飞书 Webhook Card 消息

部署
  托管平台（Frontend） + GitHub Actions Cron
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
│   ├── index.js              # 路由：/api/sources · /api/refresh/:id · /api/alert-test · /api/alert-trigger
│   └── alertPush.js          # v21: 飞书预警推送模块
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
- [x] 飞书预警推送（v21 新增）
- [x] Kevin 个人持仓追踪（实时行情）
- [x] AI 产业链追踪（5大层）
- [x] 小盘股建仓监测
- [x] 数据源管理面板
- [x] SEC EDGAR 13F Scraper（Python）
- [x] HKEX 数据爬虫（含mock fallback）
- [x] 东方财富 QFII 爬虫
- [x] A股持仓数据（东方财富 + Tushare）
- [ ] Email 邮件预警通知
- [ ] 持仓历史趋势图
- [ ] 机构持仓历史走势
- [x] 移动端适配
- [ ] 公开分享链接

---

## 📄 License

MIT License
