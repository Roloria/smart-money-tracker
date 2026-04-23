import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, Search, TrendingUp, Bell, Settings, DollarSign } from 'lucide-react';
import { institutions } from '../data/mockData';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '机构总览' },
  { to: '/institutions', icon: Building2, label: '机构列表' },
  { to: '/search', icon: Search, label: '持仓搜索' },
  { to: '/changes', icon: TrendingUp, label: '持仓异动' },
  { to: '/alerts', icon: Bell, label: '预警规则' },
  { to: '/settings', icon: Settings, label: '设置' },
];

// Ticker items
const tickerSymbols = [
  { symbol: 'AAPL', price: '228.87', change: '+1.2%', up: true },
  { symbol: 'MSFT', price: '420.50', change: '+0.8%', up: true },
  { symbol: 'NVDA', price: '130.00', change: '+3.4%', up: true },
  { symbol: 'TSLA', price: '400.00', change: '-2.1%', up: false },
  { symbol: 'META', price: '570.00', change: '+1.8%', up: true },
  { symbol: 'GOOGL', price: '180.00', change: '+0.5%', up: true },
  { symbol: 'AMZN', price: '210.00', change: '-0.3%', up: false },
  { symbol: 'JPM', price: '230.00', change: '+0.9%', up: true },
  { symbol: 'BRK.B', price: '420.00', change: '+0.2%', up: true },
  { symbol: 'SPY', price: '580.00', change: '+0.6%', up: true },
];

function AppSidebar() {
  return (
    <aside style={{ width: 240, minHeight: '100vh', background: '#0d0d0d', borderRight: '1px solid #262626', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e1e1e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #38bdf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>聪明钱</div>
            <div style={{ fontSize: 10, color: '#52525b', fontFamily: 'JetBrains Mono, monospace' }}>SMART MONEY</div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: '6px 10px', background: '#141414', borderRadius: 6, border: '1px solid #262626', fontSize: 11, color: '#52525b', fontFamily: 'JetBrains Mono, monospace' }}>
          📊 {institutions.length} 家机构追踪中
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid #1e1e1e' }}>
        <div style={{ fontSize: 11, color: '#3f3f46', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>
          Phase 1 MVP · 2026 Q1 Data
        </div>
      </div>
    </aside>
  );
}

function TickerBar() {
  const doubled = [...tickerSymbols, ...tickerSymbols];
  return (
    <div style={{ background: '#0d0d0d', borderBottom: '1px solid #262626', padding: '8px 0', overflow: 'hidden' }}>
      <div className="ticker-wrap">
        <div className="ticker">
          {doubled.map((item, i) => (
            <div key={i} className="ticker-badge" style={{ marginRight: 32 }}>
              <span style={{ color: '#a1a1aa', fontWeight: 600, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{item.symbol}</span>
              <span style={{ color: '#fafafa', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{item.price}</span>
              <span style={{ color: item.up ? '#22c55e' : '#ef4444', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{item.change}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
      <AppSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TickerBar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
