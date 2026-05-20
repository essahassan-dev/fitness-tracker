import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine, RiRunLine, RiScalesLine, RiCalendarLine,
  RiLineChartLine, RiTimeLine, RiSendPlaneLine, RiChatCheckLine,
  RiAlertLine, RiThumbUpLine, RiEditLine,
} from 'react-icons/ri';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { trainerAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import { defaultChartOptions, lineDataset, CHART_COLORS } from '../../utils/chartConfig';
import '../../utils/chartConfig';

const TrainerClientDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progress');
  const [remarks, setRemarks] = useState([]);
  const [remarkForm, setRemarkForm] = useState({ message: '', type: 'feedback', relatedTo: '' });
  const [sendingRemark, setSendingRemark] = useState(false);

  useEffect(() => {
    trainerAPI.getUserProgress(userId)
      .then((res) => setData(res.data.data))
      .catch((err) => { toast.error(getErrorMessage(err)); navigate('/trainer'); })
      .finally(() => setLoading(false));
  }, [userId]);

  const fetchRemarks = () => {
    trainerAPI.getRemarks(userId)
      .then((res) => setRemarks(res.data.data))
      .catch(() => {});
  };

  useEffect(() => { fetchRemarks(); }, [userId]);

  const handleSendRemark = async (e) => {
    e.preventDefault();
    if (!remarkForm.message.trim()) return;
    setSendingRemark(true);
    try {
      await trainerAPI.sendRemark(userId, remarkForm);
      toast.success('Remark sent to client!');
      setRemarkForm({ message: '', type: 'feedback', relatedTo: '' });
      fetchRemarks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSendingRemark(false);
    }
  };

  const REMARK_TYPES = [
    { value: 'feedback',      label: 'Feedback',      icon: RiChatCheckLine,  color: 'text-blue-400 bg-blue-500/10' },
    { value: 'encouragement', label: 'Encouragement', icon: RiThumbUpLine,    color: 'text-green-400 bg-green-500/10' },
    { value: 'correction',    label: 'Correction',    icon: RiEditLine,       color: 'text-orange-400 bg-orange-500/10' },
    { value: 'warning',       label: 'Warning',       icon: RiAlertLine,      color: 'text-red-400 bg-red-500/10' },
  ];

  if (loading) return <PageLoader />;
  if (!data) return null;

  const { user, progressEntries, recentWorkouts, workoutCount, weightHistory } = data;

  const weightChart = {
    labels: weightHistory.map((e) => formatDate(e.date, 'MMM d')),
    datasets: [lineDataset('Weight (kg)', weightHistory.map((e) => e.weight), CHART_COLORS.green)],
  };

  const noLegend = { ...defaultChartOptions, plugins: { ...defaultChartOptions.plugins, legend: { display: false } } };

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/trainer')} className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm">
        <RiArrowLeftLine /> Back to Clients
      </button>

      {/* Client header */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-brand-400 text-xl font-bold">{getInitials(user.name)}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-xl">{user.name}</h2>
            <p className="text-dark-400 text-sm">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {user.profile?.goal && (
                <span className="text-xs bg-brand-500/10 text-brand-400 px-2.5 py-0.5 rounded-full capitalize">
                  {user.profile.goal.replace('_', ' ')}
                </span>
              )}
              {user.profile?.experienceLevel && (
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full capitalize">
                  {user.profile.experienceLevel}
                </span>
              )}
              {user.profile?.activityLevel && (
                <span className="text-xs bg-dark-700 text-dark-300 px-2.5 py-0.5 rounded-full capitalize">
                  {user.profile.activityLevel.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-dark-800">
          {[
            { label: 'Total Workouts', value: workoutCount, icon: RiRunLine, color: 'text-orange-400' },
            { label: 'Current Weight', value: progressEntries[0]?.weight ? `${progressEntries[0].weight} kg` : '—', icon: RiScalesLine, color: 'text-brand-400' },
            { label: 'Body Fat', value: progressEntries[0]?.bodyFat ? `${progressEntries[0].bodyFat}%` : '—', icon: RiLineChartLine, color: 'text-purple-400' },
            { label: 'Joined', value: formatDate(user.createdAt, 'MMM yyyy'), icon: RiCalendarLine, color: 'text-blue-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-dark-800/50 rounded-xl p-3">
              <Icon className={`${color} text-lg mb-1`} />
              <p className="text-dark-400 text-xs">{label}</p>
              <p className={`font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'progress', label: 'Progress' },
          { key: 'workouts', label: 'Workouts' },
          { key: 'remarks',  label: `Remarks (${remarks.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Progress tab */}
      {activeTab === 'progress' && (
        <div className="space-y-5">
          {weightHistory.length > 1 && (
            <div className="card">
              <h3 className="text-white font-semibold mb-4">Weight Progress</h3>
              <div className="h-52">
                <Line data={weightChart} options={noLegend} />
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-white font-semibold mb-4">Progress History</h3>
            {progressEntries.length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-8">No progress entries yet</p>
            ) : (
              <div className="space-y-3">
                {progressEntries.map((entry) => (
                  <div key={entry._id} className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50">
                    <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <RiScalesLine className="text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-3 text-sm">
                        {entry.weight && <span className="text-white font-semibold">{entry.weight} kg</span>}
                        {entry.bodyFat && <span className="text-orange-400">{entry.bodyFat}% BF</span>}
                        {entry.measurements?.waist && <span className="text-dark-400 text-xs">Waist: {entry.measurements.waist}cm</span>}
                        {entry.measurements?.chest && <span className="text-dark-400 text-xs">Chest: {entry.measurements.chest}cm</span>}
                      </div>
                      <p className="text-dark-500 text-xs mt-0.5">{formatDate(entry.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workouts tab */}
      {activeTab === 'workouts' && (
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Recent Workouts</h3>
          {recentWorkouts.length === 0 ? (
            <p className="text-dark-500 text-sm text-center py-8">No workouts logged yet</p>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.map((w) => (
                <div key={w._id} className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50">
                  <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <RiRunLine className="text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{w.title}</p>
                    <div className="flex items-center gap-3 text-xs text-dark-500 mt-0.5">
                      <span>{w.exercises?.length || 0} exercises</span>
                      {w.duration && <span className="flex items-center gap-1"><RiTimeLine />{w.duration} min</span>}
                      {w.caloriesBurned > 0 && <span className="text-brand-400">🔥 {w.caloriesBurned} kcal</span>}
                    </div>
                  </div>
                  <p className="text-dark-500 text-xs flex-shrink-0">{formatDate(w.date)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Remarks tab */}
      {activeTab === 'remarks' && (
        <div className="space-y-5">
          {/* Send remark form */}
          <div className="card">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <RiSendPlaneLine className="text-brand-400" /> Send Remark to {data.user.name}
            </h3>
            <form onSubmit={handleSendRemark} className="space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {REMARK_TYPES.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRemarkForm({ ...remarkForm, type: value })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      remarkForm.type === value
                        ? `${color} border-current`
                        : 'bg-dark-800/50 border-dark-700 text-dark-400 hover:text-white'
                    }`}
                  >
                    <Icon className="text-base flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
              <div>
                <label className="label">Related to (optional)</label>
                <input
                  value={remarkForm.relatedTo}
                  onChange={(e) => setRemarkForm({ ...remarkForm, relatedTo: e.target.value })}
                  placeholder="e.g. Bench Press, Leg Day..."
                  className="input"
                />
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea
                  value={remarkForm.message}
                  onChange={(e) => setRemarkForm({ ...remarkForm, message: e.target.value })}
                  placeholder="Write your feedback, correction or encouragement..."
                  rows={3}
                  className="textarea"
                  required
                />
              </div>
              <button type="submit" disabled={sendingRemark} className="btn-primary">
                {sendingRemark ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <><RiSendPlaneLine /> Send Remark</>
                )}
              </button>
            </form>
          </div>

          {/* Remarks history */}
          <div className="card">
            <h3 className="text-white font-semibold mb-4">Remark History</h3>
            {remarks.length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-8">No remarks sent yet</p>
            ) : (
              <div className="space-y-3">
                {remarks.map((r) => {
                  const typeInfo = REMARK_TYPES.find((t) => t.value === r.type) || REMARK_TYPES[0];
                  const Icon = typeInfo.icon;
                  return (
                    <div key={r._id} className={`p-4 rounded-xl border ${typeInfo.color} border-current/20`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="text-base" />
                          <span className="text-sm font-medium capitalize">{r.type}</span>
                          {r.relatedTo && (
                            <span className="text-xs bg-dark-800 text-dark-400 px-2 py-0.5 rounded-lg">{r.relatedTo}</span>
                          )}
                        </div>
                        <span className="text-dark-500 text-xs">{formatDate(r.createdAt, 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="text-white text-sm">{r.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerClientDetail;
