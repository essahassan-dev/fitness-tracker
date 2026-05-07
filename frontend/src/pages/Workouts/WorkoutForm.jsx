import React, { useState, useEffect } from 'react';
import { RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import { workoutAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import Modal from '../../components/UI/Modal';

const CATEGORIES = ['strength', 'cardio', 'flexibility', 'sports', 'other'];
const MOODS = ['great', 'good', 'okay', 'tired', 'bad'];

const emptyExercise = () => ({
  name: '', category: 'strength', sets: '', reps: '', weight: '', duration: '', distance: '', notes: '',
});

const WorkoutForm = ({ isOpen, onClose, onSuccess, workout }) => {
  const isEdit = !!workout;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    mood: '',
    notes: '',
    exercises: [emptyExercise()],
  });

  useEffect(() => {
    if (workout) {
      setForm({
        title: workout.title || '',
        date: workout.date ? new Date(workout.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        duration: workout.duration || '',
        mood: workout.mood || '',
        notes: workout.notes || '',
        exercises: workout.exercises?.length > 0
          ? workout.exercises.map((e) => ({
              name: e.name || '',
              category: e.category || 'strength',
              sets: e.sets || '',
              reps: e.reps || '',
              weight: e.weight || '',
              duration: e.duration || '',
              distance: e.distance || '',
              notes: e.notes || '',
            }))
          : [emptyExercise()],
      });
    } else {
      setForm({
        title: '',
        date: new Date().toISOString().split('T')[0],
        duration: '',
        mood: '',
        notes: '',
        exercises: [emptyExercise()],
      });
    }
  }, [workout, isOpen]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleExerciseChange = (idx, field, value) => {
    const updated = [...form.exercises];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, exercises: updated });
  };

  const addExercise = () => setForm({ ...form, exercises: [...form.exercises, emptyExercise()] });

  const removeExercise = (idx) => {
    if (form.exercises.length === 1) return;
    setForm({ ...form, exercises: form.exercises.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Workout title is required'); return; }
    if (form.exercises.some((ex) => !ex.name.trim())) { toast.error('All exercises need a name'); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        duration: form.duration ? Number(form.duration) : null,
        exercises: form.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets ? Number(ex.sets) : null,
          reps: ex.reps ? Number(ex.reps) : null,
          weight: ex.weight ? Number(ex.weight) : null,
          duration: ex.duration ? Number(ex.duration) : null,
          distance: ex.distance ? Number(ex.distance) : null,
        })),
      };

      if (isEdit) {
        await workoutAPI.update(workout._id, payload);
        toast.success('Workout updated!');
      } else {
        await workoutAPI.create(payload);
        toast.success('Workout logged! 💪');
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Workout' : 'Log Workout'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Workout Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Morning Push Day"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Duration (min)</label>
            <input
              type="number"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="60"
              min="1"
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Mood</label>
            <select name="mood" value={form.mood} onChange={handleChange} className="select">
              <option value="">Select mood</option>
              {MOODS.map((m) => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <input
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Optional notes..."
              className="input"
            />
          </div>
        </div>

        {/* Exercises */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-white">Exercises</label>
            <button type="button" onClick={addExercise} className="btn-secondary text-xs py-1.5 px-3">
              <RiAddLine /> Add Exercise
            </button>
          </div>

          <div className="space-y-4">
            {form.exercises.map((ex, idx) => (
              <div key={idx} className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-dark-400 text-xs font-medium uppercase tracking-wide">Exercise {idx + 1}</span>
                  {form.exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(idx)}
                      className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <RiDeleteBinLine />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <input
                      value={ex.name}
                      onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)}
                      placeholder="Exercise name *"
                      className="input text-sm"
                      required
                    />
                  </div>
                  <div>
                    <select
                      value={ex.category}
                      onChange={(e) => handleExerciseChange(idx, 'category', e.target.value)}
                      className="select text-sm"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {ex.category === 'cardio' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={ex.duration}
                      onChange={(e) => handleExerciseChange(idx, 'duration', e.target.value)}
                      placeholder="Duration (min)"
                      min="0"
                      className="input text-sm"
                    />
                    <input
                      type="number"
                      value={ex.distance}
                      onChange={(e) => handleExerciseChange(idx, 'distance', e.target.value)}
                      placeholder="Distance (km)"
                      min="0"
                      step="0.1"
                      className="input text-sm"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => handleExerciseChange(idx, 'sets', e.target.value)}
                      placeholder="Sets"
                      min="0"
                      className="input text-sm"
                    />
                    <input
                      type="number"
                      value={ex.reps}
                      onChange={(e) => handleExerciseChange(idx, 'reps', e.target.value)}
                      placeholder="Reps"
                      min="0"
                      className="input text-sm"
                    />
                    <input
                      type="number"
                      value={ex.weight}
                      onChange={(e) => handleExerciseChange(idx, 'weight', e.target.value)}
                      placeholder="Weight (kg)"
                      min="0"
                      step="0.5"
                      className="input text-sm"
                    />
                  </div>
                )}

                <input
                  value={ex.notes}
                  onChange={(e) => handleExerciseChange(idx, 'notes', e.target.value)}
                  placeholder="Notes (optional)"
                  className="input text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : isEdit ? 'Update Workout' : 'Log Workout'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default WorkoutForm;
