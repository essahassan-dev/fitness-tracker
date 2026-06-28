import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  RiDashboardLine, RiRunLine, RiRestaurantLine, RiLineChartLine,
  RiBarChartLine, RiUserLine, RiLogoutBoxLine, RiMenuLine, RiCloseLine,
  RiFlashlightLine, RiShieldLine, RiLightbulbLine, RiVipCrownLine,
  RiCalendarLine, RiUserHeartLine, RiQuestionLine, RiQrCodeLine,
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import ThemeToggle from '../UI/ThemeToggle';
import { PremiumBadge } from '../UI/SubscriptionBadge';

const navItems = [
  { to: '/dashboard',       icon: RiDashboardLine,  label: 'Dashboard' },
  { to: '/workouts',        icon: RiRunLine,         label: 'Workouts' },
  { to: '/nutrition',       icon: RiRestaurantLine,  label: 'Nutrition' },
  { to: '/progress',        icon: RiLineChartLine,   label: 'Progress' },
  { to: '/analytics',       icon: RiBarChartLine,    label: 'Analytics' },
  { to: '/recommendations', icon: RiLightbulbLine,   label: 'Recommendations' },
  { to: '/weekly-plan',     icon: RiCalendarLine,    label: 'Weekly Plan' },
  { to: '/profile',         icon: RiUserLine,        label: 'Profile' },
  { to: '/attendance',     icon: RiQrCodeLine,     label: 'Attendance' },
  { to: '/how-to-use',      icon: RiQuestionLine,    label: 'How to Use' },
];

const Sidebar = () => {
  const { user, logout, isPremium } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const premium = isPremium();

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-800">
        <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <RiFlashlightLine className="text-white text-lg" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none">FitStack</h1>
          <p className="text-dark-500 text-xs mt-0.5">Fitness Tracker</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon className="text-lg flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Admin link */}
        {user?.role === 'admin' && (
          <div className="pt-3 mt-2 border-t border-dark-800">
            <NavLink
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <RiShieldLine className="text-lg flex-shrink-0 text-red-400" />
              <span className="text-red-400">Admin Panel</span>
            </NavLink>
          </div>
        )}

        {/* Trainer link */}
        {user?.role === 'trainer' && (
          <div className="pt-3 mt-2 border-t border-dark-800">
            <NavLink
              to="/trainer"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <RiUserHeartLine className="text-lg flex-shrink-0 text-blue-400" />
              <span className="text-blue-400">Trainer Panel</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-dark-800 space-y-2">
        <ThemeToggle />

        {/* Upgrade CTA — only for regular free users */}
        {!premium && user?.role !== 'admin' && user?.role !== 'trainer' && (
          <button
            onClick={() => { navigate('/pricing'); setMobileOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-all text-sm font-medium"
          >
            <RiVipCrownLine className="text-lg" />
            <span>Upgrade to Premium</span>
          </button>
        )}

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-800/50">
          <div className="w-8 h-8 bg-brand-500/20 border border-brand-500/30 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-brand-400 text-xs font-bold">{getInitials(user?.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              {premium && <PremiumBadge />}
            </div>
            <p className="text-dark-500 text-xs truncate">
              {user?.role === 'admin'   ? <span className="text-red-400">Administrator</span>  :
               user?.role === 'trainer' ? <span className="text-blue-400">Trainer</span>       :
               user?.email}
            </p>
          </div>
        </div>

        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <RiLogoutBoxLine className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-dark-900 border-r border-dark-800 h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-dark-900 border-b border-dark-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <RiFlashlightLine className="text-white" />
          </div>
          <span className="text-white font-bold">FitStack</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-dark-400 hover:text-white p-1">
          {mobileOpen ? <RiCloseLine className="text-2xl" /> : <RiMenuLine className="text-2xl" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-dark-900 border-r border-dark-800 z-50 animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
