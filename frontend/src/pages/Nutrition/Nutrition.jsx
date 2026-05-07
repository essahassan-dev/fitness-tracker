import React, { useState, useEffect, useCallback } from 'react';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine, RiRestaurantLine,
  RiCalendarLine, RiFireLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { nutritionAPI } from '../../services/api';
import { formatDate, getMealTypeColor, getMealTypeIcon, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import NutritionForm from './NutritionForm';

const MEAL_TYPES = ['all', 'breakfast', 'lunch', 'dinner', 'snack'];

const Nutrition = () => {
  const [entries, setEntries] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, summaryRes] = await Promise.all([
        nutritionAPI.getAll({ date: selectedDate, mealType }),
        nutritionAPI.getDaily({ date: selectedDate }),
      ]);
      setEntries(entriesRes.data.data);
      setDailySummary(summaryRes.data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [selectedDate, mealType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await nutritionAPI.delete(deleteId);
      toast.success('Meal deleted');
      setDeleteId(null);
      fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  const calorieGoal = 2000;
  const caloriePercent = Math.min(((dailySummary?.totalCalories || 0) / calorieGoal) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Nutrition</h1>
          <p className="page-subtitle">Track your daily food intake and macros</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex-shrink-0">
          <RiAddLine className="text-lg" /> Log Meal
        </button>
      </div>

      {/* Daily Summary */}
      {dailySummary && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Daily Summary</h2>
            <div className="flex items-center gap-2">
              <RiCalendarLine className="text-dark-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-dark-800 border border-dark-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>

          {/* Calorie progress */}
          <div className="mb-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-dark-300 flex items-center gap-1.5">
                <RiFireLine className="text-orange-400" /> Calories
              </span>
              <span className="text-white font-semibold">
                {Math.round(dailySummary.totalCalories)} <span className="text-dark-500 font-normal">/ {calorieGoal} kcal</span>
              </span>
            </div>
            <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${caloriePercent >= 100 ? 'bg-red-500' : 'bg-brand-500'}`}
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
            <p className="text-dark-500 text-xs mt-1">{Math.round(calorieGoal - dailySummary.totalCalories)} kcal remaining</p>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Protein', value: dailySummary.totalProtein, goal: 150, color: 'bg-blue-500', textColor: 'text-blue-400' },
              { label: 'Carbs', value: dailySummary.totalCarbs, goal: 250, color: 'bg-orange-500', textColor: 'text-orange-400' },
              { label: 'Fat', value: dailySummary.totalFat, goal: 65, color: 'bg-purple-500', textColor: 'text-purple-400' },
            ].map(({ label, value, goal, color, textColor }) => (
              <div key={label} className="bg-dark-800/50 rounded-xl p-3">
                <p className={`text-lg font-bold ${textColor}`}>{Math.round(value)}g</p>
                <p className="text-dark-500 text-xs">{label}</p>
                <div className="h-1.5 bg-dark-700 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full`}
                    style={{ width: `${Math.min((value / goal) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-dark-600 text-xs mt-1">Goal: {goal}g</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {MEAL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              mealType === type
                ? 'bg-brand-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            {type === 'all' ? 'All Meals' : `${getMealTypeIcon(type)} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <PageLoader />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={RiRestaurantLine}
          title="No meals logged"
          description={`No ${mealType === 'all' ? '' : mealType + ' '}meals for ${formatDate(selectedDate)}`}
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <RiAddLine /> Log First Meal
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry._id} className="card p-4 hover:border-dark-700 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0 mt-0.5">{getMealTypeIcon(entry.mealType)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getMealTypeColor(entry.mealType)}`}>
                          {entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1)}
                        </span>
                        <span className="text-dark-500 text-xs">{formatDate(entry.date, 'h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">{Math.round(entry.totalCalories)} kcal</span>
                        <span className="text-dark-500 text-xs">P: {Math.round(entry.totalProtein)}g</span>
                        <span className="text-dark-500 text-xs">C: {Math.round(entry.totalCarbs)}g</span>
                        <span className="text-dark-500 text-xs">F: {Math.round(entry.totalFat)}g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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

                  {/* Food items */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {entry.foods.map((food, i) => (
                      <span key={i} className="text-xs bg-dark-800 text-dark-300 px-2.5 py-1 rounded-lg">
                        {food.name} {food.quantity > 1 ? `×${food.quantity}` : ''} · {food.calories} kcal
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NutritionForm
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
        title="Delete Meal"
        message="Are you sure you want to delete this meal entry?"
      />
    </div>
  );
};

export default Nutrition;
