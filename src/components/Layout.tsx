import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wine, ArrowDownToLine, ArrowUpFromLine, BarChart3, FileText, Printer, Settings as SettingsIcon, X } from 'lucide-react';

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/brands', icon: Wine, label: 'Brands' },
    { to: '/stock-in', icon: ArrowDownToLine, label: 'Stock In' },
    { to: '/stock-out', icon: ArrowUpFromLine, label: 'Stock Out' },
    { to: '/sales', icon: BarChart3, label: 'Daily Sales' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/print', icon: Printer, label: 'Print / Excel' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-dark-900 text-gray-200 overflow-hidden font-sans">
      <Sidebar />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-sm bg-dark-800 h-full flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-dark-600">
              <span className="font-bold text-gold-500 uppercase tracking-wider text-lg">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
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
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-dark-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
