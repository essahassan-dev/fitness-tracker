import React, { useState } from 'react';
import {
  RiUserLine, RiLockLine, RiSaveLine,
  RiEyeLine, RiEyeOffLine, RiFlashlightLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getInitials, calculateBMI, getBMICategory, getErrorMessage } from '../../utils/helpers';
import { SubscriptionCard } from '../../components/UI/SubscriptionBadge';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [heightUnit, setHeightUnit] = useState('cm'); // 'cm' | 'ft'
  const [heightFt, setHeightFt] = useState('');       // feet display value
  const [heightIn, setHeightIn] = useState('');       // inches display value

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    profile: {
      age:             user?.profile?.age             || '',
      height:          user?.profile?.height          || '',
      weight:          user?.profile?.weight          || '',
      gender:          user?.profile?.gender          || '',
      goal:            user?.profile?.goal            || '',
      activityLevel:   user?.profile?.activityLevel   || '',
      experienceLevel: user?.profile?.experienceLevel || '',
      dietaryPref:     user?.profile?.dietaryPref     || '',
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name in profileForm.profile) {
      setProfileForm({ ...profileForm, profile: { ...profileForm.profile, [name]: value } });
    } else {
      setProfileForm({ ...profileForm, [name]: value });
    }
  };

  // Height unit toggle — converts stored cm value to ft/in display
  const handleHeightUnitToggle = (unit) => {
    setHeightUnit(unit);
    const cmVal = parseFloat(profileForm.profile.height);
    if (unit === 'ft' && cmVal) {
      const totalInches = cmVal / 2.54;
      setHeightFt(String(Math.floor(totalInches / 12)));
      setHeightIn(String(Math.round(totalInches % 12)));
    }
  };

  // When user types in ft/in fields — convert to cm and store
  const handleFtInChange = (field, value) => {
    const ft = field === 'ft' ? value : heightFt;
    const inches = field === 'in' ? value : heightIn;
    if (field === 'ft') setHeightFt(value);
    if (field === 'in') setHeightIn(value);
    const totalCm = Math.round(((parseFloat(ft) || 0) * 12 + (parseFloat(inches) || 0)) * 2.54);
    if (totalCm > 0) {
      setProfileForm({ ...profileForm, profile: { ...profileForm.profile, height: totalCm } });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const payload = {
        name: profileForm.name,
        profile: {
          age:             profileForm.profile.age             ? Number(profileForm.profile.age)    : null,
          height:          profileForm.profile.height          ? Number(profileForm.profile.height) : null,
          weight:          profileForm.profile.weight          ? Number(profileForm.profile.weight) : null,
          gender:          profileForm.profile.gender,
          goal:            profileForm.profile.goal,
          activityLevel:   profileForm.profile.activityLevel,
          experienceLevel: profileForm.profile.experienceLevel,
          dietaryPref:     profileForm.profile.dietaryPref,
        },
      };
      const res = await authAPI.updateProfile(payload);
      updateUser(res.data.user);
      toast.success('Profile updated! Recommendations refreshed 🎯');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passwordForm.newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    setPasswordLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPasswordLoading(false);
    }
  };

  const bmi = calculateBMI(profileForm.profile.weight, profileForm.profile.height);
  const bmiCategory = getBMICategory(bmi);

  const selectClass = "select w-full";

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Update your info to get personalized recommendations</p>
      </div>

      {/* Avatar card */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 bg-brand-500/20 border-2 border-brand-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-brand-400 text-2xl font-bold">{getInitials(user?.name)}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-white font-semibold text-lg">{user?.name}</h2>
          <p className="text-dark-400 text-sm">{user?.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {bmi && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${bmiCategory?.color} bg-dark-800`}>
                BMI {bmi} · {bmiCategory?.label}
              </span>
            )}
            {user?.profile?.goal && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium text-brand-400 bg-brand-500/10 capitalize">
                {user.profile.goal.replace('_', ' ')}
              </span>
            )}
            {user?.profile?.experienceLevel && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium text-blue-400 bg-blue-500/10 capitalize">
                {user.profile.experienceLevel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subscription card — only for regular users */}
      {user?.role !== 'admin' && <SubscriptionCard />}

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-900 border border-dark-800 rounded-xl p-1">
        {[
          { id: 'profile',  label: 'Profile',  icon: RiUserLine },
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
            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <input name="name" value={profileForm.name} onChange={handleProfileChange} className="input" placeholder="Your name" />
            </div>

            {/* Body stats */}
            <div>
              <p className="text-white font-semibold text-sm mb-3">Body Stats</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Age</label>
                  <input type="number" name="age" value={profileForm.profile.age} onChange={handleProfileChange} placeholder="25" min="10" max="100" className="input" />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select name="gender" value={profileForm.profile.gender} onChange={handleProfileChange} className={selectClass}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0">Height</label>
                    {/* cm / ft toggle */}
                    <div className="flex bg-dark-800 rounded-lg p-0.5 border border-dark-700">
                      {['cm', 'ft'].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => handleHeightUnitToggle(u)}
                          className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all ${
                            heightUnit === u
                              ? 'bg-brand-500 text-white'
                              : 'text-dark-400 hover:text-white'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  {heightUnit === 'cm' ? (
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
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={heightFt}
                          onChange={(e) => handleFtInChange('ft', e.target.value)}
                          placeholder="5"
                          min="3"
                          max="8"
                          className="input"
                        />
                        <p className="text-dark-600 text-xs mt-1 text-center">feet</p>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={heightIn}
                          onChange={(e) => handleFtInChange('in', e.target.value)}
                          placeholder="9"
                          min="0"
                          max="11"
                          className="input"
                        />
                        <p className="text-dark-600 text-xs mt-1 text-center">inches</p>
                      </div>
                    </div>
                  )}

                  {/* Show converted value */}
                  {profileForm.profile.height && (
                    <p className="text-dark-600 text-xs mt-1">
                      {heightUnit === 'cm'
                        ? `= ${Math.floor(profileForm.profile.height / 30.48)}ft ${Math.round((profileForm.profile.height % 30.48) / 2.54)}in`
                        : `= ${profileForm.profile.height} cm`}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Weight (kg)</label>
                  <input type="number" name="weight" value={profileForm.profile.weight} onChange={handleProfileChange} placeholder="70" min="30" max="300" step="0.1" className="input" />
                </div>
              </div>

              {/* BMI display */}
              {bmi && (
                <div className={`mt-3 p-3 rounded-xl border flex items-center gap-4 ${
                  bmiCategory?.label === 'Normal' ? 'bg-green-500/5 border-green-500/20' :
                  bmiCategory?.label === 'Overweight' ? 'bg-yellow-500/5 border-yellow-500/20' :
                  bmiCategory?.label === 'Obese' ? 'bg-red-500/5 border-red-500/20' :
                  'bg-blue-500/5 border-blue-500/20'
                }`}>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${bmiCategory?.color}`}>{bmi}</p>
                    <p className="text-dark-500 text-xs">BMI</p>
                  </div>
                  <div>
                    <p className={`font-semibold ${bmiCategory?.color}`}>{bmiCategory?.label}</p>
                    <p className="text-dark-500 text-xs">
                      {bmiCategory?.label === 'Underweight' && 'Consider a calorie surplus and strength training'}
                      {bmiCategory?.label === 'Normal' && 'Great! Maintain with balanced diet and exercise'}
                      {bmiCategory?.label === 'Overweight' && 'Cardio + calorie deficit recommended'}
                      {bmiCategory?.label === 'Obese' && 'Consult a doctor. Start with low-impact cardio'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Fitness profile */}
            <div>
              <p className="text-white font-semibold text-sm mb-3">Fitness Profile</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fitness Goal</label>
                  <select name="goal" value={profileForm.profile.goal} onChange={handleProfileChange} className={selectClass}>
                    <option value="">Select goal</option>
                    <option value="lose_weight">Lose Weight</option>
                    <option value="gain_muscle">Gain Muscle</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="improve_endurance">Improve Endurance</option>
                  </select>
                </div>
                <div>
                  <label className="label">Experience Level</label>
                  <select name="experienceLevel" value={profileForm.profile.experienceLevel} onChange={handleProfileChange} className={selectClass}>
                    <option value="">Select level</option>
                    <option value="beginner">Beginner (0-1 year)</option>
                    <option value="intermediate">Intermediate (1-3 years)</option>
                    <option value="advanced">Advanced (3+ years)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Activity Level</label>
                  <select name="activityLevel" value={profileForm.profile.activityLevel} onChange={handleProfileChange} className={selectClass}>
                    <option value="">Select activity</option>
                    <option value="sedentary">Sedentary (desk job)</option>
                    <option value="light">Light (1-3 days/week)</option>
                    <option value="moderate">Moderate (3-5 days/week)</option>
                    <option value="active">Active (6-7 days/week)</option>
                    <option value="very_active">Very Active (2x/day)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Dietary Preference</label>
                  <select name="dietaryPref" value={profileForm.profile.dietaryPref} onChange={handleProfileChange} className={selectClass}>
                    <option value="">Select preference</option>
                    <option value="none">No Restriction</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="keto">Keto</option>
                    <option value="paleo">Paleo</option>
                    <option value="halal">Halal</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" disabled={profileLoading} className="btn-primary">
              {profileLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <><RiSaveLine /> Save & Update Recommendations</>
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
                <input type={showCurrentPw ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="••••••••" className="input pr-10" required />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300">
                  {showCurrentPw ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input type={showNewPw ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Min. 6 characters" className="input pr-10" required />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300">
                  {showNewPw ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type={showNewPw ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Repeat password" className="input" required />
            </div>
            <button type="submit" disabled={passwordLoading} className="btn-primary">
              {passwordLoading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Changing...</span>
              ) : <><RiLockLine /> Change Password</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
