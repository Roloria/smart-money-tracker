import AIFundFlow from '../components/AIFundFlow'
import { Brain, TrendingUp } from 'lucide-react'

const C = {
  bg: '#0a0a0a', card: '#141414', border: '#1e1e1e',
  text: '#fafafa', text2: '#a1a1aa', text3: '#52525b',
  green: '#22c55e', red: '#ef4444', blue: '#38bdf8', yellow: '#f59e0b',
}

export default function AIFundFlowPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${C.border}`,
        background: `linear-gradient(90deg, ${C.green}08 0%, ${C.blue}08 50%, ${C.red}08 100%)`,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${C.green}18`, border: `1px solid ${C.green}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={18} color={C.green} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1.2 }}>
              💰 AI 资金流向预测
            </h1>
            <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>
              基于机构季度持仓变化数据的规则引擎分析 · 非 AI API · 实时计算
            </p>
          </div>
        </div>

        {/* Method explainer */}
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12,
        }}>
          {[
            { icon: '🟢', label: '强势买入', desc: 'changePercent > 10%', color: C.green },
            { icon: '🟢', label: '持续增持', desc: '连续多机构增持 > 5%', color: C.green },
            { icon: '🔵', label: '关注新建', desc: 'changeType === new', color: C.blue },
            { icon: '🟡', label: '观望', desc: '-5% ≤ 变化 ≤ 5%', color: C.yellow },
            { icon: '🟠', label: '减仓', desc: '-10% < 变化 < -5%', color: '#fb923c' },
            { icon: '🔴', label: '清仓警示', desc: '变化 < -10% 或清仓', color: C.red },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.label}</span>
              <span style={{ fontSize: 10, color: C.text3, fontFamily: 'JetBrains Mono, monospace' }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 24px 24px' }}>
        <AIFundFlow />
      </div>
    </div>
  )
}
