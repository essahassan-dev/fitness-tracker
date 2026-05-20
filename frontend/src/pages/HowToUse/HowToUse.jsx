import React, { useState } from 'react';
import {
  RiFlashlightLine, RiRunLine, RiRestaurantLine, RiLineChartLine,
  RiBarChartLine, RiLightbulbLine, RiCalendarLine, RiUserLine,
  RiShieldLine, RiVipCrownLine, RiDownloadLine, RiUserHeartLine,
  RiArrowDownSLine, RiArrowUpSLine, RiCheckLine, RiInformationLine,
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { resetTour } from '../../components/Onboarding/OnboardingTour';

const SECTIONS = [
  {
    icon: RiUserLine,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
    title: 'Setting Up Your Profile',
    steps: [
      'Go to Profile in the sidebar',
      'Fill in your Age, Height, Weight, and Gender',
      'Select your Fitness Goal (Lose Weight / Gain Muscle / Maintain / Endurance)',
      'Choose your Experience Level (Beginner / Intermediate / Advanced)',
      'Set your Activity Level and Dietary Preference',
      'Click Save — your calorie targets and recommendations update automatically',
    ],
    tip: 'The more complete your profile, the more accurate your calorie goals, TDEE, and recommendations will be.',
  },
  {
    icon: RiRunLine,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    title: 'Logging Workouts',
    steps: [
      'Go to Workouts and click "Log Workout"',
      'Enter a title (e.g. "Morning Push Day") and date',
      'Add exercises — name, category, sets, reps, weight',
      'For cardio exercises, enter duration and distance instead',
      'Calories burned are calculated automatically using MET formula',
      'Your workout appears on the Dashboard and Analytics',
    ],
    tip: 'Set your body weight in Profile for more accurate calorie burn calculations.',
  },
  {
    icon: RiRestaurantLine,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    title: 'Tracking Nutrition',
    steps: [
      'Go to Nutrition and click "Log Meal"',
      'Select meal type: Breakfast, Lunch, Dinner, or Snack',
      'Add food items with name, quantity, calories, protein, carbs, fat',
      'The daily summary shows your total intake vs your goal',
      'The Dashboard shows net balance: Consumed minus Burned',
      'Green = calorie deficit (losing weight), Red = surplus (gaining)',
    ],
    tip: 'Log meals consistently to get accurate net calorie balance on your dashboard.',
  },
  {
    icon: RiCalendarLine,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    title: 'Weekly Plan',
    steps: [
      'Go to Weekly Plan in the sidebar',
      'A 7-day plan is auto-generated based on your goal and experience level',
      'Each day shows the muscle group focus and exercises',
      'Tap the checkbox next to each exercise to mark it complete',
      'Click "Mark All Done" to complete an entire day at once',
      'Click "New Plan" to regenerate a fresh plan anytime',
    ],
    tip: 'Complete your profile first — the plan changes based on your goal (fat loss vs muscle gain) and experience level.',
  },
  {
    icon: RiLineChartLine,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    title: 'Tracking Progress',
    steps: [
      'Go to Progress and click "Log Progress"',
      'Enter your current weight, body fat %, and measurements',
      'Log regularly (weekly recommended) to see trends',
      'Weight and body fat charts show your transformation over time',
      'Export your progress as PDF or CSV (Premium)',
    ],
    tip: 'Weigh yourself at the same time each day (morning, after bathroom) for consistent readings.',
  },
  {
    icon: RiLightbulbLine,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    title: 'Smart Recommendations (Premium)',
    steps: [
      'Complete your profile with all fields',
      'Go to Recommendations in the sidebar',
      'See your BMI, TDEE, protein goal, and fitness category',
      'Workout Plans tab — personalized plans for your goal',
      'Exercises tab — select Machine, Equipment, or Home workouts',
      'Diet Plans tab — full meal plans with breakfast/lunch/dinner/snacks',
    ],
    tip: 'Upgrade to Premium to unlock exercise and diet plan recommendations.',
  },
  {
    icon: RiBarChartLine,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Analytics',
    steps: [
      'Go to Analytics to see deep insights',
      'Workout frequency chart shows how often you train',
      'Exercise category breakdown (strength vs cardio)',
      'Calories consumed vs burned over time',
      'Macros breakdown — protein, carbs, fat trends',
      'Strength progress table — max weight per exercise',
    ],
    tip: 'Nutrition analytics (macros chart) requires Premium.',
  },
  {
    icon: RiDownloadLine,
    color: 'text-brand-400',
    bg: 'bg-brand-500/10 border-brand-500/20',
    title: 'Exporting Data (Premium)',
    steps: [
      'Click the Export button on Workouts, Nutrition, or Progress pages',
      'Choose PDF for a formatted report or CSV for spreadsheet data',
      'PDF includes charts, summaries, and all your data',
      'CSV can be opened in Excel or Google Sheets',
      'Dashboard has a "Full Report" button that exports everything in one PDF',
    ],
    tip: 'Export is a Premium feature. Upgrade from the Pricing page.',
  },
  {
    icon: RiVipCrownLine,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    title: 'Premium Subscription',
    steps: [
      'Click "Upgrade to Premium" in the sidebar or go to /pricing',
      'Choose Monthly ($9.99) or Yearly ($79.99 — save 33%)',
      'Click Upgrade to activate your subscription',
      'Premium unlocks: advanced analytics, diet plans, exercise recommendations, exports',
      'Your subscription status shows in Profile',
      'Cancel anytime from Profile',
    ],
    tip: 'Free users can still track workouts, nutrition, and progress. Premium adds deeper insights.',
  },
  {
    icon: RiUserHeartLine,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Trainer Remarks',
    steps: [
      'If a trainer is assigned to you, you will see a bell icon in the top bar',
      'Your trainer can send feedback, corrections, encouragement, or warnings',
      'Click the bell to read all remarks from your trainer',
      'Unread remarks show a red badge count on the bell',
      'Remarks include what exercise or workout they relate to',
    ],
    tip: 'Ask your admin to assign a trainer to your account.',
  },
];

const Section = ({ section }) => {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 text-left"
      >
        <div className={`w-10 h-10 ${section.bg} border rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`text-lg ${section.color}`} />
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold">{section.title}</p>
          <p className="text-dark-500 text-xs mt-0.5">{section.steps.length} steps</p>
        </div>
        {open ? (
          <RiArrowUpSLine className="text-dark-400 text-xl flex-shrink-0" />
        ) : (
          <RiArrowDownSLine className="text-dark-400 text-xl flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-dark-800 space-y-4 animate-fade-in">
          <ol className="space-y-2">
            {section.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-dark-300 text-sm">{step}</span>
              </li>
            ))}
          </ol>
          <div className="flex items-start gap-2 bg-dark-800/50 rounded-xl p-3">
            <RiInformationLine className="text-brand-400 flex-shrink-0 mt-0.5" />
            <p className="text-dark-400 text-xs">{section.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const HowToUse = () => {
  const navigate = useNavigate();

  const handleRestartTour = () => {
    resetTour();
    navigate('/dashboard');
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">How to Use FitStack</h1>
          <p className="page-subtitle">Complete guide to getting the most out of the app</p>
        </div>
        <button onClick={handleRestartTour} className="btn-secondary text-sm flex-shrink-0">
          <RiFlashlightLine /> Restart Tour
        </button>
      </div>

      {/* Quick start */}
      <div className="card border-brand-500/20 bg-brand-500/5">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <RiFlashlightLine className="text-brand-400" /> Quick Start (5 minutes)
        </h2>
        <div className="space-y-2">
          {[
            { step: '1', text: 'Complete your Profile — add weight, height, age, goal', route: '/profile' },
            { step: '2', text: 'Check your Weekly Plan — see today\'s workout', route: '/weekly-plan' },
            { step: '3', text: 'Log your first workout', route: '/workouts' },
            { step: '4', text: 'Log your meals for today', route: '/nutrition' },
            { step: '5', text: 'Check Dashboard for your calorie balance', route: '/dashboard' },
          ].map(({ step, text, route }) => (
            <button
              key={step}
              onClick={() => navigate(route)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-dark-800/50 transition-colors text-left group"
            >
              <span className="w-6 h-6 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                {step}
              </span>
              <span className="text-dark-300 text-sm group-hover:text-white transition-colors">{text}</span>
              <RiArrowDownSLine className="text-dark-600 group-hover:text-dark-400 ml-auto rotate-[-90deg] transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* All sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => (
          <Section key={section.title} section={section} />
        ))}
      </div>
    </div>
  );
};

export default HowToUse;
