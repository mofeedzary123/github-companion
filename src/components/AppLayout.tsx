import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderOpen, Building2, Truck, Users,
  ArrowLeftRight, Menu, X, ChevronLeft, Settings, LogOut, FileBarChart,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/products', label: 'المنتجات', icon: Package },
  { path: '/categories', label: 'الأصناف', icon: FolderOpen },
  { path: '/warehouses', label: 'المخازن', icon: Building2 },
  { path: '/armory-warehouses', label: 'مخازن التسليح', icon: ShieldAlert },
  { path: '/suppliers', label: 'الموردين', icon: Truck },
  { path: '/clients', label: 'جهات الصرف', icon: Users },
  { path: '/movements', label: 'حركة المخزون', icon: ArrowLeftRight },
  { path: '/reports', label: 'التقارير', icon: FileBarChart },
  { path: '/settings', label: 'الإعدادات', icon: Settings },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { displayName, role, signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 z-50 h-screen gradient-sidebar flex flex-col transition-transform duration-300 ease-in-out
          md:sticky md:top-0 md:translate-x-0
          ${collapsed ? 'w-[72px]' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Logo Section - مع حماية علوية pt-10 للجوال */}
        <div className="flex items-center justify-between p-4 pt-10 md:pt-4 border-b border-sidebar-border shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sidebar-primary-foreground font-black text-sm">نظام المخازن</span>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center mx-auto">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation Section - قابلة للتمرير مع flex-1 */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'gradient-primary text-primary-foreground shadow-elevated font-black'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }
                `}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'scale-110' : 'group-hover:text-sidebar-primary'}`} />
                {!collapsed && <span className="text-xs font-bold">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Section - حماية سفلية pb-12 ومساحة ثابتة shrink-0 */}
        <div className="p-3 border-t border-sidebar-border space-y-2 bg-inherit shrink-0 pb-12 md:pb-4">
          {!collapsed && (
            <div className="text-[11px] text-sidebar-foreground/70 text-center bg-black/20 p-2 rounded-xl border border-white/5">
              <p className="font-black text-sidebar-primary-foreground mb-0.5">{displayName}</p>
              <p className="opacity-50 font-medium">{role === 'admin' ? 'مدير النظام' : 'موظف'}</p>
            </div>
          )}
          <button 
            onClick={signOut} 
            className="w-full flex items-center justify-center gap-2 text-xs text-sidebar-foreground/80 hover:text-destructive py-3.5 rounded-xl hover:bg-sidebar-accent transition-all border border-sidebar-border/40 font-black"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0 bg-secondary/10">
        {/* Top bar - حماية علوية pt-6 للجوال لعدم تداخل الساعة */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 md:px-6 h-20 md:h-16 flex items-center justify-between pt-6 md:pt-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
            <h2 className="text-lg font-black text-foreground truncate">
              {navItems.find(i => i.path === location.pathname)?.label || 'الرئيسية'}
            </h2>
          </div>
          <div className="text-[10px] text-muted-foreground hidden sm:block font-black opacity-30 tracking-widest">
            STOCK BUDDY PRO 25
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
