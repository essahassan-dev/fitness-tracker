import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  RiGroupLine, RiDashboardLine, RiArrowLeftLine,
  RiMenuLine, RiCloseLine, RiUserHeartLine, RiFlashlightLine, RiQrCodeLine, RiMoneyDollarCircleLine,
  RiFileTextLine,
} from 'react-icons/ri';

import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

const trainerNav = [
  { to: '/trainer',            icon: RiDashboardLine,         label: 'My Clients', end: true },
  { to: '/trainer/attendance', icon: RiQrCodeLine,            label: 'Attendance' },
  { to: '/trainer/fees',       icon: RiMoneyDollarCircleLine, label: 'Client Fees' },
  { to: '/rules',              icon: RiFileTextLine,          label: 'Rules & Regulations' },
];

const TrainerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-800">
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <RiUserHeartLine className="text-white text-lg" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none">Trainer Panel</h1>
          <p className="text-dark-500 text-xs mt-0.5">FitStack</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {trainerNav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon className="text-lg flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="pt-3 mt-3 border-t border-dark-800">
          <button onClick={() => navigate('/dashboard')} className="sidebar-link w-full text-dark-400">
            <RiArrowLeftLine className="text-lg" />
            <span>Back to App</span>
          </button>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-dark-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-800/50">
          <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 text-xs font-bold">{getInitials(user?.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-blue-400 text-xs">Trainer</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      <aside className="hidden lg:flex flex-col w-64 bg-dark-900 border-r border-dark-800 h-screen flex-shrink-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-dark-900 border-b border-dark-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <RiUserHeartLine className="text-white text-sm" />
          </div>
          <span className="text-white font-bold">Trainer Panel</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-dark-400 hover:text-white p-1">
          {mobileOpen ? <RiCloseLine className="text-2xl" /> : <RiMenuLine className="text-2xl" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-dark-900 border-r border-dark-800 z-50 animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="pt-16 lg:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrainerLayout;
