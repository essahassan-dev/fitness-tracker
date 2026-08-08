import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import OnboardingTour from '../Onboarding/OnboardingTour';
import TrainerRemarks from '../UI/TrainerRemarks';
import NotificationBell from '../UI/NotificationBell';
import FlexAI from '../FlexAI/FlexAI';
import { useAuth } from '../../context/AuthContext';

const AppLayout = () => {
  const { user } = useAuth();
  const showBell = user?.role === 'user';

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      <Sidebar />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        {/* Top bar — notification bell + trainer remarks */}
        {showBell && (
          <div className="sticky top-0 z-20 flex items-center justify-end gap-2 px-4 sm:px-6 py-2 bg-dark-950/80 backdrop-blur-sm border-b border-dark-800/50">
            <NotificationBell />
            <TrainerRemarks />
          </div>
        )}

        <div className={`${showBell ? '' : 'pt-16 lg:pt-0'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Onboarding tour */}
      <OnboardingTour />
      {/* FLEX AI chatbot */}
      <FlexAI />
    </div>
  );
};

export default AppLayout;
