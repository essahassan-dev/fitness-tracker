import React, { useState, useEffect, useCallback } from 'react';
import {
  RiRefreshLine, RiCheckLine, RiCalendarLine,
  RiRunLine, RiTimeLine, RiMoonLine, RiTrophyLine,
  RiInformationLine, RiArrowRightLine, RiSettings3Line,
  RiFireLine, RiFlashlightLine, RiBuilding2Line, RiGridLine, RiHomeLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { weeklyPlanAPI, dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import { getErrorMessage } from '../../utils/helpers';
import { format } from 'date-fns';

const EQUIPMENT_OPTIONS = [
  {
    key: 'MACHINE',
    label: 'Gym Machines',
    Icon: RiBuilding2Line,
    desc: 'Full gym access — barbells, machines, cables',
    examples: 'Bench Press, Deadlift, Leg Press',
  },
  {
    key: 'EQUIPMENT',
    label: 'Dumbbells / Bands',
    Icon: RiGridLine,
    desc: 'Dumbbells, barbells, resistance bands',
    examples: 'Dumbbell Press, Goblet Squat, Band Rows',
  },
  {
    key: 'NOTHING',
    label: 'Home / Bodyweight',
    Icon: RiHomeLine,
    desc: 'No equipment needed — anywhere, anytime',
    examples: 'Push Ups, Pull Ups, Squats, Burpees',
  },
];

const DAY_COLORS = [
  'border-blue-500/30 bg-blue-500/5',
  'border-green-500/30 bg-green-500/5',
  'border-orange-500/30 bg-orange-500/5',
  'border-purple-500/30 bg-purple-500/5',
  'border-yellow-500/30 bg-yellow-500/5',
  'border-cyan-500/30 bg-cyan-500/5',
  'border-pink-500/30 bg-pink-500/5',
];

const WeeklyPlan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if coming from Recommendations with a pre-selected equipment
  const fromRecommendations = location.state?.equipmentType;

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [showEquipmentSelector, setShowEquipmentSelector] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(fromRecommendations || null);

  const hasProfile = user?.profile?.goal && user?.profile?.experienceLevel;

  const fetchPlan = useCallback(async (equipmentType) => {
    setLoading(true);
    try {
      const params = equipmentType ? { equipmentType } : {};
      const res = await weeklyPlanAPI.getCurrent(params);
      setPlan(res.data.data);
      setSelectedEquipment(res.data.data.equipmentType);
      const todayNum = new Date().getDay();
      const mapped = todayNum === 0 ? 7 : todayNum;
      setActiveDay(mapped);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If coming from Recommendations, use that equipment type
    if (fromRecommendations) {
      fetchPlan(fromRecommendations);
    } else {
      fetchPlan();
    }
  }, []);

  const handleRegenerate = async (equipmentType) => {
    setRegenerating(true);
    setShowEquipmentSelector(false);
    try {
      const res = await weeklyPlanAPI.regenerate(equipmentType || selectedEquipment || 'MACHINE');
      setPlan(res.data.data);
      setSelectedEquipment(res.data.data.equipmentType);
      toast.success('New weekly plan generated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggleExercise = async (dayNumber, exIdx) => {
    setToggling(`${dayNumber}-${exIdx}`);
    try {
      const res = await weeklyPlanAPI.toggleExercise(plan._id, dayNumber, exIdx);
      setPlan(res.data.data);

      // When day auto-completes — show calories burned toast
      if (res.data.dayCompleted && res.data.autoLoggedCalories > 0) {
        toast.success(
          `Day complete! 🔥 ${res.data.autoLoggedCalories} kcal burned — logged to your dashboard`,
          { duration: 4000 }
        );
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  const handleToggleDay = async (dayNumber) => {
    const day = plan?.days?.find((d) => d.dayNumber === dayNumber);

    // If trying to mark complete — check all exercises done
    if (day && !day.completed && day.exercises.length > 0) {
      const allDone = day.exercises.every((e) => e.completed);
      if (!allDone) {
        const remaining = day.exercises.filter((e) => !e.completed).length;
        toast.error(`Complete all exercises first! ${remaining} remaining.`);
        return;
      }
    }

    setToggling(`day-${dayNumber}`);
    try {
      const res = await weeklyPlanAPI.toggleDay(plan._id, dayNumber);
      setPlan(res.data.data);
      const updatedDay = res.data.data.days.find((d) => d.dayNumber === dayNumber);
      if (updatedDay?.completed) {
        const kcal = res.data.autoLoggedCalories || 0;
        toast.success(
          kcal > 0
            ? `${updatedDay.dayName} complete! 🔥 ${kcal} kcal burned — logged to your dashboard`
            : `${updatedDay.dayName} completed!`,
          { duration: 4000 }
        );
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  // ── Equipment selector screen ────────────────────────────────────────────────
  if (!loading && !plan && !hasProfile) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-title">Weekly Plan</h1>
          <p className="page-subtitle">Complete your profile first to get a personalized plan</p>
        </div>
        <div className="card border-yellow-500/20 bg-yellow-500/5 text-center py-10">
          <RiInformationLine className="text-yellow-400 text-4xl mx-auto mb-3" />
          <p className="text-white font-semibold mb-2">Profile incomplete</p>
          <p className="text-dark-400 text-sm mb-4">Add your fitness goal and experience level to generate a plan</p>
          <button onClick={() => navigate('/profile')} className="btn-primary mx-auto">
            Complete Profile <RiArrowRightLine />
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <PageLoader />;

  // Progress: only count workout days (not rest days), only when ALL exercises are done
  const workoutDays   = plan?.days?.filter((d) => !d.isRestDay) || [];
  const completedDays = workoutDays.filter((d) => d.completed).length;
  const totalDays     = workoutDays.length || 1;
  const weekProgress  = Math.round((completedDays / totalDays) * 100);
  const activeDay_ = plan?.days?.find((d) => d.dayNumber === activeDay);
  const currentEquipmentLabel = EQUIPMENT_OPTIONS.find((e) => e.key === plan?.equipmentType)?.label || 'Gym Machines';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Weekly Plan</h1>
          <p className="page-subtitle">
            {plan ? `${format(new Date(plan.weekStart), 'MMM d')} – ${format(new Date(plan.weekEnd), 'MMM d, yyyy')}` : 'Your 7-day fitness plan'}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Equipment badge */}
          <button
            onClick={() => setShowEquipmentSelector(true)}
            className="btn-secondary text-sm"
            title="Change equipment type"
          >
            <RiSettings3Line />
            {currentEquipmentLabel}
          </button>
          <button
            onClick={() => setShowEquipmentSelector(true)}
            disabled={regenerating}
            className="btn-secondary"
          >
            <RiRefreshLine className={regenerating ? 'animate-spin' : ''} />
            New Plan
          </button>
        </div>
      </div>

      {/* Equipment selector modal */}
      {showEquipmentSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEquipmentSelector(false)} />
          <div className="relative w-full max-w-md bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 animate-slide-up">
            <h2 className="text-white font-bold text-lg mb-2">Select Equipment Type</h2>
            <p className="text-dark-400 text-sm mb-5">Your weekly plan exercises will match your available equipment</p>
            <div className="space-y-3">
              {EQUIPMENT_OPTIONS.map(({ key, label, Icon, desc, examples }) => (
                <button
                  key={key}
                  onClick={() => handleRegenerate(key)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all hover:border-brand-500/50 ${
                    selectedEquipment === key
                      ? 'bg-brand-500/10 border-brand-500/50'
                      : 'bg-dark-800/50 border-dark-700'
                  }`}
                >
                  <div className="w-9 h-9 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="text-brand-400 text-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{label}</p>
                    <p className="text-dark-400 text-xs mt-0.5">{desc}</p>
                    <p className="text-dark-600 text-xs mt-1">e.g. {examples}</p>
                  </div>
                  {selectedEquipment === key && <RiCheckLine className="text-brand-400 flex-shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>
            <button onClick={() => setShowEquipmentSelector(false)} className="btn-secondary w-full justify-center mt-4">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Profile incomplete warning */}
      {!hasProfile && (
        <div className="card border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <RiInformationLine className="text-yellow-400 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm">Complete your profile for a personalized plan</p>
              <p className="text-dark-400 text-xs mt-1">Add your fitness goal and experience level.</p>
              <button onClick={() => navigate('/profile')} className="text-yellow-400 text-xs mt-2 hover:text-yellow-300 font-medium">
                Update profile →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment type indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-dark-500">Current plan:</span>
        <span className="text-white font-medium capitalize">{plan?.goal?.replace('_', ' ')}</span>
        <span className="text-dark-600">·</span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          plan?.equipmentType === 'NOTHING'    ? 'bg-green-500/10 text-green-400' :
          plan?.equipmentType === 'EQUIPMENT'  ? 'bg-blue-500/10 text-blue-400' :
          'bg-orange-500/10 text-orange-400'
        }`}>
          {currentEquipmentLabel}
        </span>
      </div>

      {/* Week progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white font-semibold">Week Progress</h2>
            <p className="text-dark-400 text-xs mt-0.5">{completedDays} of {totalDays} workout days completed</p>
          </div>
          <span className={`text-2xl font-bold ${weekProgress === 100 ? 'text-brand-400' : 'text-white'}`}>
            {weekProgress}%
          </span>
        </div>
        <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all duration-700" style={{ width: `${weekProgress}%` }} />
        </div>
        {weekProgress === 100 && (
          <p className="text-brand-400 text-sm mt-2 flex items-center gap-2">
            <RiTrophyLine /> Amazing! You completed the full week!
          </p>
        )}
      </div>

      {/* Day selector */}
      <div className="grid grid-cols-7 gap-2">
        {plan?.days?.map((day) => {
          const isToday = day.dayNumber === (new Date().getDay() === 0 ? 7 : new Date().getDay());
          return (
            <button
              key={day.dayNumber}
              onClick={() => setActiveDay(day.dayNumber)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                activeDay === day.dayNumber
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : day.completed || day.isRestDay
                  ? 'bg-dark-800/50 border-brand-500/30 text-brand-400'
                  : 'bg-dark-800/50 border-dark-700 text-dark-400 hover:border-dark-600 hover:text-white'
              }`}
            >
              <span className="text-xs font-medium">{day.dayName.slice(0, 3)}</span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                day.completed ? 'bg-brand-500 text-white' :
                day.isRestDay ? 'bg-dark-700 text-dark-400' :
                isToday ? 'bg-white/10 text-white ring-1 ring-white/30' :
                'bg-dark-700 text-dark-500'
              }`}>
                {day.completed ? <RiCheckLine /> : day.isRestDay ? <RiMoonLine /> : day.dayNumber}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active day detail */}
      {activeDay_ && (
        <div className={`card border ${DAY_COLORS[(activeDay_.dayNumber - 1) % 7]}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-lg">{activeDay_.dayName}</h2>
                {activeDay_.completed && (
                  <span className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <RiCheckLine /> Done
                  </span>
                )}
                {activeDay_.isRestDay && (
                  <span className="text-xs bg-dark-700 text-dark-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <RiMoonLine /> Rest Day
                  </span>
                )}
              </div>
              <p className="text-dark-400 text-sm mt-0.5">{activeDay_.focus}</p>
            </div>

            {!activeDay_.isRestDay && (
              <button
                onClick={() => handleToggleDay(activeDay_.dayNumber)}
                disabled={toggling === `day-${activeDay_.dayNumber}`}
                className={`text-sm px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                  activeDay_.completed
                    ? 'bg-dark-800 text-dark-400 hover:text-white'
                    : activeDay_.exercises.every((e) => e.completed)
                    ? 'bg-brand-500 hover:bg-brand-500 text-white'
                    : 'bg-dark-800 text-dark-500 cursor-not-allowed'
                }`}
              >
                <RiCheckLine />
                {activeDay_.completed
                  ? 'Unmark Day'
                  : activeDay_.exercises.every((e) => e.completed)
                  ? 'Mark Day Done'
                  : `${activeDay_.exercises.filter((e) => !e.completed).length} left`}
              </button>
            )}
          </div>

          {activeDay_.isRestDay ? (
            <div className="text-center py-8">
              <RiMoonLine className="text-4xl text-dark-600 mx-auto mb-2" />
              <p className="text-dark-400">Rest and recover today. Your muscles grow during rest!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDay_.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                    ex.completed
                      ? 'bg-brand-500/5 border-brand-500/20'
                      : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <button
                    onClick={() => handleToggleExercise(activeDay_.dayNumber, idx)}
                    disabled={toggling === `${activeDay_.dayNumber}-${idx}`}
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      ex.completed
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'border-dark-600 hover:border-brand-500'
                    }`}
                  >
                    {toggling === `${activeDay_.dayNumber}-${idx}` ? (
                      <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : ex.completed ? (
                      <RiCheckLine className="text-sm" />
                    ) : null}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${ex.completed ? 'line-through text-dark-500' : 'text-white'}`}>
                      {ex.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-dark-500 text-xs capitalize">{ex.category}</span>
                      {ex.sets && ex.reps && (
                        <span className="text-dark-400 text-xs">{ex.sets} sets × {ex.reps}</span>
                      )}
                      {ex.duration && (
                        <span className="text-dark-400 text-xs flex items-center gap-1">
                          <RiTimeLine /> {ex.duration} min
                        </span>
                      )}
                    </div>
                  </div>

                  {ex.completed && (
                    <span className="text-brand-400 text-xs flex-shrink-0 flex items-center gap-1">
                      <RiCheckLine /> Done
                    </span>
                  )}
                </div>
              ))}

              <div className="pt-2">
                <div className="flex justify-between text-xs text-dark-500 mb-1">
                  <span>{activeDay_.exercises.filter((e) => e.completed).length} / {activeDay_.exercises.length} exercises</span>
                  <span>{Math.round((activeDay_.exercises.filter((e) => e.completed).length / activeDay_.exercises.length) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${(activeDay_.exercises.filter((e) => e.completed).length / activeDay_.exercises.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full week overview */}
      <div className="card">
        <h2 className="text-white font-semibold mb-4">Full Week Overview</h2>
        <div className="space-y-2">
          {plan?.days?.map((day) => (
            <div
              key={day.dayNumber}
              onClick={() => setActiveDay(day.dayNumber)}
              className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                activeDay === day.dayNumber ? 'bg-dark-800 border border-dark-700' : 'hover:bg-dark-800/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                day.completed ? 'bg-brand-500 text-white' :
                day.isRestDay ? 'bg-dark-800 text-dark-500' :
                'bg-dark-800 text-dark-400'
              }`}>
                {day.completed ? <RiCheckLine /> : day.isRestDay ? <RiMoonLine /> : day.dayNumber}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{day.dayName}</p>
                <p className="text-dark-500 text-xs">{day.focus}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {!day.isRestDay && (
                  <p className="text-dark-500 text-xs">
                    {day.exercises.filter((e) => e.completed).length}/{day.exercises.length}
                  </p>
                )}
                {day.completed && <span className="text-brand-400 text-xs flex items-center gap-1"><RiCheckLine /> Complete</span>}
                {day.isRestDay && <span className="text-dark-600 text-xs">Rest</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyPlan;
