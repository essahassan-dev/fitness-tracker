import React from 'react';
import KPICard from './KPICard';

const KPIGrid = ({ data, loading, error }) => {
  const kpis = data?.kpis || {};
  const cards = [
    { label: 'Total Businesses',   value: kpis.totalBusinesses,   accent: '#a78bfa', link: '/super-admin/businesses' },
    { label: 'Active Businesses',  value: kpis.activeBusinesses,  accent: '#4ade80', link: '/super-admin/businesses?status=active' },
    { label: 'Suspended',          value: kpis.suspendedBusinesses, accent: '#f87171' },
    { label: 'Trial',              value: kpis.trialBusinesses,   accent: '#60a5fa' },
    { label: 'Expired',            value: kpis.expiredBusinesses, accent: '#94a3b8' },
    { label: 'Total Admins',       value: kpis.totalAdmins,       accent: '#f59e0b' },
    { label: 'Total Trainers',     value: kpis.totalTrainers,     accent: '#34d399' },
    { label: 'Total Users',        value: kpis.totalUsers,        accent: '#60a5fa', link: '/super-admin/users' },
    { label: 'Active Today',       value: kpis.activeUsersToday,  accent: '#4ade80' },
    { label: 'New This Month',     value: kpis.newUsersThisMonth, accent: '#c084fc' },
    { label: 'Total Revenue',      value: kpis.totalRevenue,      accent: '#fbbf24', prefix: '$', link: '/super-admin/payments' },
    { label: 'Monthly Revenue',    value: kpis.monthlyRevenue,    accent: '#fb923c', prefix: '$' },
    { label: 'Pending Requests',   value: kpis.pendingRequests,   accent: '#f59e0b', link: '/super-admin/subscription-requests' },
    { label: 'Support Tickets',    value: kpis.pendingSupportTickets || 0, accent: '#f87171' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((c, i) => (
        <KPICard key={i} {...c} loading={loading} error={!!error} />
      ))}
    </div>
  );
};

export default KPIGrid;
