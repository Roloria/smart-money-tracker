# 🛡️ 聪明钱去了哪儿 — Smart Money Tracker

> 追踪全球顶级主权基金与对冲机构的真实持仓，让散户也能跟踪"聪明钱"的流向

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Recharts](https://img.shields.io/badge/Recharts-2.15-FF6384)](https://recharts.org)

---

## ✨ 核心功能

### 1. 📊 机构持仓总览
- 覆盖 **10家全球顶级投资机构**（TCI、桥水、高盛、摩根大通、贝莱德、富达、路博迈、联博、ADIA、科威特投资局）
- 支持按机构、市场、股票搜索过滤
- 季度持仓市值 + 持股占比 + 季度环比变化

### 2. 📈 持仓变化分析
- **增持/减持排行**：柱状图可视化季度大幅变动
- **市场分布**：饼图展示美股/港股/A股配置比例
- **机构对比**：跨机构持仓交叉对比

### 3. 🔔 预警系统
- 可配置预警规则（设置每只股票的变动阈值）
- 支持 **飞书 Webhook / Email** 通知
- 预警历史记录追踪

### 4. 📋 持仓明细表
- 支持按市值 / 变化率 / 持股数量排序
- 高亮显示季度增持/减持信号
- 机构交叉引用（查看哪些机构同时持有）

---

## 🏗️ 技术架构

```
Frontend (SPA)
  React 18 + TypeScript + Vite + TailwindCSS + Recharts

Backend (待接入)
  Hono.js API
  SEC EDGAR 13F Scraper (Python)
  PostgreSQL / Turso

部署
  Vercel (Frontend)
  GitHub Actions Cron (Scraper)
```

---

## 🚀 快速开始

### 前置依赖
- Node.js ≥ 18
- Bun 或 npm

### 安装
```bash
git clone https://github.com/YOUR_USERNAME/where-smart-money-go.git
cd where-smart-money-go

# 安装依赖
bun install   # 或 npm install

# 启动开发服务器
bun run dev   # 或 npm run dev

# 构建生产版本
bun run build
```

访问 `http://localhost:5173`

---

## 📡 覆盖机构（第一期）

| 机构 | 类型 | 披露频率 |
|------|------|---------|
| TCI Fund Management | 对冲基金 | 季度 13F |
| Bridgewater Associates | 对冲基金 | 季度 13F |
| Goldman Sachs | 投资银行 | 季度 13F |
| JPMorgan Chase | 银行/资管 | 季度 13F |
| BlackRock | 资产管理 | 季度 13F |
| Fidelity Investments | 资产管理 | 季度 13F |
| Neuberger Berman | 资产管理 | 季度 13F |
| AllianceBernstein | 资产管理 | 季度 13F |
| Abu Dhabi Investment Authority | 主权基金 | 季度 13F |
| Kuwait Investment Authority | 主权基金 | 季度 13F |

---

## 🔜 路线图

- [x] MVP 仪表盘 + 持仓列表
- [x] 机构筛选 + 搜索
- [x] 预警配置（前端）
- [x] 季度变化可视化图表
- [ ] SEC EDGAR 13F Scraper（后端）
- [ ] 港股持仓数据接入（HKEX）
- [ ] A股持仓数据接入（akshare）
- [ ] 飞书 + Email 预警通知
- [ ] 持仓对比工具
- [ ] 机构持仓历史趋势图
- [ ] 移动端适配
- [ ] 公开分享链接

---

## 📄 License

MIT License
