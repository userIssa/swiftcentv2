'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Receipt,
  FileText,
  Users,
  Building,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Layers,
  Package,
} from 'lucide-react';
import { ActiveBusinessProvider } from '@/context/ActiveBusinessContext';
import { VoiceDockProvider, useVoiceDock } from '@/context/VoiceDockContext';
import { BusinessSwitcher } from '@/components/BusinessSwitcher';
import { useAuth } from '@/context/AuthContext';

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navGroups = [
    {
      group: 'GENERAL',
      items: [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          active: pathname === '/dashboard',
        },
        {
          label: 'Reports',
          href: '/reports',
          icon: BarChart3,
          active: pathname === '/reports',
        },
      ],
    },
    {
      group: 'FINANCE',
      items: [
        {
          label: 'Transactions',
          href: '/invoices?status=paid',
          icon: CreditCard,
          active: false,
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
      ],
    },
    {
      group: 'MANAGEMENT',
      items: [
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
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Top Brand & Links */}
      <div className="space-y-6">
        {/* Brand Logo & Active Switcher */}
        <div className="space-y-3 pt-1">
          <Link
            href="/"
            onClick={onNavigate}
            title="Return to Landing Page"
            className="flex items-center gap-2.5 px-3 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  SwiftCent
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full">
                  Pro
                </span>
              </div>
            </div>
          </Link>

          {/* Quick Business Switcher In Sidebar */}
          <div className="px-2">
            <BusinessSwitcher />
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="space-y-5 px-1">
          {navGroups.map((group) => (
            <div key={group.group}>
              <div className="text-[10px] font-semibold text-slate-400 tracking-[0.08em] uppercase px-3 mb-1.5">
                {group.group}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${
                        item.active
                          ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-slate-900 font-semibold'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-white/60 font-medium'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          item.active
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom User Profile Card */}
      <div className="pt-4 border-t border-slate-200/70 space-y-3 px-2">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-slate-200/60 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onNavigate}
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { dockOffsetPx } = useVoiceDock();

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-slate-800 flex">
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-[#f4f5f8] border-r border-slate-200/80 p-4 z-40">
        <SidebarNav pathname={pathname} />
      </aside>

      {/* Mobile Sidebar Drawer Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-[#f4f5f8] border-r border-slate-200 p-5 shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/80">
              <span className="font-semibold text-xs tracking-wider uppercase text-slate-400">
                Navigation
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Workspace (shifts smoothly when right-docked Voice Copilot is open) */}
      <div
        className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-[padding] duration-300 ease-out"
        style={dockOffsetPx > 0 ? { paddingRight: `${dockOffsetPx}px` } : undefined}
      >
        {/* Mobile Top Navbar Bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" title="Return to Landing Page" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                S
              </div>
              <span className="font-bold text-sm text-slate-900">SwiftCent</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium"
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
