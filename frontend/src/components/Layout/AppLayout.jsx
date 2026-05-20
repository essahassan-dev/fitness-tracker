import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import OnboardingTour from '../Onboarding/OnboardingTour';
import TrainerRemarks from '../UI/TrainerRemarks';
import { useAuth } from '../../context/AuthContext';

const AppLayout = () => {
  const { user } = useAuth();
  const showBell = user?.role === 'user';

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar />

      <main className="flex-1 min-w-0">
        {/* Top bar — shows trainer bell for regular users */}
        {showBell && (
          <div className="sticky top-0 z-20 flex items-center justify-end px-4 sm:px-6 py-2 bg-dark-950/80 backdrop-blur-sm border-b border-dark-800/50 lg:border-0">
            <TrainerRemarks />
          </div>
        )}

        <div className={`${showBell ? '' : 'pt-16 lg:pt-0'} min-h-screen`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Onboarding tour — shows once for new users */}
      <OnboardingTour />
    </div>
  );
};

export default AppLayout;
