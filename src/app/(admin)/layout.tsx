'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Globe,
  BarChart3,
  Receipt,
  FileText,
  Users,
  Building,
  Settings,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Package,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { ActiveBusinessProvider } from '@/context/ActiveBusinessContext';
import { VoiceDockProvider, useVoiceDock } from '@/context/VoiceDockContext';
import { BusinessSwitcher } from '@/components/BusinessSwitcher';
import { CelestialBackdrop } from '@/components/CelestialBackdrop';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface NavEntry {
  label: string;
  href: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

function SidebarNav({
  pathname,
  collapsed = false,
  dark = false,
  onToggleCollapse,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  dark?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mainOpen, setMainOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const mainItems: NavEntry[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Globe,
      active: pathname === '/dashboard',
    },
    {
      label: 'Invoices',
      href: '/invoices',
      icon: Receipt,
      active: pathname.startsWith('/invoices'),
    },
    {
      label: 'Quotes',
      href: '/quotes',
      icon: FileText,
      active: pathname.startsWith('/quotes'),
    },
    {
      label: 'Clients',
      href: '/clients',
      icon: Users,
      active: pathname.startsWith('/clients'),
    },
    {
      label: 'Products',
      href: '/products',
      icon: Package,
      active: pathname.startsWith('/products'),
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
      active: pathname === '/reports',
    },
  ];

  const settingsItems: NavEntry[] = [
    {
      label: 'Businesses',
      href: '/business',
      icon: Building,
      active: pathname.startsWith('/business'),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings'),
    },
  ];

  const renderCollapsedTooltip = (label: string) => (
    <span className="hidden lg:flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-full ml-4 top-1/2 -translate-y-1/2 z-[80] whitespace-nowrap">
      <span
        className={`w-2 h-2 rotate-45 -mr-1 rounded-[1px] ${
          dark ? 'bg-slate-950 border-l border-b border-white/15' : 'bg-slate-900'
        }`}
      />
      <span
        className={`text-white text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-xl ${
          dark ? 'bg-slate-950/95 border border-white/15 backdrop-blur-xl' : 'bg-slate-900'
        }`}
      >
        {label}
      </span>
    </span>
  );

  const renderNavItem = (item: NavEntry) => {
    const Icon = item.icon;

    if (collapsed) {
      return (
        <Link
          key={item.label}
          href={item.href}
          onClick={onNavigate}
          aria-label={item.label}
          className={`group relative flex items-center justify-center w-10 h-10 mx-auto rounded-full border transition-all duration-150 ${
            dark
              ? item.active
                ? 'bg-gradient-to-tr from-sky-400/25 via-blue-500/25 to-indigo-400/20 border-sky-400/60 text-white shadow-[0_0_20px_rgba(56,189,248,0.35)]'
                : 'bg-white/[0.04] border-white/[0.1] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-sky-400/35'
              : item.active
              ? 'bg-gradient-to-tr from-blue-50 to-indigo-50 border-blue-500/70 text-blue-600 shadow-[0_0_16px_rgba(37,99,235,0.2)]'
              : 'bg-slate-50/90 border-slate-200/90 text-slate-500 hover:text-slate-900 hover:bg-white hover:border-slate-300 shadow-2xs'
          }`}
        >
          <Icon className="w-[17px] h-[17px] shrink-0" />
          {renderCollapsedTooltip(item.label)}
        </Link>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={onNavigate}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 overflow-hidden ${
          dark
            ? item.active
              ? 'text-white font-semibold bg-gradient-to-r from-sky-400/20 via-blue-500/20 to-indigo-500/10 border border-sky-400/45 shadow-[0_0_22px_rgba(56,189,248,0.18)]'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            : item.active
            ? 'text-blue-700 font-semibold bg-gradient-to-r from-blue-50/95 via-indigo-50/75 to-sky-50/90 border border-blue-500/45 shadow-[0_4px_16px_rgba(37,99,235,0.1)]'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/75 border border-transparent font-medium'
        }`}
      >
        {item.active && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 w-24 h-12 rounded-full blur-lg ${
              dark ? 'bg-sky-400/25' : 'bg-blue-400/15'
            }`}
          />
        )}
        <Icon
          className={`relative w-[17px] h-[17px] shrink-0 transition-colors ${
            dark
              ? item.active
                ? 'text-sky-300'
                : 'text-slate-400 group-hover:text-white'
              : item.active
              ? 'text-blue-600'
              : 'text-slate-400 group-hover:text-slate-700'
          }`}
        />
        <span className="relative truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <div
      className={`flex flex-col h-full justify-between select-none ${
        dark ? 'text-slate-100' : 'text-slate-800'
      }`}
    >
      {/* Top Brand Bar + Workspace Switcher + Menus */}
      <div className="space-y-4">
        {/* Clean Brand Header & Collapse Toggle */}
        <div
          className={`flex items-center pt-0.5 ${
            collapsed ? 'flex-col gap-2' : 'justify-between px-1'
          }`}
        >
          <Link
            href="/"
            onClick={onNavigate}
            title="Return to Landing Page"
            className="flex items-center gap-2 group"
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-white group-hover:scale-105 transition-transform ${
                dark
                  ? 'bg-gradient-to-tr from-sky-400 to-blue-600 shadow-[0_0_18px_rgba(56,189,248,0.45)]'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-sm shadow-blue-600/25'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold text-sm tracking-tight transition-colors ${
                    dark
                      ? 'text-white group-hover:text-sky-300'
                      : 'text-slate-900 group-hover:text-blue-600'
                  }`}
                >
                  SwiftCent
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                    dark
                      ? 'bg-sky-400/15 text-sky-300 border-sky-400/30'
                      : 'bg-blue-50 text-blue-700 border-blue-200/70'
                  }`}
                >
                  Pro
                </span>
              </div>
            )}
          </Link>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`hidden lg:inline-flex items-center justify-center p-1.5 rounded-lg transition-colors cursor-pointer ${
                dark
                  ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {collapsed ? (
                <ChevronsRight className="w-4 h-4" />
              ) : (
                <ChevronsLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Workspace Glass Switcher Card */}
        <div>
          <BusinessSwitcher collapsed={collapsed} dark={dark} />
        </div>

        {/* MAIN MENU Section */}
        <div className="space-y-2">
          {!collapsed && (
            <button
              type="button"
              onClick={() => setMainOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-1.5 py-1 text-[10.5px] font-semibold tracking-[0.09em] uppercase transition-colors cursor-pointer ${
                dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>MAIN MENU</span>
              {mainOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {(collapsed || mainOpen) && (
            <div className={collapsed ? 'space-y-2.5 pt-1' : 'space-y-1'}>
              {mainItems.map(renderNavItem)}
            </div>
          )}
        </div>

        {/* SETTINGS Section */}
        <div
          className={`pt-2.5 border-t space-y-2 ${
            dark ? 'border-white/[0.08]' : 'border-slate-200/80'
          }`}
        >
          {!collapsed && (
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-1.5 py-1 text-[10.5px] font-semibold tracking-[0.09em] uppercase transition-colors cursor-pointer ${
                dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>SETTINGS</span>
              {settingsOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {(collapsed || settingsOpen) && (
            <div className={collapsed ? 'space-y-2.5 pt-1' : 'space-y-1'}>
              {settingsItems.map(renderNavItem)}
            </div>
          )}
        </div>

        {/* PLATFORM ADMIN Section (visible strictly to Platform Admins) */}
        {user?.isPlatformAdmin && (
          <div
            className={`pt-2.5 border-t space-y-2 ${
              dark ? 'border-white/[0.08]' : 'border-slate-200/80'
            }`}
          >
            {!collapsed && (
              <div
                className={`px-1.5 py-1 text-[10.5px] font-semibold tracking-[0.09em] uppercase ${
                  dark ? 'text-sky-300/90' : 'text-blue-600/80'
                }`}
              >
                PLATFORM
              </div>
            )}
            <div className={collapsed ? 'space-y-2.5 pt-1' : 'space-y-1'}>
              {renderNavItem({
                label: 'Platform Monitor',
                href: '/admin',
                icon: ShieldCheck,
                active: pathname.startsWith('/admin'),
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom User Account Card & Sign Out */}
      <div
        className={`pt-3 border-t ${
          dark ? 'border-white/[0.08]' : 'border-slate-200/80'
        }`}
      >
        {user ? (
          collapsed ? (
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign Out"
                className={`group relative w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                  dark
                    ? 'bg-white/[0.06] border-white/[0.12] text-white hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-300'
                    : 'bg-gradient-to-tr from-blue-50 to-indigo-50 border-slate-200 text-slate-900 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600'
                }`}
              >
                <span>{user.name.charAt(0).toUpperCase()}</span>
                {renderCollapsedTooltip(`Sign out (${user.name})`)}
              </button>
            </div>
          ) : (
            <div
              className={`flex items-center justify-between gap-2 px-1.5 py-1.5 rounded-xl transition-colors ${
                dark ? 'hover:bg-white/[0.05]' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                    dark
                      ? 'bg-gradient-to-tr from-sky-500/35 to-indigo-500/35 border border-sky-400/30'
                      : 'bg-gradient-to-tr from-slate-900 to-slate-700'
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-[12.5px] font-semibold truncate ${
                      dark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {user.name}
                  </div>
                  <div className="text-[10.5px] text-slate-400 truncate">{user.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign Out"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 group ${
                  dark
                    ? 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/15'
                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                <LogOut className="w-4 h-4 hidden group-hover:block" />
                <ChevronRight className="w-4 h-4 block group-hover:hidden" />
              </button>
            </div>
          )
        ) : (
          <Link
            href="/login"
            onClick={onNavigate}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <span>{collapsed ? 'In' : 'Sign In'}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { dockOffsetPx } = useVoiceDock();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('swiftcent_sidebar_collapsed') === '1') {
      setSidebarCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('swiftcent_sidebar_collapsed', next ? '1' : '0');
      }
      return next;
    });
  };

  return (
    <div
      className={`swiftcent-theme-root min-h-screen flex relative overflow-x-hidden ${
        isDark ? 'bg-[#030611] text-slate-100' : 'bg-[#f4f5f8] text-slate-800'
      }`}
    >
      {/* Celestial Vortex Glow Backdrop (Active in Default Dark Glass Theme) */}
      {isDark && <CelestialBackdrop />}

      {/* Desktop Floating Sidebar */}
      <aside
        className={`no-print hidden lg:flex flex-col fixed top-3 bottom-3 left-3 rounded-2xl border p-3.5 z-40 transition-all duration-300 ease-out overflow-visible ${
          isDark
            ? 'bg-white/[0.04] backdrop-blur-2xl border-white/[0.11] shadow-[0_20px_50px_rgba(0,0,0,0.65)]'
            : 'bg-white/95 backdrop-blur-md border-slate-200/90 shadow-[0_12px_36px_rgba(15,23,42,0.06)]'
        } ${sidebarCollapsed ? 'w-[74px]' : 'w-[252px]'}`}
      >
        <div
          className={`flex-1 ${
            sidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden pr-0.5'
          }`}
        >
          <SidebarNav
            pathname={pathname}
            collapsed={sidebarCollapsed}
            dark={isDark}
            onToggleCollapse={toggleCollapsed}
          />
        </div>
      </aside>

      {/* Mobile Sidebar Drawer Modal */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className={`fixed inset-y-2.5 left-2.5 w-72 rounded-2xl border p-4 shadow-2xl z-50 flex flex-col ${
              isDark
                ? 'bg-[#070d1d]/90 backdrop-blur-2xl border-white/[0.12]'
                : 'bg-white border-slate-200'
            }`}
          >
            <div
              className={`flex items-center justify-between mb-2 pb-2 border-b ${
                isDark ? 'border-white/[0.08]' : 'border-slate-100'
              }`}
            >
              <span className="font-semibold text-[10px] tracking-[0.09em] uppercase text-slate-400">
                Navigation
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={`p-1 rounded-lg ${
                  isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav
                pathname={pathname}
                dark={isDark}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Workspace (reflows cleanly with sidebar collapse & Voice Copilot dock) */}
      <div
        className={`relative z-10 flex-1 flex flex-col min-w-0 transition-[padding] duration-300 ease-out ${
          sidebarCollapsed ? 'lg:pl-[96px]' : 'lg:pl-[274px]'
        }`}
        style={dockOffsetPx > 0 ? { paddingRight: `${dockOffsetPx}px` } : undefined}
      >
        {/* Mobile Top Navbar Bar */}
        <header
          className={`no-print lg:hidden sticky top-0 z-30 flex items-center justify-between backdrop-blur-xl border-b px-4 py-3 ${
            isDark
              ? 'bg-[#050b19]/80 border-white/[0.09] text-white'
              : 'bg-white/95 border-slate-200 text-slate-900 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`p-1.5 rounded-lg ${
                isDark
                  ? 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" title="Return to Landing Page" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                S
              </div>
              <span
                className={`font-bold text-sm ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                SwiftCent
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
            </Link>
          </div>
        </header>

        {/* Primary Viewport Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ActiveBusinessProvider>
      <VoiceDockProvider>
        <AdminShell>{children}</AdminShell>
      </VoiceDockProvider>
    </ActiveBusinessProvider>
  );
}
