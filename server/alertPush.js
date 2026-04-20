/**
 * Smart Money Tracker — 飞书预警推送模块
 * 调用飞书 Webhook 发送富文本 Card 消息
 */

const FEISHU_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/acb1705d-f658-4521-8387-404acf50a098';

// 信号类型 → 配色
const SIGNAL_COLOR = {
  increase:  '#22c55e', // 增持 绿
  decrease:  '#ef4444', // 减持 红
  new:       '#f59e0b', // 新建仓 黄/橙
};

const SIGNAL_EMOJI = {
  increase: '📈',
  decrease: '📉',
  new:      '🆕',
};

const SIGNAL_LABEL = {
  increase: '增持',
  decrease: '减持',
  new:      '新建仓',
};

/**
 * 构建飞书 Card 消息体
 */
function buildCard(alertData) {
  const {
    stockTicker,
    stockName = '',
    changePercent,
    signalType = 'increase',
    institutionName = '未知机构',
    quarter = '2025Q4',
    thresholdPercent = 0,
  } = alertData;

  const color = SIGNAL_COLOR[signalType] || '#38bdf8';
  const emoji = SIGNAL_EMOJI[signalType] || '📊';
  const label = SIGNAL_LABEL[signalType] || signalType;

  const sign = changePercent >= 0 ? '+' : '';
  const percentStr = `${sign}${changePercent}%`;
  const timeStr = new Date().toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  return {
    msg_type: 'interactive',
    card: {
      schema: 'https://developer.feishu.cn/schema/cards',
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: `🚨 聪明钱异动预警` },
        subtitle: { tag: 'plain_text', content: `${emoji} ${label} 信号触发` },
        template: color,
      },
      elements: [
        // ── 分隔线
        { tag: 'hr' },
        // ── 主体信息：股票 + 变化幅度
        {
          tag: 'div',
          fields: [
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**股票代码**\n\`${stockTicker}\` ${stockName}`,
              },
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**变化幅度**\n**${percentStr}**`,
              },
            },
          ],
        },
        // ── 第二行：机构 + 季度
        {
          tag: 'div',
          fields: [
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**监测机构**\n${institutionName}`,
              },
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**季  度**\n${quarter}`,
              },
            },
          ],
        },
        // ── 触发阈值
        {
          tag: 'div',
          fields: [
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**触发阈值**\n变化 > ${thresholdPercent}%`,
              },
            },
            {
              is_short: true,
              text: {
                tag: 'lark_md',
                content: `**预警时间**\n${timeStr}`,
              },
            },
          ],
        },
        // ── 分隔线
        { tag: 'hr' },
        // ── CTA 按钮
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: { tag: 'plain_text', content: '📊 查看详情' },
              type: 'primary',
              url: 'https://tw7p2onewrh3.space.minimaxi.com',
            },
            {
              tag: 'button',
              text: { tag: 'plain_text', content: '🔔 预警规则' },
              type: 'default',
              url: 'https://tw7p2onewrh3.space.minimaxi.com/#/alerts',
            },
          ],
        },
      ],
    },
  };
}

/**
 * 发送飞书预警消息
 * @param {Object} alertData
 * @param {string} alertData.stockTicker 股票代码
 * @param {string} [alertData.stockName] 股票名称
 * @param {number} alertData.changePercent 变化百分比（可正可负）
 * @param {'increase'|'decrease'|'new'} [alertData.signalType] 信号类型
 * @param {string} [alertData.institutionName] 机构名称
 * @param {string} [alertData.quarter] 季度
 * @param {number} [alertData.thresholdPercent] 触发阈值
 * @returns {Promise<{success: boolean, msg: string}>}
 */
export async function sendAlertMessage(alertData) {
  try {
    const payload = buildCard(alertData);
    const resp = await fetch(FEISHU_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (resp.ok && (data?.code === 0 || data?.StatusCode === 0)) {
      return { success: true, msg: '发送成功' };
    }
    return { success: false, msg: data?.msg || data?.message || `HTTP ${resp.status}` };
  } catch (err) {
    return { success: false, msg: err instanceof Error ? err.message : '网络错误' };
  }
}

/**
 * 发送测试消息（固定内容，用于验证 Webhook 连通性）
 */
export async function sendTestMessage() {
  return sendAlertMessage({
    stockTicker: 'TEST',
    stockName: '预警系统测试',
    changePercent: 0,
    signalType: 'increase',
    institutionName: 'Smart Money Tracker',
    quarter: new Date().toISOString().slice(0, 7).replace('-', 'Q'),
    thresholdPercent: 0,
  });
}
