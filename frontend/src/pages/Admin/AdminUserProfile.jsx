import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine, RiRunLine, RiRestaurantLine, RiLineChartLine,
  RiShieldLine, RiDeleteBinLine, RiCheckLine, RiCloseLine,
  RiScalesLine, RiFireLine, RiTimeLine, RiCalendarLine,
  RiUserLine, RiTrophyLine,
} from 'react-icons/ri';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import {
  formatDate, formatRelativeDate, getInitials,
  getCategoryColor, getMealTypeIcon, getErrorMessage,
} from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import { defaultChartOptions, lineDataset, barDataset, CHART_COLORS } from '../../utils/chartConfig';
import '../../utils/chartConfig';

// ── Tab button ─────────────────────────────────────────────────────────────────
const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
      active ? 'bg-dark-800 text-white border border-dark-700' : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
    }`}
  >
    <Icon className="text-base" /> {label}
  </button>
);

// ── Workouts tab ───────────────────────────────────────────────────────────────
const WorkoutsTab = ({ userId }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    setLoading(true);
    adminAPI.getUserWorkouts(userId, { page, limit: 10 })
      .then((r) => { setWorkouts(r.data.data); setPagination(r.data.pagination); })
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [userId, page]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-3">
      {workouts.length === 0 ? (
        <div className="text-center py-12">
          <RiRunLine className="text-4xl text-dark-700 mx-auto mb-2" />
          <p className="text-dark-500">No workouts logged yet</p>
        </div>
      ) : (
        <>
          {workouts.map((w) => (
            <div key={w._id} className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-white font-semibold">{w.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-dark-400 flex-wrap">
                    <span className="flex items-center gap-1"><RiCalendarLine />{formatDate(w.date)}</span>
                    {w.duration && <span className="flex items-center gap-1"><RiTimeLine />{w.duration} min</span>}
                    <span>{w.exercises?.length || 0} exercises</span>
                  </div>
                </div>
                {w.mood && <span className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded-full capitalize">{w.mood}</span>}
              </div>
              {w.exercises?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {w.exercises.map((ex, i) => (
                    <span key={i} className={`text-xs px-2.5 py-1 rounded-lg font-medium ${getCategoryColor(ex.category)}`}>
                      {ex.name}
                      {ex.sets && ex.reps ? ` · ${ex.sets}×${ex.reps}` : ''}
                      {ex.weight ? ` @ ${ex.weight}kg` : ''}
                      {ex.duration ? ` · ${ex.duration}min` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-2 px-4 disabled:opacity-40">Previous</button>
              <span className="text-dark-400 text-sm">{page} / {pagination.pages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary py-2 px-4 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Nutrition tab ──────────────────────────────────────────────────────────────
const NutritionTab = ({ userId }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    setLoading(true);
    adminAPI.getUserNutrition(userId, { page, limit: 10 })
      .then((r) => { setEntries(r.data.data); setPagination(r.data.pagination); })
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [userId, page]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <RiRestaurantLine className="text-4xl text-dark-700 mx-auto mb-2" />
          <p className="text-dark-500">No meals logged yet</p>
        </div>
      ) : (
        <>
          {entries.map((e) => (
            <div key={e._id} className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMealTypeIcon(e.mealType)}</span>
                  <div>
                    <p className="text-white font-medium capitalize">{e.mealType}</p>
                    <p className="text-dark-500 text-xs">{formatDate(e.date, 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-brand-400 font-bold">{Math.round(e.totalCalories)} kcal</p>
                  <p className="text-dark-500 text-xs">P:{Math.round(e.totalProtein)}g C:{Math.round(e.totalCarbs)}g F:{Math.round(e.totalFat)}g</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.foods.map((f, i) => (
                  <span key={i} className="text-xs bg-dark-700 text-dark-300 px-2.5 py-1 rounded-lg">
                    {f.name} · {f.calories} kcal
                  </span>
                ))}
              </div>
            </div>
          ))}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-2 px-4 disabled:opacity-40">Previous</button>
              <span className="text-dark-400 text-sm">{page} / {pagination.pages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary py-2 px-4 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Progress tab ───────────────────────────────────────────────────────────────
const ProgressTab = ({ userId }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminAPI.getUserProgress(userId)
      .then((r) => setEntries(r.data.data))
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <PageLoader />;

  const weightChart = {
    labels: [...entries].reverse().filter((e) => e.weight).map((e) => formatDate(e.date, 'MMM d')),
    datasets: [lineDataset('Weight (kg)', [...entries].reverse().filter((e) => e.weight).map((e) => e.weight), CHART_COLORS.green)],
  };

  const noLegend = { ...defaultChartOptions, plugins: { ...defaultChartOptions.plugins, legend: { display: false } } };

  return (
    <div className="space-y-5">
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <RiScalesLine className="text-4xl text-dark-700 mx-auto mb-2" />
          <p className="text-dark-500">No progress entries yet</p>
        </div>
      ) : (
        <>
          {entries.filter((e) => e.weight).length > 1 && (
            <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
              <p className="text-white font-semibold mb-3">Weight Over Time</p>
              <div className="h-48"><Line data={weightChart} options={noLegend} /></div>
            </div>
          )}
          <div className="space-y-3">
            {entries.map((e) => (
              <div key={e._id} className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-dark-400 text-xs">{formatDate(e.date, 'MMM d, yyyy')}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  {e.weight    && <span className="text-white"><span className="text-dark-400">Weight:</span> <strong>{e.weight} kg</strong></span>}
                  {e.bodyFat   && <span className="text-white"><span className="text-dark-400">Body Fat:</span> <strong>{e.bodyFat}%</strong></span>}
                  {e.measurements?.waist  && <span className="text-white"><span className="text-dark-400">Waist:</span> <strong>{e.measurements.waist}cm</strong></span>}
                  {e.measurements?.chest  && <span className="text-white"><span className="text-dark-400">Chest:</span> <strong>{e.measurements.chest}cm</strong></span>}
                  {e.measurements?.biceps && <span className="text-white"><span className="text-dark-400">Biceps:</span> <strong>{e.measurements.biceps}cm</strong></span>}
                </div>
                {e.notes && <p className="text-dark-500 text-xs mt-2 italic">"{e.notes}"</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Analytics tab ──────────────────────────────────────────────────────────────
const AnalyticsTab = ({ charts }) => {
  const noLegend = { ...defaultChartOptions, plugins: { ...defaultChartOptions.plugins, legend: { display: false } } };

  const calChart = {
    labels: charts?.calorieHistory?.map((d) => formatDate(d._id, 'MMM d')) || [],
    datasets: [lineDataset('Calories', charts?.calorieHistory?.map((d) => d.calories) || [], CHART_COLORS.orange)],
  };

  const macroChart = {
    labels: charts?.calorieHistory?.map((d) => formatDate(d._id, 'MMM d')) || [],
    datasets: [
      lineDataset('Protein', charts?.calorieHistory?.map((d) => d.protein) || [], CHART_COLORS.blue),
      lineDataset('Carbs',   charts?.calorieHistory?.map((d) => d.carbs)   || [], CHART_COLORS.orange),
      lineDataset('Fat',     charts?.calorieHistory?.map((d) => d.fat)     || [], CHART_COLORS.purple),
    ],
  };

  const freqChart = {
    labels: charts?.workoutFrequency?.map((d) => formatDate(d._id, 'MMM d')) || [],
    datasets: [barDataset('Workouts', charts?.workoutFrequency?.map((d) => d.count) || [], CHART_COLORS.green)],
  };

  const catChart = {
    labels: charts?.categoryBreakdown?.map((d) => d._id?.charAt(0).toUpperCase() + d._id?.slice(1)) || [],
    datasets: [{
      data: charts?.categoryBreakdown?.map((d) => d.count) || [],
      backgroundColor: [CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.orange, CHART_COLORS.purple, CHART_COLORS.yellow],
      borderColor: '#0f172a',
      borderWidth: 3,
    }],
  };

  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 12, boxWidth: 10 } },
      tooltip: defaultChartOptions.plugins.tooltip,
    },
  };

  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
          <p className="text-white font-semibold mb-3">Daily Calories (30 days)</p>
          {calChart.labels.length > 0 ? (
            <div className="h-48"><Line data={calChart} options={noLegend} /></div>
          ) : <div className="h-48 flex items-center justify-center"><p className="text-dark-500 text-sm">No data</p></div>}
        </div>

        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
          <p className="text-white font-semibold mb-3">Workout Frequency (30 days)</p>
          {freqChart.labels.length > 0 ? (
            <div className="h-48"><Bar data={freqChart} options={noLegend} /></div>
          ) : <div className="h-48 flex items-center justify-center"><p className="text-dark-500 text-sm">No data</p></div>}
        </div>

        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
          <p className="text-white font-semibold mb-3">Macros Breakdown</p>
          {macroChart.labels.length > 0 ? (
            <div className="h-48"><Line data={macroChart} options={defaultChartOptions} /></div>
          ) : <div className="h-48 flex items-center justify-center"><p className="text-dark-500 text-sm">No data</p></div>}
        </div>

        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
          <p className="text-white font-semibold mb-3">Exercise Categories</p>
          {catChart.labels.length > 0 ? (
            <div className="h-48"><Doughnut data={catChart} options={doughnutOpts} /></div>
          ) : <div className="h-48 flex items-center justify-center"><p className="text-dark-500 text-sm">No data</p></div>}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminUserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = useCallback(() => {
    setLoading(true);
    adminAPI.getUserProfile(id)
      .then((r) => setData(r.data.data))
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      await adminAPI.toggleStatus(id);
      toast.success(`User ${data.user.isActive ? 'deactivated' : 'activated'}`);
      fetchProfile();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRole = async () => {
    const newRole = data.user.role === 'admin' ? 'user' : 'admin';
    setActionLoading(true);
    try {
      await adminAPI.updateRole(id, newRole);
      toast.success(`Role changed to ${newRole}`);
      fetchProfile();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      navigate('/admin/users');
    } catch (e) {
      toast.error(getErrorMessage(e));
      setDeleteLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!data) return null;

  const { user, stats, charts } = data;

  const statItems = [
    { label: 'Total Workouts',   value: stats.totalWorkouts,                          unit: '',     color: 'text-orange-400', icon: RiRunLine },
    { label: 'Workout Time',     value: Math.round(stats.totalWorkoutMinutes / 60),   unit: 'hrs',  color: 'text-blue-400',   icon: RiTimeLine },
    { label: 'Calories Consumed',value: Math.round(stats.totalCaloriesConsumed).toLocaleString(), unit: 'kcal', color: 'text-brand-400', icon: RiFireLine },
    { label: 'Protein Total',    value: Math.round(stats.totalProtein),               unit: 'g',    color: 'text-blue-400',   icon: RiRestaurantLine },
    { label: 'Carbs Total',      value: Math.round(stats.totalCarbs),                 unit: 'g',    color: 'text-orange-400', icon: RiRestaurantLine },
    { label: 'Fat Total',        value: Math.round(stats.totalFat),                   unit: 'g',    color: 'text-purple-400', icon: RiRestaurantLine },
    { label: 'Current Weight',   value: stats.currentWeight ?? '—',                  unit: stats.currentWeight ? 'kg' : '', color: 'text-green-400', icon: RiScalesLine },
    { label: 'Body Fat',         value: stats.currentBodyFat ?? '—',                 unit: stats.currentBodyFat ? '%' : '', color: 'text-yellow-400', icon: RiScalesLine },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm">
        <RiArrowLeftLine /> Back to Users
      </button>

      {/* Profile header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 bg-brand-500/20 border-2 border-brand-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-brand-400 text-2xl font-bold">{getInitials(user.name)}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-white font-bold text-xl">{user.name}</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${user.role === 'admin' ? 'bg-red-500/10 text-red-400' : 'bg-dark-700 text-dark-300'}`}>
                {user.role === 'admin' ? '🛡 Admin' : '👤 User'}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${user.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {user.isActive ? '● Active' : '● Banned'}
              </span>
            </div>
            <p className="text-dark-400 text-sm">{user.email}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-dark-500">
              <span>Joined {formatDate(user.createdAt, 'MMMM d, yyyy')}</span>
              {user.profile?.goal && <span className="capitalize">Goal: {user.profile.goal.replace('_', ' ')}</span>}
              {user.profile?.activityLevel && <span className="capitalize">Activity: {user.profile.activityLevel}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button
              onClick={handleToggleRole}
              disabled={actionLoading}
              className="btn-secondary text-sm py-2 px-3 disabled:opacity-50"
            >
              <RiShieldLine className="text-yellow-400" />
              {user.role === 'admin' ? 'Demote' : 'Make Admin'}
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`text-sm py-2 px-3 rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50 ${
                user.isActive
                  ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20'
                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
              }`}
            >
              {user.isActive ? <><RiCloseLine /> Ban User</> : <><RiCheckLine /> Unban</>}
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="btn-danger text-sm py-2 px-3"
            >
              <RiDeleteBinLine /> Delete
            </button>
          </div>
        </div>

        {/* Profile details */}
        {user.profile && (
          <div className="mt-5 pt-5 border-t border-dark-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Age',    value: user.profile.age    ? `${user.profile.age} yrs`  : '—' },
              { label: 'Height', value: user.profile.height ? `${user.profile.height} cm` : '—' },
              { label: 'Weight', value: user.profile.weight ? `${user.profile.weight} kg` : '—' },
              { label: 'Units',  value: user.preferences?.units || 'metric' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-dark-500 text-xs uppercase tracking-wide">{label}</p>
                <p className="text-white font-medium mt-0.5 capitalize">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statItems.map(({ label, value, unit, color, icon: Icon }) => (
          <div key={label} className="card-sm">
            <Icon className={`${color} text-lg mb-2`} />
            <p className="text-dark-400 text-xs uppercase tracking-wide">{label}</p>
            <p className={`text-xl font-bold mt-0.5 ${color}`}>
              {value} {unit && <span className="text-sm text-dark-500 font-normal">{unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Tab active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={RiLineChartLine} label="Analytics" />
        <Tab active={activeTab === 'workouts'}  onClick={() => setActiveTab('workouts')}  icon={RiRunLine}       label={`Workouts (${stats.totalWorkouts})`} />
        <Tab active={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} icon={RiRestaurantLine} label={`Nutrition (${stats.totalNutrition})`} />
        <Tab active={activeTab === 'progress'}  onClick={() => setActiveTab('progress')}  icon={RiScalesLine}    label={`Progress (${stats.totalProgress})`} />
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'analytics' && <AnalyticsTab charts={charts} />}
        {activeTab === 'workouts'  && <WorkoutsTab  userId={id} />}
        {activeTab === 'nutrition' && <NutritionTab userId={id} />}
        {activeTab === 'progress'  && <ProgressTab  userId={id} />}
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete User"
        message={`Permanently delete ${user.name} and ALL their data? This cannot be undone.`}
        confirmText="Delete User"
      />
    </div>
  );
};

export default AdminUserProfile;
