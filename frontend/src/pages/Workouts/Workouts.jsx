import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  RiAddLine, RiSearchLine, RiEditLine, RiDeleteBinLine,
  RiRunLine, RiFilterLine, RiTimeLine, RiFireLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { workoutAPI } from '../../services/api';
import { formatDate, getCategoryColor, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import Badge from '../../components/UI/Badge';
import WorkoutForm from './WorkoutForm';
import ExportButton from '../../components/UI/ExportButton';
import { exportWorkoutsPDF, exportWorkoutsCSV } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['all', 'strength', 'cardio', 'flexibility', 'sports', 'other'];

const Workouts = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editWorkout, setEditWorkout] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Export all workouts (fetch without pagination limit)
  const handleExportPDF = async () => {
    try {
      const res = await workoutAPI.getAll({ limit: 1000, sort: '-date' });
      exportWorkoutsPDF(res.data.data, user?.name);
      toast.success('PDF downloaded!');
    } catch { toast.error('Export failed'); }
  };

  const handleExportCSV = async () => {
    try {
      const res = await workoutAPI.getAll({ limit: 1000, sort: '-date' });
      exportWorkoutsCSV(res.data.data);
      toast.success('CSV downloaded!');
    } catch { toast.error('Export failed'); }
  };

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workoutAPI.getAll({ page, limit: 10, search, category });
      setWorkouts(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    const timer = setTimeout(fetchWorkouts, 300);
    return () => clearTimeout(timer);
  }, [fetchWorkouts]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await workoutAPI.delete(deleteId);
      toast.success('Workout deleted');
      setDeleteId(null);
      fetchWorkouts();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (workout) => {
    setEditWorkout(workout);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditWorkout(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Workouts</h1>
          <p className="page-subtitle">Track and manage your training sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onExportPDF={handleExportPDF} onExportCSV={handleExportCSV} label="Export" />
          <button onClick={() => setShowForm(true)} className="btn-primary flex-shrink-0">
            <RiAddLine className="text-lg" /> Log Workout
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search workouts..."
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <RiFilterLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="select pl-10 w-full sm:w-44"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={RiRunLine}
          title="No workouts found"
          description={search || category !== 'all' ? 'Try adjusting your filters' : 'Log your first workout to get started'}
          action={
            !search && category === 'all' && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <RiAddLine /> Log First Workout
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <div key={workout._id} className="card p-4 hover:border-dark-700 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <RiRunLine className="text-brand-400 text-lg" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-white font-semibold">{workout.title}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-dark-400 text-xs">{formatDate(workout.date)}</span>
                        {workout.duration && (
                          <span className="text-dark-400 text-xs flex items-center gap-1">
                            <RiTimeLine /> {workout.duration} min
                          </span>
                        )}
                        {workout.caloriesBurned > 0 && (
                  <span className="text-brand-400 text-xs font-semibold flex items-center gap-1">
                    <RiFireLine className="text-xs" /> {workout.caloriesBurned} kcal burned
                  </span>
                )}
                        {workout.mood && (
                          <span className="text-xs bg-dark-800 text-dark-400 px-2 py-0.5 rounded-lg capitalize">{workout.mood}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(workout)}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <RiEditLine />
                      </button>
                      <button
                        onClick={() => setDeleteId(workout._id)}
                        className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <RiDeleteBinLine />
                      </button>
                    </div>
                  </div>

                  {/* Exercises */}
                  {workout.exercises?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {workout.exercises.slice(0, 4).map((ex, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium ${getCategoryColor(ex.category)}`}
                        >
                          {ex.name}
                          {ex.sets && ex.reps ? ` · ${ex.sets}×${ex.reps}` : ''}
                          {ex.weight ? ` @ ${ex.weight}kg` : ''}
                        </span>
                      ))}
                      {workout.exercises.length > 4 && (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-dark-800 text-dark-400">
                          +{workout.exercises.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {workout.notes && (
                    <p className="text-dark-500 text-xs mt-2 italic">"{workout.notes}"</p>
                  )}                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-2 px-4 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-dark-400 text-sm px-2">
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-secondary py-2 px-4 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <WorkoutForm
        isOpen={showForm}
        onClose={handleFormClose}
        onSuccess={fetchWorkouts}
        workout={editWorkout}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This action cannot be undone."
      />
    </div>
  );
};

export default Workouts;
