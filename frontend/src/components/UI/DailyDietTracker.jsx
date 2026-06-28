import React, { useState, useEffect } from 'react';
import {
  RiCheckLine, RiSunFoggyLine, RiSunLine, RiMoonLine,
  RiAppleLine, RiRestaurantLine, RiAddLine, RiFireLine,
  RiFlashlightLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { dailyDietAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const MEAL_ICONS = {
  breakfast: RiSunFoggyLine,
  lunch:     RiSunLine,
  dinner:    RiMoonLine,
  snack:     RiAppleLine,
};

const MEAL_COLORS = {
  breakfast: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  lunch:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  dinner:    'text-blue-400  bg-blue-500/10  border-blue-500/20',
  snack:     'text-green-400 bg-green-500/10 border-green-500/20',
};

const DailyDietTracker = ({ dietPlanId, planName, onComplete }) => {
  const [plan, setPlan]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [starting, setStarting] = useState(false);
  const [toggling, setToggling] = useState(null);

  const fetchToday = async () => {
    try {
      const res = await dailyDietAPI.getToday();
      // Only show if it's from this diet plan
      if (res.data.data?.dietPlanId?.toString() === dietPlanId ||
          res.data.data?.dietPlanId === dietPlanId) {
        setPlan(res.data.data);
      } else {
        setPlan(null);
      }
    } catch { setPlan(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchToday(); }, [dietPlanId]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await dailyDietAPI.start(dietPlanId);
      setPlan(res.data.data);
      toast.success(`"${planName}" started for today!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  const handleToggle = async (mealIdx) => {
    setToggling(mealIdx);
    try {
      const res = await dailyDietAPI.toggleMeal(plan._id, mealIdx);
      setPlan(res.data.data);

      const meal = res.data.data.meals[mealIdx];
      if (meal.completed && res.data.autoLoggedNutrition) {
        toast.success(
          `${meal.name} logged! +${res.data.autoLoggedNutrition.calories} kcal, ${res.data.autoLoggedNutrition.protein}g protein`,
          { duration: 4000 }
        );
      }

      if (res.data.allMealsComplete) {
        toast.success('All meals complete! Dashboard updated.', { duration: 4000 });
        onComplete?.();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  if (loading) return null;

  const completedCount = plan?.meals?.filter((m) => m.completed).length || 0;
  const totalMeals     = plan?.meals?.length || 0;
  const totalCalories  = plan?.meals?.filter((m) => m.completed).reduce((s, m) => s + m.calories, 0) || 0;
  const totalProtein   = plan?.meals?.filter((m) => m.completed).reduce((s, m) => s + m.protein, 0) || 0;

  if (!plan) {
    return (
      <div className="mt-3 pt-3 border-t border-dark-800">
        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 text-sm font-medium transition-all"
        >
          {starting ? (
            <span className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
          ) : (
            <RiAddLine />
          )}
          Follow this plan today
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-dark-800 space-y-3">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-dark-400">Today's progress</span>
          <span className="text-white font-medium">{completedCount}/{totalMeals} meals</span>
        </div>
        <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-700"
            style={{ width: `${totalMeals > 0 ? (completedCount / totalMeals) * 100 : 0}%` }}
          />
        </div>
        {completedCount > 0 && (
          <div className="flex gap-3 mt-1.5 text-xs">
            <span className="text-orange-400 flex items-center gap-1">
              <RiFireLine className="text-xs" /> {totalCalories} kcal
            </span>
            <span className="text-blue-400">{totalProtein}g protein</span>
          </div>
        )}
      </div>

      {/* Meal checkboxes */}
      <div className="space-y-2">
        {plan.meals.map((meal, idx) => {
          const Icon  = MEAL_ICONS[meal.mealType]  || RiRestaurantLine;
          const color = MEAL_COLORS[meal.mealType] || 'text-dark-400 bg-dark-800 border-dark-700';
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                meal.completed
                  ? 'bg-brand-500/5 border-brand-500/20'
                  : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggle(idx)}
                disabled={toggling === idx}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  meal.completed
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'border-dark-600 hover:border-brand-500'
                }`}
              >
                {toggling === idx ? (
                  <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                ) : meal.completed ? (
                  <RiCheckLine className="text-xs" />
                ) : null}
              </button>

              {/* Meal icon */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${color}`}>
                <Icon className="text-sm" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${meal.completed ? 'line-through text-dark-500' : 'text-white'}`}>
                  {meal.name}
                </p>
                <p className="text-dark-500 text-xs capitalize">
                  {meal.mealType} · {meal.calories} kcal · P:{meal.protein}g
                </p>
              </div>

              {meal.completed && (
                <span className="text-brand-400 text-xs flex-shrink-0 flex items-center gap-1">
                  <RiCheckLine /> Done
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyDietTracker;
