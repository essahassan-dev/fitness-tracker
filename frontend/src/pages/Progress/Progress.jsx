import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine, RiScalesLine,
  RiRulerLine, RiCalendarLine, RiSparklingLine, RiRefreshLine,
} from 'react-icons/ri';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { progressAPI, aiAPI } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import ExportButton from '../../components/UI/ExportButton';
import { exportProgressPDF, exportProgressCSV } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/UI/Modal';
import { defaultChartOptions, lineDataset, CHART_COLORS } from '../../utils/chartConfig';
import '../../utils/chartConfig';

const ProgressForm = ({ isOpen, onClose, onSuccess, entry }) => {
  const isEdit = !!entry;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '', bodyFat: '',
    measurements: { chest: '', waist: '', hips: '', biceps: '', thighs: '' },
    notes: '',
  });

  useEffect(() => {
    if (entry) {
      setForm({
        date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        weight: entry.weight || '',
        bodyFat: entry.bodyFat || '',
        measurements: {
          chest: entry.measurements?.chest || '',
          waist: entry.measurements?.waist || '',
          hips: entry.measurements?.hips || '',
          biceps: entry.measurements?.biceps || '',
          thighs: entry.measurements?.thighs || '',
        },
        notes: entry.notes || '',
      });
    } else {
      setForm({
        date: new Date().toISOString().split('T')[0],
        weight: '', bodyFat: '',
        measurements: { chest: '', waist: '', hips: '', biceps: '', thighs: '' },
        notes: '',
      });
    }
  }, [entry, isOpen]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleMeasurement = (e) => setForm({
    ...form,
    measurements: { ...form.measurements, [e.target.name]: e.target.value },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        date: form.date,
        weight: form.weight ? Number(form.weight) : null,
        bodyFat: form.bodyFat ? Number(form.bodyFat) : null,
        measurements: Object.fromEntries(
          Object.entries(form.measurements).map(([k, v]) => [k, v ? Number(v) : null])
        ),
        notes: form.notes,
      };

      if (isEdit) {
        await progressAPI.update(entry._id, payload);
        toast.success('Progress updated!');
      } else {
        await progressAPI.create(payload);
        toast.success('Progress logged! 📈');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Progress' : 'Log Progress'} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Date</label>
          <input type="date" name="date" value={form.date} onChange={handleChange} className="input" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" name="weight" value={form.weight} onChange={handleChange} placeholder="70.5" min="0" step="0.1" className="input" />
          </div>
          <div>
            <label className="label">Body Fat (%)</label>
            <input type="number" name="bodyFat" value={form.bodyFat} onChange={handleChange} placeholder="15.0" min="0" max="100" step="0.1" className="input" />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-white mb-3 block">Measurements (cm)</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(form.measurements).map((key) => (
              <div key={key}>
                <label className="label capitalize">{key}</label>
                <input
                  type="number"
                  name={key}
                  value={form.measurements[key]}
                  onChange={handleMeasurement}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="input"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="How are you feeling?" rows={2} className="textarea" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : isEdit ? 'Update' : 'Log Progress'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── AI Progress Prediction Component ──────────────────────────────────────────
const AIPrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [fetched, setFetched]       = useState(false);

  const renderText = (text) => text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>');

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.predictProgress();
      setPrediction(res.data.prediction);
      setStats(res.data.stats);
      setFetched(true);
    } catch (err) {
      toast.error('Could not generate prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
            <RiSparklingLine className="text-purple-400 text-lg" />
          </div>
          <div>
            <h2 className="text-white font-semibold">AI Progress Prediction</h2>
            <p className="text-dark-400 text-xs mt-0.5">Based on your last 30 days activity</p>
          </div>
        </div>
        <button
          onClick={fetchPrediction}
          disabled={loading}
          className="btn-secondary text-sm"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><RiSparklingLine /> {fetched ? 'Refresh' : 'Predict'}</>}
        </button>
      </div>

      {!fetched && !loading && (
        <div className="text-center py-8">
          <RiSparklingLine className="text-4xl text-dark-700 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">Click "Predict" to get your personalized 30-day progress forecast</p>
          <p className="text-dark-600 text-xs mt-1">Based on your workouts, nutrition, attendance, and goals</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-6 justify-center">
          <span className="w-6 h-6 border-2 border-dark-700 border-t-purple-400 rounded-full animate-spin" />
          <span className="text-dark-400 text-sm">Analyzing your data...</span>
        </div>
      )}

      {prediction && !loading && (
        <div className="space-y-4">
          {/* Stats used */}
          {stats && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { label: 'Workouts', value: stats.workoutCount },
                { label: 'Attendance', value: stats.attendanceCount },
                { label: 'Avg Calories', value: `${stats.avgCal} kcal` },
                { label: 'Avg Protein', value: `${stats.avgProtein}g` },
                { label: 'Cal Burned', value: `${stats.calBurned?.toLocaleString()} kcal` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-dark-800/50 rounded-xl p-2.5 text-center">
                  <p className="text-white font-semibold text-sm">{value}</p>
                  <p className="text-dark-500 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* AI prediction text */}
          <div
            className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 text-sm text-dark-200 leading-relaxed space-y-2"
            dangerouslySetInnerHTML={{ __html: renderText(prediction) }}
          />

          <p className="text-dark-600 text-xs text-center">
            Prediction based on your data — results vary based on consistency and adherence
          </p>
        </div>
      )}
    </div>
  );
};

const Progress = () => {
  const { user } = useAuth();
  const location  = useLocation();
  const [entries, setEntries] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('90');
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleExportPDF = async () => {
    try {
      const res = await progressAPI.getAll({ limit: 1000 });
      exportProgressPDF(res.data.data, user?.name);
      toast.success('PDF downloaded!');
    } catch { toast.error('Export failed'); }
  };

  const handleExportCSV = async () => {
    try {
      const res = await progressAPI.getAll({ limit: 1000 });
      exportProgressCSV(res.data.data);
      toast.success('CSV downloaded!');
    } catch { toast.error('Export failed'); }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, chartRes] = await Promise.all([
        progressAPI.getAll({ limit: 20 }),
        progressAPI.getChart({ period }),
      ]);
      setEntries(entriesRes.data.data);
      setChartData(chartRes.data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData, location.pathname]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await progressAPI.delete(deleteId);
      toast.success('Entry deleted');
      setDeleteId(null);
      fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  const weightChartData = {
    labels: chartData?.weightData?.map((d) => formatDate(d.date, 'MMM d')) || [],
    datasets: [lineDataset('Weight (kg)', chartData?.weightData?.map((d) => d.value) || [], CHART_COLORS.green)],
  };

  const bodyFatChartData = {
    labels: chartData?.bodyFatData?.map((d) => formatDate(d.date, 'MMM d')) || [],
    datasets: [lineDataset('Body Fat (%)', chartData?.bodyFatData?.map((d) => d.value) || [], CHART_COLORS.orange)],
  };

  const chartOptions = {
    ...defaultChartOptions,
    plugins: { ...defaultChartOptions.plugins, legend: { display: false } },
  };

  const latest = entries[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Progress</h1>
          <p className="page-subtitle">Track your body measurements and weight over time</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onExportPDF={handleExportPDF} onExportCSV={handleExportCSV} label="Export" />
          <button onClick={() => setShowForm(true)} className="btn-primary flex-shrink-0">
            <RiAddLine className="text-lg" /> Log Progress
          </button>
        </div>
      </div>

      {/* Latest stats */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Weight', value: latest.weight, unit: 'kg', icon: RiScalesLine, color: 'text-brand-400' },
            { label: 'Body Fat', value: latest.bodyFat, unit: '%', icon: RiRulerLine, color: 'text-orange-400' },
            { label: 'Waist', value: latest.measurements?.waist, unit: 'cm', icon: RiRulerLine, color: 'text-blue-400' },
            { label: 'Chest', value: latest.measurements?.chest, unit: 'cm', icon: RiRulerLine, color: 'text-purple-400' },
          ].map(({ label, value, unit, icon: Icon, color }) => (
            <div key={label} className="card-sm">
              <p className="text-dark-400 text-xs uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>
                {value ?? '—'} {value ? <span className="text-sm text-dark-500 font-normal">{unit}</span> : ''}
              </p>
              <p className="text-dark-600 text-xs mt-1">Latest entry</p>
            </div>
          ))}
        </div>
      )}

      {/* ── AI Progress Prediction ── */}
      <AIPrediction />

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-dark-400 text-sm">Period:</span>
        {[
          { label: '30 days', value: '30' },
          { label: '90 days', value: '90' },
          { label: '6 months', value: '180' },
          { label: '1 year', value: '365' },
        ].map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              period === value ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Charts */}
      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-white font-semibold mb-4">Weight Progress</h2>
              {chartData?.weightData?.length > 0 ? (
                <div className="h-52">
                  <Line data={weightChartData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center">
                  <p className="text-dark-500 text-sm">No weight data yet</p>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-white font-semibold mb-4">Body Fat Progress</h2>
              {chartData?.bodyFatData?.length > 0 ? (
                <div className="h-52">
                  <Line data={bodyFatChartData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center">
                  <p className="text-dark-500 text-sm">No body fat data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4">History</h2>
            {entries.length === 0 ? (
              <EmptyState
                icon={RiScalesLine}
                title="No progress entries"
                description="Start logging your weight and measurements to track your progress"
                action={
                  <button onClick={() => setShowForm(true)} className="btn-primary">
                    <RiAddLine /> Log First Entry
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry._id} className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors group">
                    <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <RiScalesLine className="text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        {entry.weight && <span className="text-white font-semibold text-sm">{entry.weight} kg</span>}
                        {entry.bodyFat && <span className="text-orange-400 text-sm">{entry.bodyFat}% BF</span>}
                        {entry.measurements?.waist && <span className="text-dark-400 text-xs">Waist: {entry.measurements.waist}cm</span>}
                        {entry.measurements?.chest && <span className="text-dark-400 text-xs">Chest: {entry.measurements.chest}cm</span>}
                      </div>
                      <p className="text-dark-500 text-xs mt-0.5 flex items-center gap-1">
                        <RiCalendarLine /> {formatDate(entry.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditEntry(entry); setShowForm(true); }}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                      >
                        <RiEditLine />
                      </button>
                      <button
                        onClick={() => setDeleteId(entry._id)}
                        className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <RiDeleteBinLine />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ProgressForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditEntry(null); }}
        onSuccess={fetchData}
        entry={editEntry}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Entry"
        message="Are you sure you want to delete this progress entry?"
      />
    </div>
  );
};

export default Progress;
