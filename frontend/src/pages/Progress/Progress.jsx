import React, { useState, useEffect, useCallback } from 'react';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine, RiScalesLine,
  RiRulerLine, RiCalendarLine,
} from 'react-icons/ri';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { progressAPI } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
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

const Progress = () => {
  const [entries, setEntries] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('90');
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  useEffect(() => { fetchData(); }, [fetchData]);

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
        <button onClick={() => setShowForm(true)} className="btn-primary flex-shrink-0">
          <RiAddLine className="text-lg" /> Log Progress
        </button>
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
