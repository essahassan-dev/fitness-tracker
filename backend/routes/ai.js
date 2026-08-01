const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { chat } = require('../controllers/aiController');

// Contact form (public — no auth needed)
router.post('/contact', async (req, res, next) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;
    if (!email || !message) return res.status(400).json({ success: false, message: 'Email and message required' });

    const { sendWelcomeLogin } = require('../utils/emailService');
    const nodemailer = require('nodemailer');

    const transporter = process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your_gmail')
      ? nodemailer.createTransporter({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } })
      : null;

    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_USER,
        subject: `FitStack Contact: ${subject || 'General'}`,
        html: `<div style="font-family:Arial;padding:20px;background:#0f172a;color:#f1f5f9;border-radius:12px">
          <h2 style="color:#3b82f6">New Contact Message</h2>
          <p><strong>Name:</strong> ${firstName || ''} ${lastName || ''}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
          <p><strong>Message:</strong></p>
          <div style="background:#1e293b;padding:12px;border-radius:8px;margin-top:8px">${message}</div>
        </div>`,
      });
    }

    console.log(`Contact form: ${email} — ${subject} — ${message}`);
    res.json({ success: true, message: 'Message received! We will respond within 24 hours.' });
  } catch (err) {
    res.json({ success: true, message: 'Message received!' }); // non-fatal
  }
});

router.post('/chat', protect, chat);

// ── AI Progress Prediction ─────────────────────────────────────────────────────
router.post('/predict-progress', protect, async (req, res, next) => {
  try {
    const User       = require('../models/User');
    const Workout    = require('../models/Workout');
    const Nutrition  = require('../models/Nutrition');
    const Attendance = require('../models/Attendance');
    const Progress   = require('../models/Progress');

    const userId = req.user._id;
    const user   = await User.findById(userId).select('profile name');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [workoutCount, avgCalories, attendanceCount, latestProgress, totalCalBurned] = await Promise.all([
      Workout.countDocuments({ user: userId, date: { $gte: thirtyDaysAgo } }),
      Nutrition.aggregate([
        { $match: { user: userId, date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, avg: { $avg: '$totalCalories' }, avgProtein: { $avg: '$totalProtein' } } },
      ]),
      Attendance.countDocuments({ user: userId, date: { $gte: thirtyDaysAgo } }),
      Progress.findOne({ user: userId }).sort('-date'),
      Workout.aggregate([
        { $match: { user: userId, date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$caloriesBurned' } } },
      ]),
    ]);

    const profile        = user.profile || {};
    const avgCal         = avgCalories[0]?.avg || 0;
    const avgProtein     = avgCalories[0]?.avgProtein || 0;
    const calBurned      = totalCalBurned[0]?.total || 0;
    const currentWeight  = latestProgress?.weight || profile.weight || 'unknown';
    const currentBodyFat = latestProgress?.bodyFat || 'unknown';

    const prompt = `You are a professional fitness coach AI. Based on this user data, give a concise 30-day progress prediction.

User Profile:
- Goal: ${profile.goal?.replace('_', ' ') || 'Not set'}
- Age: ${profile.age || 'unknown'}, Gender: ${profile.gender || 'unknown'}
- Height: ${profile.height || 'unknown'}cm, Weight: ${currentWeight}kg, Body Fat: ${currentBodyFat}%
- Activity Level: ${profile.activityLevel || 'unknown'}, Experience: ${profile.experienceLevel || 'unknown'}

Last 30 Days:
- Workouts: ${workoutCount}, Attendance: ${attendanceCount} days
- Calories burned: ${Math.round(calBurned)} kcal total
- Avg daily calories consumed: ${Math.round(avgCal)} kcal
- Avg daily protein: ${Math.round(avgProtein)}g

Provide these 5 sections with bold headers:
1. **Estimated Weight Change** (specific range e.g. -2kg to -3kg)
2. **Body Composition** (fat/muscle change in kg)
3. **Performance Gains** (strength/endurance improvements)
4. **Top Recommendation** (one key action to improve results)
5. **Consistency Score** (X/10 with brief comment)

Be realistic, specific, and encouraging. Under 200 words.`;

    const apiKey = process.env.GEMINI_API_KEY;
    let prediction;

    if (!apiKey || apiKey.includes('placeholder')) {
      prediction = generateFallbackPrediction(profile, workoutCount, attendanceCount, avgCal, currentWeight);
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 350 },
        }),
      });
      const data = await response.json();
      prediction = data.candidates?.[0]?.content?.parts?.[0]?.text
        || generateFallbackPrediction(profile, workoutCount, attendanceCount, avgCal, currentWeight);
    }

    res.json({
      success: true,
      prediction,
      stats: {
        workoutCount, attendanceCount,
        avgCal: Math.round(avgCal),
        avgProtein: Math.round(avgProtein),
        calBurned: Math.round(calBurned),
      },
    });
  } catch (err) { next(err); }
});

// ── AI Workout Plan Insight ────────────────────────────────────────────────────
router.post('/workout-insight', protect, async (req, res, next) => {
  try {
    const { planName, goal, difficulty, caloriesBurned, duration } = req.body;
    const User    = require('../models/User');
    const user    = await User.findById(req.user._id).select('profile');
    const profile = user.profile || {};
    const bmi     = profile.weight && profile.height
      ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
      : 'unknown';

    const prompt = `In 3 sentences max, explain why "${planName}" (${difficulty}, ${duration} min, ~${caloriesBurned} kcal) is ideal for someone whose goal is ${goal?.replace('_', ' ')}, ${profile.experienceLevel || 'beginner'} level, BMI ${bmi}. Be specific and motivating.`;

    const apiKey = process.env.GEMINI_API_KEY;
    let insight;

    if (!apiKey || apiKey.includes('placeholder')) {
      insight = `**${planName}** is perfectly matched to your **${goal?.replace('_', ' ')}** goal. At **${difficulty}** difficulty, it progressively challenges your body while staying appropriate for your experience level. The **${duration}-minute** sessions will burn ~${caloriesBurned} kcal, keeping you on track with your daily targets.`;
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 120 },
        }),
      });
      const data = await response.json();
      insight = data.candidates?.[0]?.content?.parts?.[0]?.text || `${planName} is well-suited for your ${goal?.replace('_', ' ')} goal.`;
    }

    res.json({ success: true, insight });
  } catch (err) { next(err); }
});

// ── Trainer notify admin ───────────────────────────────────────────────────────
router.post('/notify-admin', protect, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const User         = require('../models/User');
    const { title, message } = req.body;
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await Notification.create({ user: admin._id, title, message, type: 'warning', link: '/admin/fees' });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

function generateFallbackPrediction(profile, workouts, attendance, avgCal, currentWeight) {
  const goal        = profile.goal || 'maintain';
  const consistency = Math.min(10, Math.round((workouts / 12 + attendance / 20) * 5));
  let weightChange  = '±0.5kg';
  let bodyComp      = 'body recomposition';

  if (goal === 'lose_weight') {
    const deficit    = Math.max(0, 2500 - avgCal);
    const kgLost     = Math.min(((deficit * 30) / 7700), 4).toFixed(1);
    weightChange     = `-${kgLost}kg to -${(parseFloat(kgLost) + 1).toFixed(1)}kg`;
    bodyComp         = `~${(parseFloat(kgLost) * 0.8).toFixed(1)}kg fat loss`;
  } else if (goal === 'gain_muscle') {
    weightChange     = `+0.5kg to +1.5kg`;
    bodyComp         = `~0.5-1kg lean muscle gain`;
  }

  return `**Estimated Weight Change:** ${weightChange}\n\n**Body Composition:** ${bodyComp}\n\n**Performance Gains:** Expect 10-15% improvement in strength and endurance with consistent training.\n\n**Top Recommendation:** ${consistency < 5 ? 'Increase workout frequency to 3-4x per week for better results.' : 'Maintain your current consistency and progressively increase weights.'}\n\n**Consistency Score:** ${consistency}/10 — ${consistency >= 7 ? 'Excellent! Keep it up.' : consistency >= 4 ? 'Good progress, push harder!' : 'Room to improve — try logging more workouts.'}`;
}

module.exports = router;
