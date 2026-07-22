const SYSTEM_PROMPT = `You are FLEX AI, a smart fitness assistant inside FitStack fitness tracker app.
Help users with: workouts, exercises, nutrition, calories, protein, weight loss, muscle gain, recovery, and using the app.
App features: Dashboard (calorie balance), Workouts (log exercises), Nutrition (log meals), Weekly Plan (7-day workout), Progress (weight/measurements), Recommendations (personalized plans), Attendance (QR check-in).
Be concise, friendly, use bullet points. Keep responses under 200 words.`;

const chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('placeholder')) {
      // Fallback: rule-based responses when no API key
      return res.json({ success: true, reply: getFallbackReply(message) });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const contents = [
      ...history.slice(-8).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, try again.';
    res.json({ success: true, reply });
  } catch (err) {
    // If API fails, use fallback
    res.json({ success: true, reply: getFallbackReply(req.body.message) });
  }
};

// Smart rule-based fallback when no Gemini key
const getFallbackReply = (msg) => {
  const m = msg.toLowerCase();

  if (m.includes('protein')) return '**Protein intake:** Aim for **1.6–2.2g per kg of body weight** daily.\n- For muscle gain: 2g/kg\n- For weight loss: 1.8g/kg\n- Good sources: chicken, eggs, fish, Greek yogurt, legumes';
  if (m.includes('lose weight') || m.includes('fat loss') || m.includes('weight loss')) return '**For fat loss:**\n- Create a 300-500 kcal daily deficit\n- Prioritize protein (keeps you full)\n- Do cardio 3-4x/week\n- Strength train to preserve muscle\n- Track everything in FitStack Nutrition page';
  if (m.includes('muscle') || m.includes('bulk') || m.includes('gain')) return '**For muscle gain:**\n- Eat in a 200-300 kcal surplus\n- Lift heavy with progressive overload\n- Get 7-9 hours of sleep\n- Protein: 2g per kg bodyweight\n- Check your Weekly Plan in FitStack';
  if (m.includes('cardio')) return '**Cardio recommendations:**\n- Weight loss: 150-300 min/week moderate intensity\n- Endurance: mix steady-state + intervals\n- Best types: running, cycling, swimming, HIIT\n- Log cardio in FitStack Workouts page';
  if (m.includes('calorie') || m.includes('calories')) return '**Calories:** Your daily need (TDEE) depends on weight, height, age, and activity.\n- FitStack calculates this automatically from your profile\n- Track meals in the Nutrition page\n- Dashboard shows consumed vs burned balance';
  if (m.includes('bmi')) return '**BMI Categories:**\n- Under 18.5: Underweight\n- 18.5–24.9: Normal\n- 25–29.9: Overweight\n- 30+: Obese\n\nFitStack calculates your BMI from height/weight in Profile settings.';
  if (m.includes('workout') || m.includes('exercise') || m.includes('training')) return '**Getting started:**\n- Check your Weekly Plan for a personalized 7-day schedule\n- Choose equipment: Gym machines / Dumbbells / Home bodyweight\n- Log each session in the Workouts page\n- FitStack auto-calculates calories burned';
  if (m.includes('sleep')) return '**Sleep & Recovery:**\n- 7-9 hours is optimal for muscle recovery\n- Poor sleep increases cortisol, slows fat loss\n- Rest days are crucial — muscles grow during rest\n- Aim for consistent sleep/wake times';
  if (m.includes('diet') || m.includes('meal') || m.includes('eat') || m.includes('food')) return '**Nutrition tips:**\n- Eat whole foods: lean protein, vegetables, complex carbs\n- Meal timing matters less than total daily intake\n- Use FitStack Recommendations for personalized meal plans\n- Log every meal for accurate tracking';
  if (m.includes('how') && m.includes('use')) return '**FitStack Quick Guide:**\n1. Complete your Profile (weight, height, goal)\n2. Check Weekly Plan for today\'s workout\n3. Log exercises in Workouts\n4. Log meals in Nutrition\n5. View calorie balance on Dashboard\n6. Check How to Use page for full guide';
  if (m.includes('hello') || m.includes('hi') || m.includes('hey')) return 'Hey there! I\'m **FLEX AI**, your fitness assistant. Ask me about:\n- Workouts & exercises\n- Nutrition & calories\n- Weight loss or muscle gain\n- How to use FitStack';
  if (m.includes('thank')) return 'You\'re welcome! Keep crushing your fitness goals! Hit the gym today?';

  return 'I\'m here to help with fitness, workouts, and nutrition! Try asking me:\n- "How much protein do I need?"\n- "Best exercises for weight loss"\n- "How to use Weekly Plan"\n- "How to gain muscle fast"';
};

module.exports = { chat };
