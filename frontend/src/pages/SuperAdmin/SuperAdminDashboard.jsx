import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiShieldLine, RiGroupLine, RiUserLine, RiMoneyDollarCircleLine,
  RiArrowRightLine, RiCheckLine, RiCloseLine, RiRefreshLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { superAdminAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    superAdminAPI.getStats()
      .then((r) => setStats(r.data.data))
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const cards = [
    { label: 'Total Users',    value: stats?.totalUsers    || 0, color: 'text-brand-400',  icon: RiUserLine },
    { label: 'Admins',         value: stats?.totalAdmins   || 0, color: 'text-red-400',    icon: RiShieldLine },
    { label: 'Trainers',       value: stats?.totalTrainers || 0, color: 'text-blue-400',   icon: RiUserLine },
    { label: 'Premium Users',  value: stats?.premiumUsers  || 0, color: 'text-yellow-400', icon: RiGroupLine },
    { label: 'Banned',         value: stats?.bannedUsers   || 0, color: 'text-orange-400', icon: RiCloseLine },
    { label: 'Total Workouts', value: stats?.totalWorkouts || 0, color: 'text-green-400',  icon: RiCheckLine },
    { label: 'Paid Fees',      value: stats?.paidFees      || 0, color: 'text-cyan-400',   icon: RiMoneyDollarCircleLine },
    { label: 'Revenue (PKR)',  value: `${(stats?.totalRevenue || 0).toLocaleString()}`, color: 'text-purple-400', icon: RiMoneyDollarCircleLine },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <RiShieldLine className="text-white text-xl" />
          </div>
          <div>
            <h1 className="page-title">Super Admin Dashboard</h1>
            <p className="page-subtitle">Full platform overview — you have complete access</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card-sm">
            <Icon className={`${color} text-xl mb-2`} />
            <p className="text-dark-400 text-xs uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Admins */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Admin Accounts</h2>
          <button onClick={() => navigate('/super-admin/admins')} className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1">
            Manage all <RiArrowRightLine />
          </button>
        </div>
        {stats?.recentAdmins?.length === 0 ? (
          <p className="text-dark-500 text-sm">No admin accounts yet</p>
        ) : (
          <div className="space-y-3">
            {stats?.recentAdmins?.slice(0, 5).map((admin) => (
              <div key={admin._id} className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: admin.isActive ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.2)', border: `1px solid ${admin.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(100,116,139,0.3)'}` }}>
                  <span className={`text-xs font-bold ${admin.isActive ? 'text-red-400' : 'text-dark-400'}`}>{getInitials(admin.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{admin.name}</p>
                  <p className="text-dark-500 text-xs">{admin.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${admin.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {admin.isActive ? 'Active' : 'Banned'}
                  </span>
                  <button onClick={() => navigate(`/super-admin/admins`)} className="text-dark-500 hover:text-white p-1 rounded transition-colors">
                    <RiArrowRightLine className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
