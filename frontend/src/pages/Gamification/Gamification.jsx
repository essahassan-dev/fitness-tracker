import React, { useState, useEffect } from 'react';
import {
  RiTrophyLine, RiFlashlightLine, RiStarLine, RiCoinLine,
  RiFireLine, RiMedalLine, RiGroupLine, RiCheckLine,
  RiShieldLine, RiHeartLine, RiLeafLine, RiRunLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { gamificationAPI } from '../../services/api';
import { getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';

const BADGE_ICONS = {
  trophy:   RiTrophyLine,
  fire:     RiFireLine,
  medal:    RiMedalLine,
  flame:    RiFireLine,
  lightning:RiFlashlightLine,
  apple:    RiHeartLine,
  crown:    RiTrophyLine,
  leaf:     RiLeafLine,
  streak:   RiFireLine,
  star:     RiStarLine,
  check:    RiCheckLine,
  building: RiShieldLine,
  diamond:  RiStarLine,
  dumbbell: RiRunLine,
  default:  RiMedalLine,
};

const BADGE_COLORS = {
  workout:    'text-orange-400 bg-orange-500/10 border-orange-500/20',
  nutrition:  'text-green-400 bg-green-500/10 border-green-500/20',
  attendance: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  streak:     'text-red-400 bg-red-500/10 border-red-500/20',
  milestone:  'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
};

const LEVEL_NAMES = ['', 'Rookie', 'Beginner', 'Trainee', 'Active', 'Dedicated',
  'Athlete', 'Champion', 'Elite', 'Legend', 'FitStack Pro'];

const getLevelName = (level) => LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)] || `Level ${level}`;

const Gamification = () => {
  const [stats, setStats]         = useState(null);
  const [badges, setBadges]       = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod]       = useState('all');

  useEffect(() => {
    Promise.all([
      gamificationAPI.getMyStats(),
      gamificationAPI.getAllBadges(),
      gamificationAPI.getLeaderboard({ period }),
    ])
      .then(([s, b, l]) => {
        setStats(s.data.data);
        setBadges(b.data.data);
        setLeaderboard(l.data.data);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <PageLoader />;

  const earnedBadges   = badges.filter((b) => b.earned);
  const lockedBadges   = badges.filter((b) => !b.earned);
  const levelProgress  = stats?.levelProgress || 0;
  const xpForNext      = stats?.xpForNextLevel || 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">FitStack Rewards</h1>
        <p className="page-subtitle">Earn XP, unlock badges, and climb the leaderboard</p>
      </div>

      {/* Level + XP card */}
      <div className="card bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/20">
        <div className="flex items-center gap-5">
          {/* Level circle */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-yellow-500/20 border-2 border-yellow-500/40 flex flex-col items-center justify-center">
              <span className="text-yellow-400 font-black text-2xl">{stats?.level || 1}</span>
              <span className="text-yellow-500/70 text-xs">LEVEL</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-white font-bold text-xl">{getLevelName(stats?.level || 1)}</h2>
              <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/20">
                Level {stats?.level}
              </span>
            </div>
            {/* XP bar */}
            <div className="mb-1">
              <div className="flex justify-between text-xs text-dark-400 mb-1">
                <span>{stats?.xp || 0} XP</span>
                <span>{xpForNext} XP to Level {(stats?.level || 1) + 1}</span>
              </div>
              <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
            <p className="text-dark-400 text-xs">Total XP: {stats?.totalXP?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-yellow-500/10">
          {[
            { icon: RiCoinLine,      value: stats?.coins || 0,         label: 'Coins',   color: 'text-yellow-400' },
            { icon: RiFireLine,      value: stats?.currentStreak || 0, label: 'Streak',  color: 'text-red-400' },
            { icon: RiTrophyLine,    value: earnedBadges.length,       label: 'Badges',  color: 'text-brand-400' },
            { icon: RiStarLine,      value: stats?.longestStreak || 0, label: 'Best',    color: 'text-purple-400' },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="text-center">
              <Icon className={`text-xl mx-auto mb-1 ${color}`} />
              <p className={`font-bold text-lg ${color}`}>{value}</p>
              <p className="text-dark-500 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'overview',    label: 'Overview' },
          { key: 'badges',      label: `Badges (${earnedBadges.length}/${badges.length})` },
          { key: 'leaderboard', label: 'Leaderboard' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === key ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Activity stats */}
          <div className="card">
            <h3 className="text-white font-semibold mb-4">All-Time Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Workouts',       value: stats?.totalWorkouts || 0,                           color: 'text-orange-400' },
                { label: 'Cal Burned',     value: `${((stats?.totalCaloriesBurned || 0)/1000).toFixed(1)}k`, color: 'text-red-400' },
                { label: 'Protein (g)',    value: Math.round(stats?.totalProtein || 0).toLocaleString(), color: 'text-blue-400' },
                { label: 'Attendance',     value: stats?.totalAttendance || 0,                          color: 'text-brand-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-dark-800/50 rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-dark-500 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent badges */}
          <div className="card">
            <h3 className="text-white font-semibold mb-4">Recent Badges</h3>
            {earnedBadges.length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-4">No badges yet — log a workout to earn your first!</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {earnedBadges.slice(0, 6).map((b) => {
                  const Icon  = BADGE_ICONS[b.icon] || BADGE_ICONS.default;
                  const style = BADGE_COLORS[b.category] || BADGE_COLORS.milestone;
                  return (
                    <div key={b.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${style}`} title={b.description}>
                      <Icon className="text-sm flex-shrink-0" />
                      <span className="text-xs font-medium">{b.name}</span>
                    </div>
                  );
                })}
                {earnedBadges.length > 6 && (
                  <button onClick={() => setActiveTab('badges')} className="px-3 py-2 rounded-xl border border-dark-700 text-dark-400 text-xs hover:text-white transition-colors">
                    +{earnedBadges.length - 6} more
                  </button>
                )}
              </div>
            )}
          </div>

          {/* How to earn XP */}
          <div className="card">
            <h3 className="text-white font-semibold mb-4">How to Earn XP & Coins</h3>
            <div className="space-y-2">
              {[
                { action: 'Log a workout',         xp: 50,  coins: 10 },
                { action: 'Complete attendance',    xp: 30,  coins: 8 },
                { action: 'Complete weekly plan day', xp: 40, coins: 12 },
                { action: 'Log a meal',            xp: 20,  coins: 5 },
                { action: 'Log progress',          xp: 25,  coins: 0 },
                { action: 'Earn a badge',          xp: 0,   coins: 50 },
              ].map(({ action, xp, coins }) => (
                <div key={action} className="flex items-center justify-between p-2.5 rounded-xl bg-dark-800/50">
                  <span className="text-dark-300 text-sm">{action}</span>
                  <div className="flex gap-3">
                    {xp > 0 && <span className="text-yellow-400 text-xs font-semibold">+{xp} XP</span>}
                    {coins > 0 && <span className="text-yellow-500 text-xs font-semibold">+{coins} coins</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Badges tab */}
      {activeTab === 'badges' && (
        <div className="space-y-5">
          {earnedBadges.length > 0 && (
            <div className="card">
              <h3 className="text-brand-400 font-semibold mb-4 flex items-center gap-2">
                <RiCheckLine /> Earned ({earnedBadges.length})
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {earnedBadges.map((b) => {
                  const Icon  = BADGE_ICONS[b.icon] || BADGE_ICONS.default;
                  const style = BADGE_COLORS[b.category] || BADGE_COLORS.milestone;
                  return (
                    <div key={b.id} className={`flex items-center gap-3 p-3 rounded-xl border ${style}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style}`}>
                        <Icon className="text-lg" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{b.name}</p>
                        <p className="text-dark-400 text-xs">{b.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {lockedBadges.length > 0 && (
            <div className="card">
              <h3 className="text-dark-400 font-semibold mb-4">Locked ({lockedBadges.length})</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {lockedBadges.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-dark-700 bg-dark-800/30 opacity-60">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-dark-700 border border-dark-600">
                      <RiTrophyLine className="text-dark-500 text-lg" />
                    </div>
                    <div>
                      <p className="text-dark-300 font-semibold text-sm">{b.name}</p>
                      <p className="text-dark-500 text-xs">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['all', 'weekly', 'monthly'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${period === p ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'}`}>
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            {leaderboard.length === 0 ? (
              <div className="text-center py-10">
                <RiGroupLine className="text-4xl text-dark-700 mx-auto mb-2" />
                <p className="text-dark-500 text-sm">No one on the leaderboard yet</p>
                <p className="text-dark-600 text-xs mt-1">Log a workout to get on the board!</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-800">
                {leaderboard.map((entry, i) => (
                  <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i < 3 ? 'bg-dark-800/30' : ''}`}>
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      i === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                      i === 2 ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30' :
                      'bg-dark-800 text-dark-400'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.rank}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-400 text-xs font-bold">{getInitials(entry.user?.name)}</span>
                    </div>

                    {/* Name + level */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{entry.user?.name}</p>
                      <p className="text-dark-500 text-xs">Level {entry.level} · {getLevelName(entry.level)}</p>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold text-sm">{entry.xp?.toLocaleString()} XP</p>
                      <p className="text-dark-500 text-xs">{entry.badges} badges</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gamification;
