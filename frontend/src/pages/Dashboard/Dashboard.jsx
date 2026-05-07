import React, { useState, useEffect } from 'react';
import {
  RiRunLine, RiRestaurantLine, RiScalesLine, RiFireLine,
  RiCalendarLine, RiArrowRightLine, RiTrophyLine,
  RiArrowUpLine, RiArrowDownLine, RiSubtractLine,
} from 'react-icons/ri';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/UI/StatCard';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import { formatRelativeDate, formatDate, formatCalories, getErrorMessage } from '../../utils/helpers';
import { defaultChartOptions, lineDataset, CHART_COLORS } from '../../utils/chartConfig';
import '../../utils/chartConfig';

// Net balance indicator
const NetBadge = ({ net }) => {
  if (net > 100)  return <span className="flex items-center gap-1 text-red-400 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full"><RiArrowUpLine />Surplus</span>;
  if (net < -100) return <span className="flex items-center gap-1 text-brand-400 text-xs font-semibold bg-brand-500/10 px-2 py-0.5 rounded-full"><RiArrowDownLine />Deficit</span>;
  return <span className="flex items-center gap-1 text-yellow-400 text-xs font-semibold bg-yellow-500/10 px-2 py-0.5 rounded-full"><RiSubtractLine />Balanced</span>;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('balance'); // 'balance' | 'consumed' | 'burned'

  useEffect(() => {
    dashboardAPI.getSummary()
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const { stats, monthlyBalance = [], monthlyCalories = [], monthlyBurned = [] } = data || {};
  const goals = stats?.macroGoals || { calories: 2000, protein: 150, carbs: 250, fat: 65 };

  // Chart datasets
  const balanceChart = {
    labels: monthlyBalance.map((d) => formatDate(d.date, 'MMM d')),
    datasets: [
      lineDataset('Consumed', monthlyBalance.map((d) => d.consumed), CHART_COLORS.orange),
      lineDataset('Burned',   monthlyBalance.map((d) => d.burned),   CHART_COLORS.green),
    ],
  };

  const consumedChart = {
    labels: monthlyCalories.map((d) => formatDate(d._id, 'MMM d')),
    datasets: [lineDataset('Calories In', monthlyCalories.map((d) => d.calories), CHART_COLORS.orange)],
  };

  const burnedChart = {
    labels: monthlyBurned.map((d) => formatDate(d._id, 'MMM d')),
    datasets: [lineDataset('Calories Burned', monthlyBurned.map((d) => d.caloriesBurned), CHART_COLORS.green)],
  };

  const activeChart = chartMode === 'balance' ? balanceChart : chartMode === 'consumed' ? consumedChart : burnedChart;

  const chartOptions = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: chartMode === 'balance'
        ? { ...defaultChartOptions.plugins.legend }
        : { display: false },
    },
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const netCalories    = stats?.netCalories ?? 0;
  const caloriesIn     = stats?.todayCaloriesIn ?? 0;
  const caloriesBurned = stats?.todayCaloriesBurned ?? 0;
  const tdee           = stats?.tdee ?? 2000;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">{formatDate(new Date(), 'EEEE, MMMM d, yyyy')} — Here's your fitness overview</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={RiRunLine}       label="Total Workouts"  value={stats?.totalWorkouts ?? 0}  color="brand"  subtitle="All time" />
        <StatCard icon={RiCalendarLine}  label="This Week"       value={stats?.weeklyWorkouts ?? 0} unit="sessions" color="blue"   subtitle="Last 7 days" />
        <StatCard icon={RiFireLine}      label="Calories Burned" value={caloriesBurned}             unit="kcal"    color="orange" subtitle="Today" />
        <StatCard icon={RiScalesLine}    label="Current Weight"  value={stats?.currentWeight ?? '—'} unit={stats?.currentWeight ? 'kg' : ''} color="purple" subtitle="Latest entry" />
      </div>

      {/* ── Calorie Balance Card ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold">Today's Calorie Balance</h2>
            <p className="text-dark-400 text-xs mt-0.5">TDEE goal: {tdee.toLocaleString()} kcal</p>
          </div>
          <NetBadge net={netCalories} />
        </div>

        {/* 3 big numbers */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {/* Consumed */}
          <div className="bg-dark-800/50 rounded-xl p-4 text-center border border-dark-700">
            <RiRestaurantLine className="text-orange-400 text-xl mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-400">{formatCalories(caloriesIn)}</p>
            <p className="text-dark-400 text-xs mt-0.5">Consumed</p>
            <p className="text-dark-600 text-xs">Goal: {goals.calories.toLocaleString()}</p>
          </div>

          {/* Net */}
          <div className={`rounded-xl p-4 text-center border ${
            netCalories > 100  ? 'bg-red-500/5 border-red-500/20' :
            netCalories < -100 ? 'bg-brand-500/5 border-brand-500/20' :
            'bg-yellow-500/5 border-yellow-500/20'
          }`}>
            <p className="text-dark-400 text-xs mb-1">Net Balance</p>
            <p className={`text-3xl font-bold ${
              netCalories > 100  ? 'text-red-400' :
              netCalories < -100 ? 'text-brand-400' :
              'text-yellow-400'
            }`}>
              {netCalories > 0 ? '+' : ''}{netCalories.toLocaleString()}
            </p>
            <p className="text-dark-500 text-xs mt-1">kcal</p>
            <p className={`text-xs mt-1 font-medium ${
              netCalories > 100  ? 'text-red-400' :
              netCalories < -100 ? 'text-brand-400' :
              'text-yellow-400'
            }`}>
              {netCalories > 100  ? '▲ Calorie Surplus' :
               netCalories < -100 ? '▼ Calorie Deficit' :
               '= Balanced'}
            </p>
          </div>

          {/* Burned */}
          <div className="bg-dark-800/50 rounded-xl p-4 text-center border border-dark-700">
            <RiFireLine className="text-brand-400 text-xl mx-auto mb-1" />
            <p className="text-2xl font-bold text-brand-400">{formatCalories(caloriesBurned)}</p>
            <p className="text-dark-400 text-xs mt-0.5">Burned</p>
            <p className="text-dark-600 text-xs">From workouts</p>
          </div>
        </div>

        {/* Calorie progress bar */}
        <div>
          <div className="flex justify-between text-xs text-dark-400 mb-1.5">
            <span>0</span>
            <span>Goal: {goals.calories.toLocaleString()} kcal</span>
          </div>
          <div className="h-3 bg-dark-800 rounded-full overflow-hidden relative">
            {/* Burned (green base) */}
            <div
              className="absolute left-0 top-0 h-full bg-brand-500/40 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((caloriesBurned / goals.calories) * 100, 100)}%` }}
            />
            {/* Consumed (orange on top) */}
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${caloriesIn > goals.calories ? 'bg-red-500' : 'bg-orange-500'}`}
              style={{ width: `${Math.min((caloriesIn / goals.calories) * 100, 100)}%`, opacity: 0.8 }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1.5">
            <span className="text-orange-400">{formatCalories(caloriesIn)} consumed</span>
            <span className="text-brand-400">{formatCalories(caloriesBurned)} burned</span>
          </div>
        </div>
      </div>

      {/* ── Macros + Chart ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold">Calorie History</h2>
              <p className="text-dark-400 text-xs mt-0.5">Last 30 days</p>
            </div>
            <div className="flex gap-1">
              {[
                { key: 'balance',  label: 'Balance' },
                { key: 'consumed', label: 'In' },
                { key: 'burned',   label: 'Burned' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setChartMode(key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    chartMode === key ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {monthlyBalance.length > 0 || monthlyCalories.length > 0 ? (
            <div className="h-52">
              <Line data={activeChart} options={chartOptions} />
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <div className="text-center">
                <RiRestaurantLine className="text-4xl text-dark-700 mx-auto mb-2" />
                <p className="text-dark-500 text-sm">No data yet — log meals and workouts</p>
              </div>
            </div>
          )}
        </div>

        {/* Macros */}
        <div className="card">
          <h2 className="text-white font-semibold mb-4">Today's Macros</h2>
          <div className="space-y-4">
            {[
              { label: 'Protein', value: stats?.todayProtein || 0, goal: goals.protein, color: 'bg-blue-500',   text: 'text-blue-400' },
              { label: 'Carbs',   value: stats?.todayCarbs   || 0, goal: goals.carbs,   color: 'bg-orange-500', text: 'text-orange-400' },
              { label: 'Fat',     value: stats?.todayFat     || 0, goal: goals.fat,     color: 'bg-purple-500', text: 'text-purple-400' },
            ].map(({ label, value, goal, color, text }) => {
              const pct = Math.min((value / goal) * 100, 100);
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-dark-300">{label}</span>
                    <span className={`font-medium ${text}`}>{Math.round(value)}g <span className="text-dark-500 font-normal">/ {goal}g</span></span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="pt-3 border-t border-dark-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Calories In</span>
                <span className="text-orange-400 font-semibold">{formatCalories(caloriesIn)} kcal</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Calories Burned</span>
                <span className="text-brand-400 font-semibold">−{formatCalories(caloriesBurned)} kcal</span>
              </div>
              <div className="flex justify-between text-sm border-t border-dark-800 pt-2">
                <span className="text-white font-medium">Net</span>
                <span className={`font-bold ${netCalories > 100 ? 'text-red-400' : netCalories < -100 ? 'text-brand-400' : 'text-yellow-400'}`}>
                  {netCalories > 0 ? '+' : ''}{netCalories.toLocaleString()} kcal
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold">Recent Workouts</h2>
            <p className="text-dark-400 text-xs mt-0.5">Your latest sessions</p>
          </div>
          <button onClick={() => navigate('/workouts')} className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1 transition-colors">
            View all <RiArrowRightLine />
          </button>
        </div>

        {data?.recentWorkouts?.length > 0 ? (
          <div className="space-y-3">
            {data.recentWorkouts.map((workout) => (
              <div
                key={workout._id}
                onClick={() => navigate('/workouts')}
                className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <RiRunLine className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{workout.title}</p>
                  <p className="text-dark-500 text-xs mt-0.5">
                    {workout.exercises?.length || 0} exercises
                    {workout.duration ? ` · ${workout.duration} min` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {workout.caloriesBurned > 0 && (
                    <p className="text-brand-400 text-xs font-semibold">🔥 {workout.caloriesBurned} kcal</p>
                  )}
                  <p className="text-dark-400 text-xs">{formatRelativeDate(workout.date)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <RiTrophyLine className="text-4xl text-dark-700 mx-auto mb-2" />
            <p className="text-dark-500 text-sm">No workouts yet</p>
            <button onClick={() => navigate('/workouts')} className="text-brand-400 text-sm mt-2 hover:text-brand-300">
              Log your first workout →
            </button>
          </div>
        )}
      </div>

      {/* Goal tip */}
      {!user?.profile?.weight && (
        <div className="card border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-white font-medium text-sm">Set your profile for accurate calorie goals</p>
              <p className="text-dark-400 text-xs mt-1">Add your weight, height, age, and fitness goal in Profile to get a personalized TDEE and macro targets.</p>
              <button onClick={() => navigate('/profile')} className="text-yellow-400 text-xs mt-2 hover:text-yellow-300 font-medium">
                Update profile →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
