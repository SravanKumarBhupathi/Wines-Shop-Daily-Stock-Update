import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wine, ArrowDownToLine, ArrowUpFromLine, BarChart3, FileText, Printer, Settings } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/brands', icon: Wine, label: 'Brands' },
    { to: '/stock-in', icon: ArrowDownToLine, label: 'Stock In' },
    { to: '/stock-out', icon: ArrowUpFromLine, label: 'Stock Out' },
    { to: '/sales', icon: BarChart3, label: 'Daily Sales' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/print', icon: Printer, label: 'Print / Excel' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-600 hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gold-500 tracking-wider uppercase">Wine & Liquor Shop</h1>
        <p className="text-xs text-gray-400 mt-1">Stock & Sales Management</p>
      </div>
      <nav className="flex-1 px-4 pb-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gold-600/10 text-gold-400 border border-gold-600/20'
                  : 'text-gray-400 hover:bg-dark-700 hover:text-gray-200'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
