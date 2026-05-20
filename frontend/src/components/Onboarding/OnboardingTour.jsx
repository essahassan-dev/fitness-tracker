import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  RiArrowRightLine, RiArrowLeftLine, RiCloseLine,
  RiFlashlightLine, RiRunLine, RiRestaurantLine,
  RiLineChartLine, RiBarChartLine, RiLightbulbLine,
  RiCalendarLine, RiUserLine, RiCheckLine,
} from 'react-icons/ri';

const TOUR_STEPS = [
  {
    id: 'welcome',
    route: '/dashboard',
    title: 'Welcome to FitStack!',
    description: 'Your personal fitness companion. Let\'s take a quick tour to show you how everything works.',
    icon: RiFlashlightLine,
    iconColor: 'text-brand-400',
    iconBg: 'bg-brand-500/10 border-brand-500/20',
    position: 'center',
    highlight: null,
  },
  {
    id: 'dashboard',
    route: '/dashboard',
    title: 'Dashboard',
    description: 'Your daily overview. See calories consumed vs burned, net balance, macro progress, and recent workouts — all in one place.',
    icon: RiFlashlightLine,
    iconColor: 'text-brand-400',
    iconBg: 'bg-brand-500/10 border-brand-500/20',
    position: 'center',
    highlight: '[data-tour="calorie-balance"]',
  },
  {
    id: 'workouts',
    route: '/workouts',
    title: 'Log Your Workouts',
    description: 'Track every session. Add exercises with sets, reps, and weight. The app automatically calculates calories burned using the MET formula based on your body weight.',
    icon: RiRunLine,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    position: 'center',
    highlight: null,
  },
  {
    id: 'nutrition',
    route: '/nutrition',
    title: 'Track Your Nutrition',
    description: 'Log every meal — breakfast, lunch, dinner, snacks. Track calories, protein, carbs, and fat. See your daily macro progress against your personalized goals.',
    icon: RiRestaurantLine,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10 border-yellow-500/20',
    position: 'center',
    highlight: null,
  },
  {
    id: 'weekly-plan',
    route: '/weekly-plan',
    title: 'Your Weekly Plan',
    description: 'Get a personalized 7-day workout plan based on your goal and experience level. Check off exercises as you complete them to track your progress through the week.',
    icon: RiCalendarLine,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    position: 'center',
    highlight: null,
  },
  {
    id: 'recommendations',
    route: '/recommendations',
    title: 'Smart Recommendations',
    description: 'Get personalized workout plans, exercises, and diet plans based on your BMI, goal, experience level, and dietary preferences. Premium feature.',
    icon: RiLightbulbLine,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    position: 'center',
    highlight: null,
  },
  {
    id: 'progress',
    route: '/progress',
    title: 'Track Your Progress',
    description: 'Log your weight, body fat percentage, and body measurements over time. See your transformation with line charts.',
    icon: RiLineChartLine,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/10 border-green-500/20',
    position: 'center',
    highlight: null,
  },
  {
    id: 'analytics',
    route: '/analytics',
    title: 'Analytics',
    description: 'Deep insights into your fitness journey. Workout frequency charts, strength progress, calorie trends, and macro breakdowns.',
    icon: RiBarChartLine,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    position: 'center',
    highlight: null,
  },
  {
    id: 'profile',
    route: '/profile',
    title: 'Complete Your Profile',
    description: 'Add your height, weight, age, gender, fitness goal, experience level, and dietary preference. This unlocks personalized calorie targets, macro goals, and recommendations.',
    icon: RiUserLine,
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/10 border-pink-500/20',
    position: 'center',
    highlight: null,
  },
  {
    id: 'done',
    route: '/dashboard',
    title: "You're all set!",
    description: "Start by completing your profile, then log your first workout and meal. Your personalized weekly plan is already waiting for you!",
    icon: RiCheckLine,
    iconColor: 'text-brand-400',
    iconBg: 'bg-brand-500/10 border-brand-500/20',
    position: 'center',
    highlight: null,
  },
];

const STORAGE_KEY = 'FitStack_tour_done';

const OnboardingTour = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so app loads first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const current = TOUR_STEPS[step];

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      const next = TOUR_STEPS[step + 1];
      if (next.route !== location.pathname) navigate(next.route);
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      const prev = TOUR_STEPS[step - 1];
      if (prev.route !== location.pathname) navigate(prev.route);
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    navigate('/dashboard');
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  const Icon = current.icon;
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-md bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl animate-slide-up">
        {/* Progress bar */}
        <div className="h-1 bg-dark-800 rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <span className="text-dark-500 text-xs font-medium">
            Step {step + 1} of {TOUR_STEPS.length}
          </span>
          <button
            onClick={handleSkip}
            className="text-dark-500 hover:text-white text-xs flex items-center gap-1 transition-colors"
          >
            Skip tour <RiCloseLine />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center">
          <div className={`w-16 h-16 ${current.iconBg} border rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`text-3xl ${current.iconColor}`} />
          </div>
          <h2 className="text-white font-bold text-xl mb-3">{current.title}</h2>
          <p className="text-dark-400 text-sm leading-relaxed">{current.description}</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const target = TOUR_STEPS[i];
                if (target.route !== location.pathname) navigate(target.route);
                setStep(i);
              }}
              className={`rounded-full transition-all ${
                i === step ? 'w-5 h-2 bg-brand-500' : 'w-2 h-2 bg-dark-700 hover:bg-dark-600'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          {step > 0 && (
            <button onClick={handlePrev} className="btn-secondary flex-1 justify-center">
              <RiArrowLeftLine /> Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="btn-primary flex-1 justify-center"
          >
            {step === TOUR_STEPS.length - 1 ? (
              <><RiCheckLine /> Get Started</>
            ) : (
              <>Next <RiArrowRightLine /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const resetTour = () => localStorage.removeItem(STORAGE_KEY);

export default OnboardingTour;
