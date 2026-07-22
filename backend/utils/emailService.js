const nodemailer = require('nodemailer');

// Create transporter — works only when EMAIL_USER and EMAIL_PASS are set
const createTransporter = () => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your_gmail')) return null;
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
};

const send = async (to, subject, html) => {
  const transporter = createTransporter();
  if (!transporter) { console.log(`[Email skipped — not configured] To: ${to} | Subject: ${subject}`); return; }
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`Email failed to ${to}:`, err.message);
  }
};

// ── Email Templates ────────────────────────────────────────────────────────────

const baseStyle = `
  font-family: 'Inter', Arial, sans-serif;
  background: #0f172a;
  color: #f1f5f9;
  padding: 32px 24px;
  border-radius: 16px;
  max-width: 480px;
  margin: 0 auto;
`;

const btnStyle = `
  display: inline-block;
  background: #3b82f6;
  color: white;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  margin-top: 16px;
`;

// Welcome email on login
const sendWelcomeLogin = async (user) => {
  const html = `
    <div style="${baseStyle}">
      <h1 style="color:#3b82f6;margin:0 0 8px">FitStack</h1>
      <h2 style="margin:0 0 16px;color:#f1f5f9">Welcome back, ${user.name}!</h2>
      <p style="color:#94a3b8;line-height:1.6">
        You've successfully signed in to <strong style="color:#f1f5f9">FitStack</strong>. 
        Ready to crush your fitness goals today?
      </p>
      <div style="background:#1e293b;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0;color:#94a3b8;font-size:14px">Signed in as</p>
        <p style="margin:4px 0 0;color:#f1f5f9;font-weight:600">${user.email}</p>
      </div>
      <p style="color:#94a3b8;font-size:13px">If this wasn't you, please change your password immediately.</p>
      <a href="${process.env.CLIENT_URL}/dashboard" style="${btnStyle}">Go to Dashboard</a>
      <p style="color:#475569;font-size:12px;margin-top:24px">FitStack Team — Stay consistent, stay fit!</p>
    </div>`;
  await send(user.email, 'Welcome back to FitStack!', html);
};

// Workout completion email
const sendWorkoutComplete = async (user, workout) => {
  const html = `
    <div style="${baseStyle}">
      <h1 style="color:#3b82f6;margin:0 0 8px">FitStack</h1>
      <h2 style="margin:0 0 16px;color:#f1f5f9">Workout Complete!</h2>
      <p style="color:#94a3b8">Great job, <strong style="color:#f1f5f9">${user.name}</strong>! You just logged a workout.</p>
      <div style="background:#1e293b;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0;color:#3b82f6;font-weight:700;font-size:18px">${workout.title}</p>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px">
          ${workout.exercises?.length || 0} exercises 
          ${workout.duration ? `· ${workout.duration} min` : ''} 
          ${workout.caloriesBurned ? `· ${workout.caloriesBurned} kcal burned` : ''}
        </p>
      </div>
      <p style="color:#94a3b8;font-size:14px">Every workout brings you closer to your goal. Keep it up!</p>
      <a href="${process.env.CLIENT_URL}/workouts" style="${btnStyle}">View Workouts</a>
      <p style="color:#475569;font-size:12px;margin-top:24px">FitStack — You're unstoppable!</p>
    </div>`;
  await send(user.email, `Workout logged: ${workout.title}`, html);
};

// Daily reminder email
const sendDailyReminder = async (user, data) => {
  const { workoutDone, mealsLogged, caloriesConsumed, calorieGoal } = data;
  const pct = Math.round((caloriesConsumed / calorieGoal) * 100);

  const html = `
    <div style="${baseStyle}">
      <h1 style="color:#3b82f6;margin:0 0 8px">FitStack</h1>
      <h2 style="margin:0 0 16px;color:#f1f5f9">Daily Check-in, ${user.name}!</h2>
      <p style="color:#94a3b8">Here's your progress for today:</p>
      <div style="background:#1e293b;border-radius:12px;padding:16px;margin:20px 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#94a3b8">Workout</span>
          <span style="color:${workoutDone ? '#22c55e' : '#ef4444'};font-weight:600">${workoutDone ? 'Done!' : 'Not yet'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#94a3b8">Meals logged</span>
          <span style="color:#f1f5f9;font-weight:600">${mealsLogged}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#94a3b8">Calories</span>
          <span style="color:#f1f5f9;font-weight:600">${caloriesConsumed} / ${calorieGoal} kcal (${pct}%)</span>
        </div>
      </div>
      ${!workoutDone ? '<p style="color:#fbbf24;font-size:14px">You haven\'t logged a workout yet today. Even a 20-minute session makes a difference!</p>' : '<p style="color:#22c55e;font-size:14px">You\'ve completed your workout today. Excellent work!</p>'}
      <a href="${process.env.CLIENT_URL}/dashboard" style="${btnStyle}">View Dashboard</a>
      <p style="color:#475569;font-size:12px;margin-top:24px">FitStack — One day at a time!</p>
    </div>`;
  await send(user.email, 'Your FitStack Daily Check-in', html);
};

module.exports = { sendWelcomeLogin, sendWorkoutComplete, sendDailyReminder };
