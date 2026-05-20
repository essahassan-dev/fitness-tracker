/**
 * Weekly plan generator — goal + experience level based splits
 * Exercises are goal-specific: gain_muscle gets heavy compound lifts,
 * lose_weight gets cardio/HIIT/bodyweight, etc.
 */

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getWeekBounds = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { weekStart: monday, weekEnd: sunday };
};

// ── Goal-specific exercise banks ───────────────────────────────────────────────

const EXERCISES = {
  gain_muscle: {
    chest:      [{ name: 'Barbell Bench Press', sets: 4, reps: '6-8',   category: 'strength' }, { name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', category: 'strength' }, { name: 'Cable Fly', sets: 3, reps: '12', category: 'strength' }],
    back:       [{ name: 'Deadlift', sets: 4, reps: '5',     category: 'strength' }, { name: 'Barbell Row', sets: 4, reps: '6-8', category: 'strength' }, { name: 'Lat Pulldown', sets: 3, reps: '10', category: 'strength' }],
    legs:       [{ name: 'Barbell Squat', sets: 4, reps: '6-8', category: 'strength' }, { name: 'Leg Press', sets: 3, reps: '10-12', category: 'strength' }, { name: 'Romanian Deadlift', sets: 3, reps: '8-10', category: 'strength' }, { name: 'Leg Curl', sets: 3, reps: '12', category: 'strength' }],
    shoulders:  [{ name: 'Overhead Press', sets: 4, reps: '6-8', category: 'strength' }, { name: 'Lateral Raises', sets: 3, reps: '12-15', category: 'strength' }, { name: 'Face Pulls', sets: 3, reps: '15', category: 'strength' }],
    biceps:     [{ name: 'Barbell Curl', sets: 4, reps: '8-10', category: 'strength' }, { name: 'Hammer Curl', sets: 3, reps: '10-12', category: 'strength' }],
    triceps:    [{ name: 'Close Grip Bench Press', sets: 4, reps: '8-10', category: 'strength' }, { name: 'Skull Crushers', sets: 3, reps: '10-12', category: 'strength' }, { name: 'Tricep Pushdown', sets: 3, reps: '12', category: 'strength' }],
    core:       [{ name: 'Weighted Plank', sets: 3, reps: '45 sec', category: 'strength' }, { name: 'Cable Crunch', sets: 3, reps: '15', category: 'strength' }, { name: 'Hanging Leg Raise', sets: 3, reps: '12', category: 'strength' }],
    full_body:  [{ name: 'Power Clean', sets: 4, reps: '5', category: 'strength' }, { name: 'Barbell Squat', sets: 3, reps: '8', category: 'strength' }, { name: 'Bench Press', sets: 3, reps: '8', category: 'strength' }, { name: 'Barbell Row', sets: 3, reps: '8', category: 'strength' }],
  },

  lose_weight: {
    cardio:     [{ name: 'Treadmill Run', sets: 1, reps: '25 min', category: 'cardio', duration: 25 }, { name: 'Jump Rope', sets: 3, reps: '3 min', category: 'cardio', duration: 3 }, { name: 'Cycling', sets: 1, reps: '20 min', category: 'cardio', duration: 20 }],
    hiit:       [{ name: 'Burpees', sets: 4, reps: '15', category: 'cardio' }, { name: 'Jump Squats', sets: 4, reps: '20', category: 'cardio' }, { name: 'Mountain Climbers', sets: 4, reps: '30 sec', category: 'cardio' }, { name: 'High Knees', sets: 4, reps: '30 sec', category: 'cardio' }],
    full_body:  [{ name: 'Bodyweight Squats', sets: 3, reps: '20', category: 'strength' }, { name: 'Push Ups', sets: 3, reps: '15', category: 'strength' }, { name: 'Lunges', sets: 3, reps: '12 each', category: 'strength' }, { name: 'Plank', sets: 3, reps: '45 sec', category: 'strength' }],
    upper_body: [{ name: 'Dumbbell Row', sets: 3, reps: '12', category: 'strength' }, { name: 'Shoulder Press', sets: 3, reps: '12', category: 'strength' }, { name: 'Push Ups', sets: 3, reps: '15', category: 'strength' }],
    lower_body: [{ name: 'Goblet Squat', sets: 3, reps: '15', category: 'strength' }, { name: 'Dumbbell Lunges', sets: 3, reps: '12 each', category: 'strength' }, { name: 'Glute Bridge', sets: 3, reps: '20', category: 'strength' }, { name: 'Step Ups', sets: 3, reps: '12 each', category: 'strength' }],
    core:       [{ name: 'Plank', sets: 3, reps: '45 sec', category: 'strength' }, { name: 'Bicycle Crunches', sets: 3, reps: '20', category: 'strength' }, { name: 'Russian Twists', sets: 3, reps: '20', category: 'strength' }],
    flexibility:[{ name: 'Hip Flexor Stretch', sets: 1, reps: '60 sec each', category: 'flexibility' }, { name: 'Hamstring Stretch', sets: 1, reps: '60 sec', category: 'flexibility' }, { name: 'Foam Rolling', sets: 1, reps: '10 min', category: 'flexibility' }],
  },

  maintain: {
    push:       [{ name: 'Bench Press', sets: 3, reps: '10', category: 'strength' }, { name: 'Shoulder Press', sets: 3, reps: '10', category: 'strength' }, { name: 'Tricep Dips', sets: 3, reps: '12', category: 'strength' }],
    pull:       [{ name: 'Pull Ups', sets: 3, reps: '8-10', category: 'strength' }, { name: 'Dumbbell Row', sets: 3, reps: '12', category: 'strength' }, { name: 'Bicep Curl', sets: 3, reps: '12', category: 'strength' }],
    legs:       [{ name: 'Squat', sets: 3, reps: '12', category: 'strength' }, { name: 'Lunges', sets: 3, reps: '12 each', category: 'strength' }, { name: 'Calf Raises', sets: 3, reps: '20', category: 'strength' }],
    cardio:     [{ name: 'Jogging', sets: 1, reps: '20 min', category: 'cardio', duration: 20 }, { name: 'Jump Rope', sets: 3, reps: '2 min', category: 'cardio' }],
    core:       [{ name: 'Plank', sets: 3, reps: '45 sec', category: 'strength' }, { name: 'Crunches', sets: 3, reps: '20', category: 'strength' }, { name: 'Russian Twists', sets: 3, reps: '20', category: 'strength' }],
    flexibility:[{ name: 'Full Body Stretch', sets: 1, reps: '15 min', category: 'flexibility' }, { name: 'Yoga Flow', sets: 1, reps: '20 min', category: 'flexibility' }],
  },

  improve_endurance: {
    run:        [{ name: 'Easy Run', sets: 1, reps: '30 min', category: 'cardio', duration: 30 }, { name: 'Tempo Run', sets: 1, reps: '20 min', category: 'cardio', duration: 20 }],
    intervals:  [{ name: 'Sprint Intervals', sets: 8, reps: '30 sec sprint / 90 sec walk', category: 'cardio' }, { name: 'Hill Repeats', sets: 6, reps: '1 min', category: 'cardio' }],
    cross:      [{ name: 'Cycling', sets: 1, reps: '30 min', category: 'cardio', duration: 30 }, { name: 'Swimming', sets: 1, reps: '20 min', category: 'cardio', duration: 20 }, { name: 'Rowing Machine', sets: 1, reps: '15 min', category: 'cardio', duration: 15 }],
    strength:   [{ name: 'Bodyweight Squat', sets: 3, reps: '20', category: 'strength' }, { name: 'Push Ups', sets: 3, reps: '15', category: 'strength' }, { name: 'Plank', sets: 3, reps: '60 sec', category: 'strength' }, { name: 'Lunges', sets: 3, reps: '15 each', category: 'strength' }],
    recovery:   [{ name: 'Light Jog', sets: 1, reps: '20 min', category: 'cardio', duration: 20 }, { name: 'Stretching', sets: 1, reps: '15 min', category: 'flexibility' }],
    long_run:   [{ name: 'Long Slow Run', sets: 1, reps: '45-60 min', category: 'cardio', duration: 50 }],
  },
};

// ── Day splits per goal + experience ──────────────────────────────────────────

const SPLITS = {
  gain_muscle: {
    beginner: [
      { focus: 'Full Body Strength',    muscles: ['full_body'] },
      { focus: 'Rest Day',              rest: true },
      { focus: 'Full Body Strength',    muscles: ['full_body'] },
      { focus: 'Rest Day',              rest: true },
      { focus: 'Full Body Strength',    muscles: ['full_body'] },
      { focus: 'Core & Mobility',       muscles: ['core'] },
      { focus: 'Rest Day',              rest: true },
    ],
    intermediate: [
      { focus: 'Chest & Triceps',       muscles: ['chest', 'triceps'] },
      { focus: 'Back & Biceps',         muscles: ['back', 'biceps'] },
      { focus: 'Legs',                  muscles: ['legs'] },
      { focus: 'Shoulders & Core',      muscles: ['shoulders', 'core'] },
      { focus: 'Chest & Back',          muscles: ['chest', 'back'] },
      { focus: 'Arms & Core',           muscles: ['biceps', 'triceps', 'core'] },
      { focus: 'Rest Day',              rest: true },
    ],
    advanced: [
      { focus: 'Chest',                 muscles: ['chest'] },
      { focus: 'Back',                  muscles: ['back'] },
      { focus: 'Legs',                  muscles: ['legs'] },
      { focus: 'Shoulders',             muscles: ['shoulders'] },
      { focus: 'Arms',                  muscles: ['biceps', 'triceps'] },
      { focus: 'Full Body Power',       muscles: ['full_body'] },
      { focus: 'Rest Day',              rest: true },
    ],
  },

  lose_weight: {
    beginner: [
      { focus: 'Cardio',                muscles: ['cardio'] },
      { focus: 'Full Body Circuit',     muscles: ['full_body'] },
      { focus: 'Cardio',                muscles: ['cardio'] },
      { focus: 'Rest Day',              rest: true },
      { focus: 'Full Body Circuit',     muscles: ['full_body'] },
      { focus: 'Light Cardio & Stretch',muscles: ['cardio', 'flexibility'] },
      { focus: 'Rest Day',              rest: true },
    ],
    intermediate: [
      { focus: 'HIIT',                  muscles: ['hiit'] },
      { focus: 'Upper Body + Cardio',   muscles: ['upper_body', 'cardio'] },
      { focus: 'HIIT',                  muscles: ['hiit'] },
      { focus: 'Lower Body',            muscles: ['lower_body'] },
      { focus: 'HIIT + Core',           muscles: ['hiit', 'core'] },
      { focus: 'Active Recovery',       muscles: ['flexibility'] },
      { focus: 'Rest Day',              rest: true },
    ],
    advanced: [
      { focus: 'HIIT + Upper Body',     muscles: ['hiit', 'upper_body'] },
      { focus: 'Cardio + Lower Body',   muscles: ['cardio', 'lower_body'] },
      { focus: 'HIIT Circuit',          muscles: ['hiit'] },
      { focus: 'HIIT + Core',           muscles: ['hiit', 'core'] },
      { focus: 'Full Body Strength',    muscles: ['full_body'] },
      { focus: 'Active Recovery',       muscles: ['flexibility'] },
      { focus: 'Rest Day',              rest: true },
    ],
  },

  maintain: {
    beginner: [
      { focus: 'Push Day',              muscles: ['push'] },
      { focus: 'Cardio',                muscles: ['cardio'] },
      { focus: 'Pull Day',              muscles: ['pull'] },
      { focus: 'Rest Day',              rest: true },
      { focus: 'Legs',                  muscles: ['legs'] },
      { focus: 'Core & Flexibility',    muscles: ['core', 'flexibility'] },
      { focus: 'Rest Day',              rest: true },
    ],
    intermediate: [
      { focus: 'Push Day',              muscles: ['push'] },
      { focus: 'Pull Day',              muscles: ['pull'] },
      { focus: 'Legs',                  muscles: ['legs'] },
      { focus: 'Cardio + Core',         muscles: ['cardio', 'core'] },
      { focus: 'Upper Body',            muscles: ['push', 'pull'] },
      { focus: 'Active Recovery',       muscles: ['flexibility'] },
      { focus: 'Rest Day',              rest: true },
    ],
    advanced: [
      { focus: 'Push Day',              muscles: ['push'] },
      { focus: 'Pull Day',              muscles: ['pull'] },
      { focus: 'Legs',                  muscles: ['legs'] },
      { focus: 'Cardio + Core',         muscles: ['cardio', 'core'] },
      { focus: 'Full Body',             muscles: ['push', 'pull', 'legs'] },
      { focus: 'Mobility & Stretch',    muscles: ['flexibility'] },
      { focus: 'Rest Day',              rest: true },
    ],
  },

  improve_endurance: {
    beginner: [
      { focus: 'Easy Run',              muscles: ['run'] },
      { focus: 'Strength & Core',       muscles: ['strength'] },
      { focus: 'Easy Run',              muscles: ['run'] },
      { focus: 'Rest Day',              rest: true },
      { focus: 'Interval Training',     muscles: ['intervals'] },
      { focus: 'Long Run',              muscles: ['long_run'] },
      { focus: 'Rest Day',              rest: true },
    ],
    intermediate: [
      { focus: 'Interval Run',          muscles: ['intervals'] },
      { focus: 'Strength & Core',       muscles: ['strength'] },
      { focus: 'Tempo Run',             muscles: ['run'] },
      { focus: 'Cross Training',        muscles: ['cross'] },
      { focus: 'Long Run',              muscles: ['long_run'] },
      { focus: 'Recovery Run',          muscles: ['recovery'] },
      { focus: 'Rest Day',              rest: true },
    ],
    advanced: [
      { focus: 'Speed Intervals',       muscles: ['intervals'] },
      { focus: 'Strength + Plyos',      muscles: ['strength', 'intervals'] },
      { focus: 'Tempo Run',             muscles: ['run'] },
      { focus: 'Cross Training',        muscles: ['cross'] },
      { focus: 'Long Run',              muscles: ['long_run'] },
      { focus: 'Recovery Run',          muscles: ['recovery'] },
      { focus: 'Rest Day',              rest: true },
    ],
  },
};

// ── Equipment-based exercise overrides ────────────────────────────────────────
// When user selects NOTHING (home) or EQUIPMENT (dumbbells), replace barbell exercises

const HOME_EXERCISES = {
  gain_muscle: {
    chest:      [{ name: 'Push Ups', sets: 4, reps: '15-20', category: 'strength' }, { name: 'Wide Push Ups', sets: 3, reps: '15', category: 'strength' }, { name: 'Diamond Push Ups', sets: 3, reps: '12', category: 'strength' }],
    back:       [{ name: 'Pull Ups', sets: 4, reps: '8-10', category: 'strength' }, { name: 'Inverted Rows', sets: 3, reps: '12', category: 'strength' }, { name: 'Superman Hold', sets: 3, reps: '15', category: 'strength' }],
    legs:       [{ name: 'Bodyweight Squat', sets: 4, reps: '20', category: 'strength' }, { name: 'Jump Squats', sets: 3, reps: '15', category: 'strength' }, { name: 'Lunges', sets: 3, reps: '15 each', category: 'strength' }, { name: 'Glute Bridge', sets: 3, reps: '20', category: 'strength' }],
    shoulders:  [{ name: 'Pike Push Ups', sets: 4, reps: '12', category: 'strength' }, { name: 'Wall Handstand Hold', sets: 3, reps: '30 sec', category: 'strength' }],
    biceps:     [{ name: 'Chin Ups', sets: 4, reps: '8-10', category: 'strength' }, { name: 'Towel Curl', sets: 3, reps: '12', category: 'strength' }],
    triceps:    [{ name: 'Tricep Dips (Chair)', sets: 4, reps: '15', category: 'strength' }, { name: 'Diamond Push Ups', sets: 3, reps: '12', category: 'strength' }],
    core:       [{ name: 'Plank', sets: 3, reps: '60 sec', category: 'strength' }, { name: 'Bicycle Crunches', sets: 3, reps: '20', category: 'strength' }, { name: 'Leg Raises', sets: 3, reps: '15', category: 'strength' }],
    full_body:  [{ name: 'Burpees', sets: 4, reps: '15', category: 'cardio' }, { name: 'Push Ups', sets: 3, reps: '15', category: 'strength' }, { name: 'Bodyweight Squat', sets: 3, reps: '20', category: 'strength' }, { name: 'Mountain Climbers', sets: 3, reps: '30 sec', category: 'cardio' }],
  },

  // lose_weight home — NO treadmill, NO gym machines
  lose_weight: {
    cardio:     [{ name: 'Jump Rope (Imaginary)', sets: 3, reps: '3 min', category: 'cardio' }, { name: 'High Knees', sets: 4, reps: '45 sec', category: 'cardio' }, { name: 'Jumping Jacks', sets: 3, reps: '50', category: 'cardio' }],
    hiit:       [{ name: 'Burpees', sets: 4, reps: '15', category: 'cardio' }, { name: 'Jump Squats', sets: 4, reps: '20', category: 'cardio' }, { name: 'Mountain Climbers', sets: 4, reps: '30 sec', category: 'cardio' }, { name: 'High Knees', sets: 4, reps: '30 sec', category: 'cardio' }],
    full_body:  [{ name: 'Bodyweight Squats', sets: 3, reps: '20', category: 'strength' }, { name: 'Push Ups', sets: 3, reps: '15', category: 'strength' }, { name: 'Lunges', sets: 3, reps: '12 each', category: 'strength' }, { name: 'Plank', sets: 3, reps: '45 sec', category: 'strength' }],
    upper_body: [{ name: 'Push Ups', sets: 3, reps: '15', category: 'strength' }, { name: 'Pike Push Ups', sets: 3, reps: '12', category: 'strength' }, { name: 'Tricep Dips (Chair)', sets: 3, reps: '15', category: 'strength' }],
    lower_body: [{ name: 'Bodyweight Squat', sets: 3, reps: '20', category: 'strength' }, { name: 'Reverse Lunges', sets: 3, reps: '12 each', category: 'strength' }, { name: 'Glute Bridge', sets: 3, reps: '20', category: 'strength' }, { name: 'Step Ups (Chair)', sets: 3, reps: '12 each', category: 'strength' }],
    core:       [{ name: 'Plank', sets: 3, reps: '45 sec', category: 'strength' }, { name: 'Bicycle Crunches', sets: 3, reps: '20', category: 'strength' }, { name: 'Russian Twists', sets: 3, reps: '20', category: 'strength' }],
    flexibility:[{ name: 'Hip Flexor Stretch', sets: 1, reps: '60 sec each', category: 'flexibility' }, { name: 'Hamstring Stretch', sets: 1, reps: '60 sec', category: 'flexibility' }, { name: 'Foam Rolling', sets: 1, reps: '10 min', category: 'flexibility' }],
  },

  // maintain home
  maintain: {
    push:       [{ name: 'Push Ups', sets: 3, reps: '15', category: 'strength' }, { name: 'Pike Push Ups', sets: 3, reps: '12', category: 'strength' }, { name: 'Tricep Dips (Chair)', sets: 3, reps: '12', category: 'strength' }],
    pull:       [{ name: 'Pull Ups', sets: 3, reps: '8-10', category: 'strength' }, { name: 'Inverted Rows', sets: 3, reps: '12', category: 'strength' }, { name: 'Chin Ups', sets: 3, reps: '8', category: 'strength' }],
    legs:       [{ name: 'Bodyweight Squat', sets: 3, reps: '20', category: 'strength' }, { name: 'Lunges', sets: 3, reps: '12 each', category: 'strength' }, { name: 'Calf Raises', sets: 3, reps: '25', category: 'strength' }],
    cardio:     [{ name: 'Jumping Jacks', sets: 3, reps: '50', category: 'cardio' }, { name: 'High Knees', sets: 3, reps: '45 sec', category: 'cardio' }],
    core:       [{ name: 'Plank', sets: 3, reps: '45 sec', category: 'strength' }, { name: 'Crunches', sets: 3, reps: '20', category: 'strength' }, { name: 'Russian Twists', sets: 3, reps: '20', category: 'strength' }],
    flexibility:[{ name: 'Full Body Stretch', sets: 1, reps: '15 min', category: 'flexibility' }, { name: 'Yoga Flow', sets: 1, reps: '20 min', category: 'flexibility' }],
  },

  // improve_endurance home
  improve_endurance: {
    run:        [{ name: 'Outdoor Run', sets: 1, reps: '30 min', category: 'cardio', duration: 30 }, { name: 'Stair Climbing', sets: 1, reps: '15 min', category: 'cardio', duration: 15 }],
    intervals:  [{ name: 'Sprint Intervals (Outdoor)', sets: 8, reps: '30 sec sprint / 90 sec walk', category: 'cardio' }, { name: 'Burpees', sets: 5, reps: '15', category: 'cardio' }],
    cross:      [{ name: 'Jump Rope', sets: 5, reps: '3 min', category: 'cardio' }, { name: 'Jumping Jacks', sets: 4, reps: '50', category: 'cardio' }, { name: 'High Knees', sets: 4, reps: '45 sec', category: 'cardio' }],
    strength:   [{ name: 'Bodyweight Squat', sets: 3, reps: '20', category: 'strength' }, { name: 'Push Ups', sets: 3, reps: '15', category: 'strength' }, { name: 'Plank', sets: 3, reps: '60 sec', category: 'strength' }, { name: 'Lunges', sets: 3, reps: '15 each', category: 'strength' }],
    recovery:   [{ name: 'Light Outdoor Walk', sets: 1, reps: '20 min', category: 'cardio', duration: 20 }, { name: 'Stretching', sets: 1, reps: '15 min', category: 'flexibility' }],
    long_run:   [{ name: 'Long Outdoor Run', sets: 1, reps: '45-60 min', category: 'cardio', duration: 50 }],
  },

  // EQUIPMENT (dumbbells/bands) — same for all goals, overrides gym exercises
  equipment: {
    chest:      [{ name: 'Dumbbell Bench Press', sets: 4, reps: '10-12', category: 'strength' }, { name: 'Dumbbell Fly', sets: 3, reps: '12', category: 'strength' }, { name: 'Incline Dumbbell Press', sets: 3, reps: '10', category: 'strength' }],
    back:       [{ name: 'Dumbbell Row', sets: 4, reps: '10-12', category: 'strength' }, { name: 'Resistance Band Pull Apart', sets: 3, reps: '15', category: 'strength' }, { name: 'Dumbbell Deadlift', sets: 3, reps: '10', category: 'strength' }],
    legs:       [{ name: 'Dumbbell Squat', sets: 4, reps: '12', category: 'strength' }, { name: 'Dumbbell Lunges', sets: 3, reps: '12 each', category: 'strength' }, { name: 'Dumbbell Romanian Deadlift', sets: 3, reps: '12', category: 'strength' }, { name: 'Goblet Squat', sets: 3, reps: '15', category: 'strength' }],
    shoulders:  [{ name: 'Dumbbell Shoulder Press', sets: 4, reps: '10-12', category: 'strength' }, { name: 'Lateral Raises', sets: 3, reps: '15', category: 'strength' }, { name: 'Front Raises', sets: 3, reps: '12', category: 'strength' }],
    biceps:     [{ name: 'Dumbbell Curl', sets: 4, reps: '12', category: 'strength' }, { name: 'Hammer Curl', sets: 3, reps: '12', category: 'strength' }],
    triceps:    [{ name: 'Dumbbell Overhead Extension', sets: 4, reps: '12', category: 'strength' }, { name: 'Dumbbell Kickback', sets: 3, reps: '12', category: 'strength' }],
    core:       [{ name: 'Plank', sets: 3, reps: '60 sec', category: 'strength' }, { name: 'Dumbbell Russian Twist', sets: 3, reps: '20', category: 'strength' }, { name: 'Leg Raises', sets: 3, reps: '15', category: 'strength' }],
    full_body:  [{ name: 'Dumbbell Thruster', sets: 4, reps: '12', category: 'strength' }, { name: 'Dumbbell Squat', sets: 3, reps: '12', category: 'strength' }, { name: 'Dumbbell Row', sets: 3, reps: '12', category: 'strength' }, { name: 'Dumbbell Shoulder Press', sets: 3, reps: '12', category: 'strength' }],
    cardio:     [{ name: 'Jumping Jacks', sets: 3, reps: '50', category: 'cardio' }, { name: 'High Knees', sets: 3, reps: '45 sec', category: 'cardio' }],
    hiit:       [{ name: 'Dumbbell Burpees', sets: 4, reps: '12', category: 'cardio' }, { name: 'Dumbbell Squat Jump', sets: 4, reps: '15', category: 'cardio' }, { name: 'Mountain Climbers', sets: 4, reps: '30 sec', category: 'cardio' }],
    upper_body: [{ name: 'Dumbbell Row', sets: 3, reps: '12', category: 'strength' }, { name: 'Dumbbell Shoulder Press', sets: 3, reps: '12', category: 'strength' }, { name: 'Push Ups', sets: 3, reps: '15', category: 'strength' }],
    lower_body: [{ name: 'Goblet Squat', sets: 3, reps: '15', category: 'strength' }, { name: 'Dumbbell Lunges', sets: 3, reps: '12 each', category: 'strength' }, { name: 'Glute Bridge', sets: 3, reps: '20', category: 'strength' }],
    flexibility:[{ name: 'Hip Flexor Stretch', sets: 1, reps: '60 sec each', category: 'flexibility' }, { name: 'Hamstring Stretch', sets: 1, reps: '60 sec', category: 'flexibility' }],
  },
};

const getExercisesForDay = (goal, muscles, equipmentType = 'MACHINE') => {
  let bank;
  if (equipmentType === 'NOTHING') {
    // Use goal-specific home bank — no gym equipment at all
    bank = HOME_EXERCISES[goal] || HOME_EXERCISES.gain_muscle;
  } else if (equipmentType === 'EQUIPMENT') {
    // Dumbbells/bands — use equipment bank merged with goal-specific cardio/flexibility
    const goalBank  = EXERCISES[goal] || EXERCISES.maintain;
    const equipBank = HOME_EXERCISES.equipment;
    bank = { ...goalBank, ...equipBank };
  } else {
    // MACHINE — full gym
    bank = EXERCISES[goal] || EXERCISES.maintain;
  }

  const exercises = [];
  const seen = new Set();

  muscles.forEach((muscle) => {
    const pool = bank[muscle] || [];
    pool.forEach((ex) => {
      if (!seen.has(ex.name)) {
        seen.add(ex.name);
        exercises.push({ ...ex, completed: false, completedAt: null });
      }
    });
  });

  return exercises.slice(0, 6);
};

// ── Main generator ─────────────────────────────────────────────────────────────

const generateWeeklyPlan = (profile, equipmentType = 'MACHINE') => {
  const goal            = profile?.goal            || 'maintain';
  const experienceLevel = profile?.experienceLevel || 'beginner';

  const split = SPLITS[goal]?.[experienceLevel]
    || SPLITS[goal]?.beginner
    || SPLITS.maintain.beginner;

  const { weekStart, weekEnd } = getWeekBounds();

  const days = split.map((dayConfig, i) => ({
    dayNumber:   i + 1,
    dayName:     DAY_NAMES[i],
    focus:       dayConfig.focus,
    isRestDay:   dayConfig.rest || false,
    exercises:   dayConfig.rest ? [] : getExercisesForDay(goal, dayConfig.muscles, equipmentType),
    completed:   false,
    completedAt: null,
  }));

  return { weekStart, weekEnd, goal, equipmentType, days, isActive: true, generatedFrom: 'profile' };
};

module.exports = { generateWeeklyPlan };
