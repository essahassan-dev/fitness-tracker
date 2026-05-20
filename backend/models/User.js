const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: [true, 'Name is required'], trim: true, maxlength: 50 },
    email:    { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    avatar:   { type: String, default: '' },
    profile: {
      age:             { type: Number, default: null },
      height:          { type: Number, default: null },
      weight:          { type: Number, default: null },
      gender:          { type: String, enum: ['male', 'female', 'other', ''], default: '' },
      goal:            { type: String, enum: ['lose_weight', 'gain_muscle', 'maintain', 'improve_endurance', ''], default: '' },
      activityLevel:   { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active', ''], default: '' },
      experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', ''], default: '' },
      dietaryPref:     { type: String, enum: ['none', 'vegetarian', 'vegan', 'keto', 'paleo', 'halal', ''], default: '' },
    },
    preferences: {
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    },
    role:     { type: String, enum: ['user', 'admin', 'trainer'], default: 'user' },
    isActive: { type: Boolean, default: true },
    // Trainer: list of user IDs this trainer is assigned to
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // User: which trainer is assigned to them
    assignedTrainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    subscription: {
      type:                 { type: String, enum: ['FREE', 'PREMIUM'], default: 'FREE' },
      status:               { type: String, enum: ['ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED'], default: 'ACTIVE' },
      startDate:            { type: Date, default: null },
      endDate:              { type: Date, default: null },
      stripeCustomerId:     { type: String, default: null },
      stripeSubscriptionId: { type: String, default: null },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isPremium = function () {
  const sub = this.subscription;
  if (!sub || sub.type !== 'PREMIUM') return false;
  if (sub.status !== 'ACTIVE') return false;
  if (sub.endDate && new Date() > new Date(sub.endDate)) return false;
  return true;
};

module.exports = mongoose.model('User', userSchema);
