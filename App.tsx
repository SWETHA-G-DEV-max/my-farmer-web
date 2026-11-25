import React, { useState } from 'react';
import {
  Calculator,
  CalendarClock,
  Gavel,
  Handshake,
  Home,
  LayoutDashboard,
  Menu,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShoppingBag,
  Sprout,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { AgriLinkPage, AgriLinkProvider, useAgriLink } from './context/AgriLinkContext';
import { getAgriLinkText } from './i18n/agrilinkText';
import { BuyerDemandPage } from './views/agrilink/BuyerDemandPage';
import { BuyerTrustPage } from './views/agrilink/BuyerTrustPage';
import { DashboardPage } from './views/agrilink/DashboardPage';
import { FarmerProfilePage } from './views/agrilink/FarmerProfilePage';
import { HarvestPlannerPage } from './views/agrilink/HarvestPlannerPage';
import { HomePage } from './views/agrilink/HomePage';
import { MarketPulsePage } from './views/agrilink/MarketPulsePage';
import { MultiBuyerBiddingPage } from './views/agrilink/MultiBuyerBiddingPage';
import { MyDealsPage } from './views/agrilink/MyDealsPage';
import { NetCalculatorPage } from './views/agrilink/NetCalculatorPage';
import { SharedTransportPage } from './views/agrilink/SharedTransportPage';
import { VillageCropPoolPage } from './views/agrilink/VillageCropPoolPage';

const AgriLinkShell: React.FC = () => {
  const {
    state,
    page,
    setPage,
    setLanguage,
    resetDemoData,
    toasts,
    dismissToast,
  } = useAgriLink();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const t = getAgriLinkText(state.language);
  const isTa = state.language === 'ta';

  const pendingBidsCount = state.bids.filter((b) => b.status === 'Pending').length;
  const activeDealsCount = state.deals.filter((d) => d.status !== 'Payment Completed').length;
  const openPoolsCount = state.pools.filter((p) => p.status !== 'Deal Confirmed').length;

  const navItems: Array<{
    id: AgriLinkPage;
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
  }> = [
    {
      id: 'home',
      label: t.nav.home,
      icon: <Home className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'dashboard',
      label: t.nav.dashboard,
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'marketPulse',
      label: t.nav.marketPulse,
      icon: <TrendingUp className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'harvestPlanner',
      label: t.nav.harvestPlanner,
      icon: <CalendarClock className="w-4 h-4 shrink-0" />,
      badgeCount: state.harvests.length,
    },
    {
      id: 'buyerDemand',
      label: t.nav.buyerDemand,
      icon: <ShoppingBag className="w-4 h-4 shrink-0" />,
      badgeCount: state.buyerDemands.filter((d) => d.status === 'Open').length,
    },
    {
      id: 'bidding',
      label: t.nav.bidding,
      icon: <Gavel className="w-4 h-4 shrink-0" />,
      badgeCount: pendingBidsCount,
    },
    {
      id: 'cropPool',
      label: t.nav.cropPool,
      icon: <Users className="w-4 h-4 shrink-0" />,
      badgeCount: openPoolsCount,
    },
    {
      id: 'sharedTransport',
      label: t.nav.sharedTransport,
      icon: <Truck className="w-4 h-4 shrink-0" />,
      badgeCount: state.transportGroups.length,
    },
    {
      id: 'calculator',
      label: t.nav.calculator,
      icon: <Calculator className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'myDeals',
      label: t.nav.myDeals,
      icon: <Handshake className="w-4 h-4 shrink-0" />,
      badgeCount: activeDealsCount,
    },
    {
      id: 'trust',
      label: t.nav.trust,
      icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'profile',
      label: t.nav.profile,
      icon: <UserCheck className="w-4 h-4 shrink-0" />,
    },
  ];

  const activeNavLabel = navItems.find((n) => n.id === page)?.label || t.nav.home;

  const handleNavigate = (target: AgriLinkPage) => {
    setPage(target);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const SidebarContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-green-800 text-white flex items-center justify-center shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                {t.brand}
              </div>
              <div className="text-[11px] font-medium text-green-700 whitespace-nowrap">
                MH26-24 · Harvest-to-Sale
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="px-1 text-[11px] font-semibold text-slate-500">
            {isTa ? 'மொழி / Language' : 'Language / மொழி'}
          </div>
          <div className="grid grid-cols-2 gap-1 p-1 bg-green-50/70 rounded-lg border border-green-200">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                state.language === 'en'
                  ? 'bg-white text-green-900 shadow-xs font-semibold border border-green-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                state.language === 'ta'
                  ? 'bg-white text-green-900 shadow-xs font-semibold border border-green-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        <nav className="space-y-1" aria-label="Primary Sidebar Navigation">
          {navItems.map((item) => {
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-800 text-white font-semibold'
                    : 'text-slate-700 hover:bg-green-50 hover:text-green-900 font-medium'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      isActive ? 'text-green-100' : 'text-slate-500'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-200 space-y-2.5">
        <button
          type="button"
          onClick={() => handleNavigate('profile')}
          className="w-full text-left p-2.5 rounded-lg bg-green-50/70 border border-green-200 hover:bg-green-100/70 transition-colors"
        >
          <div className="text-xs font-semibold text-green-950 truncate">
            {state.farmerProfile.name}
          </div>
          <div className="text-[11px] text-green-800 truncate">
            {state.farmerProfile.village}, {state.farmerProfile.district}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setConfirmResetOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>{t.common.resetDemo}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8FBF9] text-slate-900">
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen overflow-y-auto">
        {SidebarContent}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white h-full border-r border-slate-200 overflow-y-auto">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium text-slate-600 truncate">
              <span className="text-slate-900 font-bold">{t.brand}</span>
              <span className="mx-2 text-slate-300">/</span>
              <span className="text-green-800 font-semibold">{activeNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-xs font-semibold text-amber-800 whitespace-nowrap">
              {t.demoBadge}
            </span>
            <button
              type="button"
              onClick={() => handleNavigate('harvestPlanner')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-green-800 hover:bg-green-900 rounded-lg whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.dashboard.addCrop}</span>
            </button>
          </div>
        </header>

        <div className="bg-amber-50 border-b border-amber-200 px-4 lg:px-8 py-2 text-xs font-medium text-amber-950 no-print">
          {t.demoNotice}
        </div>

        <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1280px] w-full mx-auto">
          {page === 'home' && <HomePage />}
          {page === 'dashboard' && <DashboardPage />}
          {page === 'marketPulse' && <MarketPulsePage />}
          {page === 'harvestPlanner' && <HarvestPlannerPage />}
          {page === 'buyerDemand' && <BuyerDemandPage />}
          {page === 'bidding' && <MultiBuyerBiddingPage />}
          {page === 'cropPool' && <VillageCropPoolPage />}
          {page === 'sharedTransport' && <SharedTransportPage />}
          {page === 'calculator' && <NetCalculatorPage />}
          {page === 'myDeals' && <MyDealsPage />}
          {page === 'trust' && <BuyerTrustPage />}
          {page === 'profile' && <FarmerProfilePage />}
        </main>

        <footer className="px-4 lg:px-8 py-4 border-t border-slate-200 bg-white text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 no-print">
          <span>
            AgriLink · {t.tagline}
          </span>
          <span>
            MH26-24 Prototype · LocalStorage Demo Data · {t.demoBadge}
          </span>
        </footer>
      </div>

      {confirmResetOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-demo-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 id="reset-demo-title" className="text-lg font-bold text-slate-900">
              {t.common.resetDemo}
            </h2>
            <p className="text-sm text-slate-600">
              {isTa
                ? 'இது உங்கள் உள்ளூர் மாதிரி மாற்றங்களை மீட்டமைத்து ஆரம்ப AgriLink தரவை மீண்டும் ஏற்றும்.'
                : 'This will restore all sample harvests, buyer bids, crop pools, shared transport groups, and deals to the initial MH26-24 demo dataset.'}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setConfirmResetOpen(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-800 hover:bg-green-900 rounded-lg"
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none no-print"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start justify-between gap-3 px-4 py-3 rounded-xl border shadow-md text-xs font-medium ${
                toast.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : toast.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-950'
                    : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <span>{toast.text}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-slate-500 hover:text-slate-900 shrink-0"
                aria-label="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AgriLinkProvider>
      <AgriLinkShell />
    </AgriLinkProvider>
  );
}
