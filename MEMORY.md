# MEMORY.md — Smart Money Tracker

> Last Updated: 2026-04-21 · v22

---

## 版本历史

### v22 — 2026-04-21
**新增：💡 AI 持仓诊断面板（KevinPortfolio Tab）**

- KevinPortfolio.tsx 重构，新增 `AIDiagnosisPanel()` 组件
- 新增诊断引擎 `runDiagnosis()` — 规则引擎，无需 AI API：
  - 按 sector 聚合机构平均配置（来自 mockData holdings marketValue）
  - 对比 Kevin 各板块配置，判定超配 / 低配 / 正常
  - 规则：Kevin > 2× 机构平均 → 超配；< 50% → 低配；否则正常
  - 检测单票持仓 > 40% 触发集中度红色警告
  - if/else 规则生成 2-3 条文字建议（高/中/低优先级）
- 纯 CSS 板块对比条形图（金色=Kevin，灰色=机构平均），无 recharts 依赖
- 深色卡片 + 金色/绿/红标签配色，跟现有风格一致
- Kevin 板块映射：AI硬件/新能源→科技，消费电子/出海→消费，互联网/AI→科技，本地生活/外卖→消费，消费/潮玩→消费

**线上地址：** https://syuapwa03v96.space.minimaxi.com

---

### v21 — 2026-04-21
**新增：飞书机构持仓异动预警推送**

- 新增模块：`server/alertPush.js` — 飞书 Webhook 推送核心
  - `sendAlertMessage(alertData)` — 发送飞书 Card 消息
  - `sendTestMessage()` — 发送测试消息
- 新增后端路由：
  - `GET /api/alert-test` → 发送测试消息验证 Webhook
  - `POST /api/alert-trigger` → 保存规则时触发飞书推送（仅异动时）
- AlertRules.tsx 更新：
  - 保存规则时调用 `/api/alert-trigger` 自动触发推送
  - 通知日志显示推送结果
- 飞书 Card 消息设计：
  - 标题：「🚨 聪明钱异动预警」
  - 配色：绿色（增持 📈）/ 红色（减持 📉）/ 黄色（新建仓 🆕）
  - 显示字段：股票代码、名称、变化幅度、机构名称、季度、触发阈值
  - CTA 按钮：查看详情 / 预警规则

**线上地址：** https://05ky8spkgrde.space.minimaxi.com

---

### v20 — 2026-04-21
**新增：AI 资金流向预测功能**

- 新增页面：`/pages/AIFundFlowPage.tsx` — AI资金流向分析页
- 新增组件：`/components/AIFundFlow.tsx` — 核心信号计算与渲染组件
- 规则引擎信号系统（无需 AI API）：
  - `strong_buy`: changePercent > 10% → 强势买入 🟢
  - `buy`: 5% < changePercent ≤ 10% → 买入 🟢
  - `new_position`: changeType === 'new' → 关注新建 🔵
  - `hold`: -5% ≤ changePercent ≤ 5% → 观望 ⚪
  - `reduce`: -10% < changePercent < -5% → 减仓 🟠
  - `strong_sell`: changePercent < -10% 或 changeType === 'exited' → 清仓警示 🔴
- 板块资金流向聚合：按 sector 分组计算平均 changePercent
- Top 资金流入/流出板块排名（div 条形图，纯 CSS）
- 个股信号表：30 条，按变化幅度降序
- 导航入口：顶部 Tab「💰 AI资金流向」
- 技术：无新增依赖，不影响首屏 88KB bundle size

**线上地址：** https://tw7p2onewrh3.space.minimaxi.com（v20）

---

### v19 — 2026-04-16
**recharts lazy-loading 完成，首屏仅 88KB**

- `MarketPie` / `ChangesBar` 组件改为 `useEffect + import('recharts')` 动态加载
- 首屏 JS bundle 降至 88KB（recharts 延迟到交互时加载）

---

### v18 — 2026-04-10
**小盘股建仓监测**

- 新增 `SMALL_CAP_TRACKED` 数据（5只小盘股）
- 新增 `SmallCapPage.tsx` — 小盘股信号面板
- `isNewPosition` / `instAccumulating` / `momentumScore` 字段

---

### v17 — 2026-04-05
**AI 产业链追踪 v2**

- `AI_LAYERS` 从 3 层扩展到 5 层（芯片/云/应用/机器人/中国AI）
- `AIChainPanel.tsx` 改用 `getLayerStatsFromHoldings()` 从真实持仓聚合数据
- 移除 mock 板块数据，改用真实机构持仓统计

---

## 关键文件路径

```
src/
  pages/
    SmartMoney.tsx         # 主页面（所有 Tab 内容）
    AIFundFlowPage.tsx     # v20: AI资金流向页面
    AIChainPanel.tsx       # AI产业链面板
    SmallCapPage.tsx       # 小盘股监测
    AlertRules.tsx         # v21: 预警规则（含飞书推送）
  components/
    AIFundFlow.tsx         # v20: AI资金流向核心组件
    SectorHeatmap.tsx      # 板块热力图（recharts）
    InstitutionRankings.tsx # 机构排行榜（recharts）
    InstitutionOverlap.tsx  # 机构重合度（recharts）
    KevinPortfolio.tsx      # Kevin个人持仓
    DataSourcePanel.tsx    # 数据源面板
  data/
    mockData.ts            # 美股机构持仓数据（11家机构）
    realData.ts            # 港股/A股持仓数据
    aiChain.ts             # AI产业链元数据
  lib/
    stockPrices.ts         # Yahoo Finance 实时行情
server/
  index.js                 # Express 服务器（含 v21 预警路由）
  alertPush.js             # v21: 飞书 Webhook 推送模块
```

## 数据源

| 来源 | 市场 | 状态 |
|------|------|------|
| SEC EDGAR 13F | 美股 | ✅ 最新 2025Q4 |
| HKEX 披露易 | 港股 | ✅ |
| 东方财富 QFII | A股 | ✅ |
| Tushare HSGT | 沪深港通 | ✅ |

## 飞书预警推送

- Webhook URL：`https://open.feishu.cn/open-apis/bot/v2/hook/acb1705d-f658-4521-8387-404acf50a098`
- 消息格式：飞书 Card 交互消息
- 信号配色：绿（增持）/ 红（减持）/ 黄（新建仓）
- 触发时机：保存预警规则且开启飞书通知时
- 测试接口：`GET /api/alert-test`

## 部署

- Frontend: Vite build → `dist/`
- 部署地址: https://05ky8spkgrde.space.minimaxi.com（v21）
- 旧地址: https://tw7p2onewrh3.space.minimaxi.com（v20）
