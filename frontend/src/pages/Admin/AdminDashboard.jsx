import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiGroupLine, RiRunLine, RiRestaurantLine, RiLineChartLine,
  RiUserAddLine, RiShieldLine, RiArrowRightLine, RiTrophyLine,
} from 'react-icons/ri';
import { Bar, Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import { defaultChartOptions, barDataset, lineDataset, CHART_COLORS } from '../../utils/chartConfig';
import '../../utils/chartConfig';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminAPI.getStats()
      .then((r) => setStats(r.data.data))
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const noLegend = { ...defaultChartOptions, plugins: { ...defaultChartOptions.plugins, legend: { display: false } } };

  const userGrowthChart = {
    labels: stats?.userGrowth?.map((d) => formatDate(d._id, 'MMM d')) || [],
    datasets: [lineDataset('New Users', stats?.userGrowth?.map((d) => d.count) || [], CHART_COLORS.green)],
  };

  const workoutChart = {
    labels: stats?.workoutGrowth?.map((d) => formatDate(d._id, 'MMM d')) || [],
    datasets: [barDataset('Workouts', stats?.workoutGrowth?.map((d) => d.count) || [], CHART_COLORS.blue)],
  };

  const statCards = [
    { label: 'Total Users',       value: stats?.totalUsers ?? 0,            color: 'text-brand-400',  bg: 'bg-brand-500/10  border-brand-500/20',  icon: RiGroupLine },
    { label: 'Active Users',      value: stats?.activeUsers ?? 0,           color: 'text-blue-400',   bg: 'bg-blue-500/10   border-blue-500/20',   icon: RiShieldLine },
    { label: 'New This Month',    value: stats?.newUsersThisMonth ?? 0,     color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: RiUserAddLine },
    { label: 'Banned Users',      value: stats?.inactiveUsers ?? 0,         color: 'text-red-400',    bg: 'bg-red-500/10    border-red-500/20',    icon: RiGroupLine },
    { label: 'Total Workouts',    value: stats?.totalWorkouts ?? 0,         color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: RiRunLine },
    { label: 'Workouts This Week',value: stats?.workoutsThisWeek ?? 0,      color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: RiRunLine },
    { label: 'Nutrition Entries', value: stats?.totalNutritionEntries ?? 0, color: 'text-green-400',  bg: 'bg-green-500/10  border-green-500/20',  icon: RiRestaurantLine },
    { label: 'Progress Entries',  value: stats?.totalProgressEntries ?? 0,  color: 'text-cyan-400',   bg: 'bg-cyan-500/10   border-cyan-500/20',   icon: RiLineChartLine },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
          <RiShieldLine className="text-red-400 text-xl" />
        </div>
        <div>
          <h1 className="page-title">Admin Overview</h1>
          <p className="page-subtitle">Platform-wide stats and activity</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="card-sm flex flex-col gap-3">
            <div className={`w-9 h-9 ${bg} border rounded-xl flex items-center justify-center`}>
              <Icon className={`${color} text-lg`} />
            </div>
            <div>
              <p className="text-dark-400 text-xs uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">User Registrations</h2>
            <span className="text-dark-500 text-xs">Last 30 days</span>
          </div>
          {stats?.userGrowth?.length > 0 ? (
            <div className="h-52"><Line data={userGrowthChart} options={noLegend} /></div>
          ) : (
            <div className="h-52 flex items-center justify-center"><p className="text-dark-500 text-sm">No data yet</p></div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Workout Activity</h2>
            <span className="text-dark-500 text-xs">Last 30 days</span>
          </div>
          {stats?.workoutGrowth?.length > 0 ? (
            <div className="h-52"><Bar data={workoutChart} options={noLegend} /></div>
          ) : (
            <div className="h-52 flex items-center justify-center"><p className="text-dark-500 text-sm">No data yet</p></div>
          )}
        </div>
      </div>

      {/* Top active users */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Most Active Users</h2>
          <button
            onClick={() => navigate('/admin/users')}
            className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1 transition-colors"
          >
            View all <RiArrowRightLine />
          </button>
        </div>

        {stats?.topActiveUsers?.length > 0 ? (
          <div className="space-y-3">
            {stats.topActiveUsers.map((item, i) => (
              <div
                key={item._id}
                onClick={() => navigate(`/admin/users/${item._id}`)}
                className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 bg-brand-500/10 border border-brand-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-400 text-xs font-bold">{getInitials(item.user.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{item.user.name}</p>
                  <p className="text-dark-500 text-xs">{item.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-400 font-bold text-sm">{item.workouts}</span>
                  <span className="text-dark-500 text-xs">workouts</span>
                  <RiArrowRightLine className="text-dark-600 group-hover:text-dark-400 transition-colors ml-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <RiTrophyLine className="text-4xl text-dark-700 mx-auto mb-2" />
            <p className="text-dark-500 text-sm">No workout data yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
