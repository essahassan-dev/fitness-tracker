import React, { useState, useEffect, useCallback } from 'react';
import {
  RiFlashlightLine, RiRunLine, RiRestaurantLine, RiRefreshLine,
  RiCheckLine, RiTimeLine, RiFireLine,
  RiInformationLine, RiArrowRightLine, RiCalendarLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { recommendationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import PremiumGate from '../../components/UI/PremiumGate';
import { getErrorMessage } from '../../utils/helpers';

// ── Equipment selector ─────────────────────────────────────────────────────────
const EQUIPMENT_OPTIONS = [
  { key: 'MACHINE',   label: 'Machine',    icon: '🏋️', desc: 'Gym machines (chest press, leg press, cables)' },
  { key: 'EQUIPMENT', label: 'Equipment',  icon: '🪀', desc: 'Dumbbells, barbells, resistance bands' },
  { key: 'NOTHING',   label: 'Home / Bodyweight', icon: '🏠', desc: 'No equipment needed' },
];

// ── Exercise card ──────────────────────────────────────────────────────────────
const ExerciseCard = ({ exercise }) => (
  <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 hover:border-dark-600 transition-colors">
    <div className="flex items-start justify-between gap-2 mb-2">
      <h4 className="text-white font-semibold text-sm">{exercise.name}</h4>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
        exercise.difficulty === 'beginner'     ? 'bg-green-500/10 text-green-400' :
        exercise.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
        'bg-red-500/10 text-red-400'
      }`}>
        {exercise.difficulty}
      </span>
    </div>
    <p className="text-dark-400 text-xs mb-3">{exercise.description}</p>
    <div className="flex flex-wrap gap-2 mb-3">
      <span className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded-lg capitalize">{exercise.muscleGroup}</span>
      <span className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded-lg">{exercise.sets} sets × {exercise.reps}</span>
      {exercise.restSeconds > 0 && (
        <span className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded-lg">{exercise.restSeconds}s rest</span>
      )}
    </div>
    {exercise.instructions?.length > 0 && (
      <div className="space-y-1">
        {exercise.instructions.map((step, i) => (
          <p key={i} className="text-dark-500 text-xs flex gap-2">
            <span className="text-brand-500 font-bold flex-shrink-0">{i + 1}.</span>
            {step}
          </p>
        ))}
      </div>
    )}
    {exercise.tips?.length > 0 && (
      <div className="mt-2 pt-2 border-t border-dark-700">
        {exercise.tips.map((tip, i) => (
          <p key={i} className="text-yellow-500/70 text-xs flex gap-1.5">
            <span>💡</span>{tip}
          </p>
        ))}
      </div>
    )}
  </div>
);

// ── Workout plan card ──────────────────────────────────────────────────────────
const WorkoutCard = ({ plan, onStartPlan }) => (
  <div className="card hover:border-dark-700 transition-colors">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h3 className="text-white font-semibold">{plan.name}</h3>
        <p className="text-dark-400 text-xs mt-0.5">{plan.description}</p>
      </div>
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
        plan.difficulty === 'beginner'     ? 'bg-green-500/10 text-green-400' :
        plan.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
        'bg-red-500/10 text-red-400'
      }`}>
        {plan.difficulty}
      </span>
    </div>
    <div className="flex flex-wrap gap-2 mb-3">
      <span className="flex items-center gap-1 text-xs text-dark-400 bg-dark-800 px-2.5 py-1 rounded-lg">
        <RiTimeLine /> {plan.duration} min
      </span>
      <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg">
        <RiFireLine /> ~{plan.caloriesBurned} kcal
      </span>
      <span className="text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg capitalize">{plan.category}</span>
      <span className="text-xs text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg">{plan.equipmentType}</span>
    </div>
    {plan.exercises?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mb-3">
        {plan.exercises.map((ex, i) => (
          <span key={i} className="text-xs bg-dark-800 text-dark-300 px-2 py-0.5 rounded-lg">{ex}</span>
        ))}
      </div>
    )}
    {/* Start Weekly Plan button */}
    <button
      onClick={() => onStartPlan(plan.equipmentType)}
      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 text-sm font-medium transition-all mt-1"
    >
      <RiCalendarLine /> Start Weekly Plan with this
    </button>
  </div>
);

// ── Diet plan card ─────────────────────────────────────────────────────────────
const DietCard = ({ plan }) => {
  const [expanded, setExpanded] = useState(false);
  const meals = [
    { key: 'breakfast', label: '🌅 Breakfast', icon: '🌅' },
    { key: 'lunch',     label: '☀️ Lunch',     icon: '☀️' },
    { key: 'dinner',    label: '🌙 Dinner',    icon: '🌙' },
    { key: 'snacks',    label: '🍎 Snacks',    icon: '🍎' },
  ];

  return (
    <div className="card hover:border-dark-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-white font-semibold">{plan.name}</h3>
          <p className="text-dark-400 text-xs mt-0.5">{plan.description}</p>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-brand-400 text-xs hover:text-brand-300 flex-shrink-0">
          {expanded ? 'Less' : 'Details'} <RiArrowRightLine className={`inline transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Macro summary */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Calories', value: plan.totalCalories, color: 'text-orange-400' },
          { label: 'Protein',  value: `${plan.totalProtein}g`,  color: 'text-blue-400' },
          { label: 'Carbs',    value: `${plan.totalCarbs}g`,    color: 'text-yellow-400' },
          { label: 'Fat',      value: `${plan.totalFat}g`,      color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-dark-800/50 rounded-lg p-2 text-center">
            <p className={`font-bold text-sm ${color}`}>{value}</p>
            <p className="text-dark-500 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {plan.tags?.map((tag, i) => (
          <span key={i} className="text-xs bg-dark-800 text-dark-400 px-2 py-0.5 rounded-lg">{tag}</span>
        ))}
      </div>

      {/* Expanded meals */}
      {expanded && (
        <div className="space-y-3 pt-3 border-t border-dark-800">
          {meals.map(({ key, label }) => {
            const meal = plan[key];
            if (!meal) return null;
            return (
              <div key={key} className="bg-dark-800/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-medium text-sm">{label} — {meal.name}</p>
                  <span className="text-orange-400 text-xs font-semibold">{meal.calories} kcal</span>
                </div>
                <div className="flex gap-3 text-xs text-dark-400 mb-2">
                  <span>P: {meal.protein}g</span>
                  <span>C: {meal.carbs}g</span>
                  <span>F: {meal.fat}g</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {meal.foods?.map((food, i) => (
                    <span key={i} className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded-lg">
                      {food.name} ({food.quantity})
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
const Recommendations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workouts');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [exerciseLoading, setExerciseLoading] = useState(false);

  // Navigate to weekly plan with the selected equipment type
  const handleStartPlan = (equipmentType) => {
    navigate('/weekly-plan', { state: { equipmentType } });
  };

  const hasProfile = user?.profile?.weight && user?.profile?.height && user?.profile?.goal;

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recommendationAPI.getAll();
      setData(res.data.data);
      setSelectedEquipment(res.data.data.equipmentSuggestion || 'NOTHING');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);

  const handleEquipmentSelect = async (type) => {
    setSelectedEquipment(type);
    setExerciseLoading(true);
    try {
      const res = await recommendationAPI.getExercises(type);
      setExercises(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExerciseLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEquipment && data) {
      const cached = data.exercises?.[selectedEquipment];
      if (cached?.length > 0) setExercises(cached);
      else handleEquipmentSelect(selectedEquipment);
    }
  }, [selectedEquipment, data]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Smart Recommendations</h1>
          <p className="page-subtitle">Personalized workouts and diet plans based on your profile</p>
        </div>
        <button onClick={fetchRecommendations} className="btn-secondary flex-shrink-0">
          <RiRefreshLine /> Refresh
        </button>
      </div>

      {/* Profile incomplete warning */}
      {!hasProfile && (
        <div className="card border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <RiInformationLine className="text-yellow-400 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm">Complete your profile for better recommendations</p>
              <p className="text-dark-400 text-xs mt-1">Add your weight, height, goal, gender, and experience level to get fully personalized suggestions.</p>
              <button onClick={() => navigate('/profile')} className="text-yellow-400 text-xs mt-2 hover:text-yellow-300 font-medium">
                Update profile →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'BMI',            value: data.bmi ?? '—',                    sub: data.bmiCategory,       color: 'text-brand-400' },
            { label: 'Daily Calories', value: data.tdee?.toLocaleString() ?? '—', sub: 'kcal target',          color: 'text-orange-400' },
            { label: 'Protein Goal',   value: `${data.macroGoals?.protein ?? '—'}g`, sub: 'daily target',      color: 'text-blue-400' },
            { label: 'Fitness Type',   value: data.fitnessCategory?.replace(/_/g, ' ') ?? '—', sub: 'category', color: 'text-purple-400' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="card-sm">
              <p className="text-dark-400 text-xs uppercase tracking-wide">{label}</p>
              <p className={`text-xl font-bold mt-1 capitalize ${color}`}>{value}</p>
              <p className="text-dark-600 text-xs mt-0.5 capitalize">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'workouts',  label: 'Workout Plans', icon: RiRunLine },
          { key: 'exercises', label: 'Exercises',     icon: RiFlashlightLine },
          { key: 'diet',      label: 'Diet Plans',    icon: RiRestaurantLine },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === key ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      {/* ── Workout Plans Tab ── */}
      {activeTab === 'workouts' && (
        <div className="space-y-4">
          {data?.workoutPlans?.length > 0 ? (
            data.workoutPlans.map((plan) => <WorkoutCard key={plan._id} plan={plan} onStartPlan={handleStartPlan} />)
          ) : (
            <div className="card text-center py-12">
              <RiRunLine className="text-4xl text-dark-700 mx-auto mb-2" />
              <p className="text-dark-500">No workout plans found. Complete your profile to get recommendations.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Exercises Tab ── */}
      {activeTab === 'exercises' && (
        <PremiumGate feature="Exercise Recommendations">
        <div className="space-y-5">
          {/* Equipment selector */}
          <div>
            <p className="text-white font-semibold mb-3">Select Equipment Type</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {EQUIPMENT_OPTIONS.map(({ key, label, icon, desc }) => (
                <button
                  key={key}
                  onClick={() => handleEquipmentSelect(key)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedEquipment === key
                      ? 'bg-brand-500/10 border-brand-500/50 text-white'
                      : 'bg-dark-800/50 border-dark-700 text-dark-400 hover:border-dark-600 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{icon}</span>
                    <span className="font-semibold text-sm">{label}</span>
                    {selectedEquipment === key && <RiCheckLine className="text-brand-400 ml-auto" />}
                  </div>
                  <p className="text-xs text-dark-500">{desc}</p>
                  {data?.equipmentSuggestion === key && (
                    <span className="text-xs text-brand-400 mt-1 block">⭐ Recommended for you</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise list */}
          {exerciseLoading ? (
            <PageLoader />
          ) : exercises.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {exercises.map((ex) => <ExerciseCard key={ex._id} exercise={ex} />)}
            </div>
          ) : (
            <div className="card text-center py-12">
              <RiFlashlightLine className="text-4xl text-dark-700 mx-auto mb-2" />
              <p className="text-dark-500">Select an equipment type above to see exercises</p>
            </div>
          )}
        </div>
        </PremiumGate>
      )}

      {/* ── Diet Plans Tab ── */}
      {activeTab === 'diet' && (
        <PremiumGate feature="Diet Plans">
        <div className="space-y-4">
          {data?.dietPlans?.length > 0 ? (
            data.dietPlans.map((plan) => <DietCard key={plan._id} plan={plan} />)
          ) : (
            <div className="card text-center py-12">
              <RiRestaurantLine className="text-4xl text-dark-700 mx-auto mb-2" />
              <p className="text-dark-500">No diet plans found. Update your profile with dietary preferences.</p>
            </div>
          )}
        </div>
        </PremiumGate>
      )}
    </div>
  );
};

export default Recommendations;
