import React, { useState } from 'react';
import {
  RiUserLine, RiLockLine, RiSaveLine, RiEyeLine, RiEyeOffLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getInitials, calculateBMI, getBMICategory, getErrorMessage } from '../../utils/helpers';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    profile: {
      age: user?.profile?.age || '',
      height: user?.profile?.height || '',
      weight: user?.profile?.weight || '',
      goal: user?.profile?.goal || '',
      activityLevel: user?.profile?.activityLevel || '',
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name in profileForm.profile) {
      setProfileForm({ ...profileForm, profile: { ...profileForm.profile, [name]: value } });
    } else {
      setProfileForm({ ...profileForm, [name]: value });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const payload = {
        name: profileForm.name,
        profile: {
          age: profileForm.profile.age ? Number(profileForm.profile.age) : null,
          height: profileForm.profile.height ? Number(profileForm.profile.height) : null,
          weight: profileForm.profile.weight ? Number(profileForm.profile.weight) : null,
          goal: profileForm.profile.goal,
          activityLevel: profileForm.profile.activityLevel,
        },
      };
      const res = await authAPI.updateProfile(payload);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPasswordLoading(false);
    }
  };

  const bmi = calculateBMI(profileForm.profile.weight, profileForm.profile.height);
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account and fitness profile</p>
      </div>

      {/* Avatar card */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 bg-brand-500/20 border-2 border-brand-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-brand-400 text-2xl font-bold">{getInitials(user?.name)}</span>
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">{user?.name}</h2>
          <p className="text-dark-400 text-sm">{user?.email}</p>
          {bmi && (
            <p className="text-dark-500 text-xs mt-1">
              BMI: <span className={bmiCategory?.color}>{bmi} ({bmiCategory?.label})</span>
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-900 border border-dark-800 rounded-xl p-1">
        {[
          { id: 'profile', label: 'Profile', icon: RiUserLine },
          { id: 'security', label: 'Security', icon: RiLockLine },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-dark-800 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                className="input"
                placeholder="Your name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Age</label>
                <input
                  type="number"
                  name="age"
                  value={profileForm.profile.age}
                  onChange={handleProfileChange}
                  placeholder="25"
                  min="10"
                  max="120"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={profileForm.profile.height}
                  onChange={handleProfileChange}
                  placeholder="175"
                  min="100"
                  max="250"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={profileForm.profile.weight}
                  onChange={handleProfileChange}
                  placeholder="70"
                  min="30"
                  max="300"
                  step="0.1"
                  className="input"
                />
              </div>
              <div>
                {bmi && (
                  <div className="mt-6 p-3 bg-dark-800/50 rounded-xl text-center">
                    <p className="text-dark-400 text-xs">BMI</p>
                    <p className={`text-xl font-bold ${bmiCategory?.color}`}>{bmi}</p>
                    <p className={`text-xs ${bmiCategory?.color}`}>{bmiCategory?.label}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="label">Fitness Goal</label>
              <select name="goal" value={profileForm.profile.goal} onChange={handleProfileChange} className="select">
                <option value="">Select goal</option>
                <option value="lose_weight">Lose Weight</option>
                <option value="gain_muscle">Gain Muscle</option>
                <option value="maintain">Maintain Weight</option>
                <option value="improve_endurance">Improve Endurance</option>
              </select>
            </div>

            <div>
              <label className="label">Activity Level</label>
              <select name="activityLevel" value={profileForm.profile.activityLevel} onChange={handleProfileChange} className="select">
                <option value="">Select activity level</option>
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="light">Light (1-3 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="very_active">Very Active (twice/day)</option>
              </select>
            </div>

            <button type="submit" disabled={profileLoading} className="btn-primary">
              {profileLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <><RiSaveLine /> Save Changes</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card">
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showCurrentPw ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showNewPw ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type={showNewPw ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Repeat new password"
                className="input"
                required
              />
            </div>

            <button type="submit" disabled={passwordLoading} className="btn-primary">
              {passwordLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Changing...
                </span>
              ) : (
                <><RiLockLine /> Change Password</>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
