import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  RiDashboardLine, RiRunLine, RiRestaurantLine, RiLineChartLine,
  RiBarChartLine, RiUserLine, RiLogoutBoxLine, RiMenuLine, RiCloseLine,
  RiFlashlightLine, RiShieldLine, RiLightbulbLine, RiVipCrownLine,
  RiCalendarLine, RiUserHeartLine, RiQuestionLine, RiQrCodeLine,
  RiTrophyLine, RiFileTextLine, RiRefreshLine,
} from 'react-icons/ri';
import Logo from '../UI/Logo';
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
  { to: '/gamification',    icon: RiTrophyLine,      label: 'Rewards & XP' },
  { to: '/weekly-plan',     icon: RiCalendarLine,    label: 'Weekly Plan' },
  { to: '/profile',         icon: RiUserLine,        label: 'Profile' },
  { to: '/attendance',      icon: RiQrCodeLine,      label: 'Attendance' },
  { to: '/rules',           icon: RiFileTextLine,    label: 'Rules & Regs' },
  { to: '/how-to-use',      icon: RiQuestionLine,    label: 'How to Use' },
];

const Sidebar = () => {
  const { user, logout, isPremium, isPersonalMode } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const premium    = isPremium();
  const personal   = isPersonalMode();

  // In personal mode, hide gym-specific nav items
  const visibleNavItems = navItems.filter(item => {
    if (personal && ['/attendance', '/rules'].includes(item.to)) return false;
    return true;
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-800">
        <Logo size="sm" textSize="text-lg" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map(({ to, icon: Icon, label }) => (
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
            <NavLink to="/trainer" onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <RiUserHeartLine className="text-lg flex-shrink-0 text-blue-400" />
              <span className="text-blue-400">Trainer Panel</span>
            </NavLink>
          </div>
        )}

        {/* Super Admin link */}
        {user?.role === 'super_admin' && (
          <div className="pt-3 mt-2 border-t border-dark-800">
            <NavLink to="/super-admin" onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <RiShieldLine className="text-lg flex-shrink-0 text-purple-400" />
              <span className="text-purple-400">Super Admin</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-dark-800 space-y-2">
        <ThemeToggle />

        {/* Switch mode button — only for regular users */}
        {user?.role === 'user' && user?.useMode && (
          <button
            onClick={() => { navigate('/use-mode'); setMobileOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-dark-400 hover:text-white hover:bg-white/[0.08] transition-all text-sm font-medium"
          >
            <RiRefreshLine className="text-lg" />
            <span>Switch Mode</span>
            <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-dark-700 text-dark-400 capitalize">{user.useMode}</span>
          </button>
        )}

        {/* Upgrade CTA — only for regular free users */}
        {!premium && user?.role !== 'admin' && user?.role !== 'trainer' && user?.role !== 'super_admin' && (
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
          <Logo size="sm" showText={false} />
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
