require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const WorkoutPlan = require("../models/WorkoutPlan");
const Exercise = require("../models/Exercise");
const DietPlan = require("../models/DietPlan");

const exercises = [
  { name: "Chest Press Machine", description: "Machine-based chest press for beginners", category: "strength", equipmentType: "MACHINE", equipment: ["chest press machine"], muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders"], difficulty: "beginner", goal: ["gain_muscle"], met: 5.0, instructions: ["Sit on machine and grip handles", "Press forward until arms extended", "Slowly return to start"], tips: ["Keep back flat", "Control the movement"], sets: 3, reps: "10-12", restSeconds: 60 },
  { name: "Leg Press Machine", description: "Machine leg press for lower body strength", category: "strength", equipmentType: "MACHINE", equipment: ["leg press machine"], muscleGroup: "quadriceps", secondaryMuscles: ["hamstrings", "glutes"], difficulty: "beginner", goal: ["gain_muscle", "lose_weight"], met: 5.0, instructions: ["Sit and place feet on platform", "Push platform away extending legs", "Slowly lower back"], tips: ["Do not lock knees", "Keep core tight"], sets: 3, reps: "12-15", restSeconds: 60 },
  { name: "Cable Row Machine", description: "Seated cable row for back development", category: "strength", equipmentType: "MACHINE", equipment: ["cable machine"], muscleGroup: "back", secondaryMuscles: ["biceps", "rear deltoids"], difficulty: "intermediate", goal: ["gain_muscle"], met: 5.0, instructions: ["Sit and grab cable handle", "Pull handle to abdomen", "Slowly extend arms back"], tips: ["Keep chest up", "Squeeze shoulder blades"], sets: 3, reps: "10-12", restSeconds: 60 },
  { name: "Lat Pulldown Machine", description: "Lat pulldown for wide back development", category: "strength", equipmentType: "MACHINE", equipment: ["lat pulldown machine"], muscleGroup: "back", secondaryMuscles: ["biceps"], difficulty: "beginner", goal: ["gain_muscle"], met: 5.0, instructions: ["Grip bar wider than shoulders", "Pull bar to upper chest", "Slowly raise bar back"], tips: ["Lean slightly back", "Drive elbows down"], sets: 3, reps: "10-12", restSeconds: 60 },
  { name: "Treadmill Running", description: "Cardio on treadmill for fat loss", category: "cardio", equipmentType: "MACHINE", equipment: ["treadmill"], muscleGroup: "full_body", secondaryMuscles: ["legs", "core"], difficulty: "beginner", goal: ["lose_weight", "improve_endurance"], met: 9.8, instructions: ["Set speed to comfortable pace", "Run with upright posture", "Gradually increase speed"], tips: ["Land midfoot", "Swing arms naturally"], sets: 1, reps: "20-30 min", restSeconds: 0 },
  { name: "Barbell Bench Press", description: "Classic compound chest exercise", category: "strength", equipmentType: "EQUIPMENT", equipment: ["barbell", "bench"], muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders"], difficulty: "intermediate", goal: ["gain_muscle"], met: 6.0, instructions: ["Lie on bench grip bar shoulder width", "Lower bar to chest", "Press bar up explosively"], tips: ["Keep feet flat", "Arch lower back slightly"], sets: 4, reps: "6-10", restSeconds: 90 },
  { name: "Dumbbell Shoulder Press", description: "Overhead press for shoulder mass", category: "strength", equipmentType: "EQUIPMENT", equipment: ["dumbbells"], muscleGroup: "shoulders", secondaryMuscles: ["triceps", "upper chest"], difficulty: "beginner", goal: ["gain_muscle"], met: 5.0, instructions: ["Hold dumbbells at shoulder height", "Press overhead until arms extended", "Lower slowly"], tips: ["Do not flare elbows", "Keep core braced"], sets: 3, reps: "10-12", restSeconds: 60 },
  { name: "Barbell Squat", description: "King of leg exercises for mass", category: "strength", equipmentType: "EQUIPMENT", equipment: ["barbell", "squat rack"], muscleGroup: "quadriceps", secondaryMuscles: ["hamstrings", "glutes", "core"], difficulty: "intermediate", goal: ["gain_muscle", "lose_weight"], met: 6.0, instructions: ["Bar on upper back feet shoulder width", "Squat down until thighs parallel", "Drive through heels to stand"], tips: ["Keep chest up", "Knees track over toes"], sets: 4, reps: "6-10", restSeconds: 120 },
  { name: "Dumbbell Lunges", description: "Unilateral leg exercise for balance and strength", category: "strength", equipmentType: "EQUIPMENT", equipment: ["dumbbells"], muscleGroup: "quadriceps", secondaryMuscles: ["glutes", "hamstrings"], difficulty: "beginner", goal: ["lose_weight", "gain_muscle"], met: 5.0, instructions: ["Hold dumbbells at sides", "Step forward and lower knee", "Push back to start"], tips: ["Keep torso upright", "Step far enough forward"], sets: 3, reps: "12 each leg", restSeconds: 60 },
  { name: "Resistance Band Pull Apart", description: "Band exercise for rear delts and posture", category: "strength", equipmentType: "EQUIPMENT", equipment: ["resistance band"], muscleGroup: "back", secondaryMuscles: ["rear deltoids"], difficulty: "beginner", goal: ["maintain"], met: 3.5, instructions: ["Hold band at chest width", "Pull band apart to sides", "Slowly return"], tips: ["Keep arms straight", "Squeeze shoulder blades"], sets: 3, reps: "15-20", restSeconds: 45 },
  { name: "Push Ups", description: "Classic bodyweight chest and tricep exercise", category: "strength", equipmentType: "NOTHING", equipment: [], muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders", "core"], difficulty: "beginner", goal: ["gain_muscle", "maintain"], met: 4.0, instructions: ["Start in plank position hands shoulder width", "Lower chest to floor", "Push back up"], tips: ["Keep body straight", "Full range of motion"], sets: 3, reps: "10-20", restSeconds: 60 },
  { name: "Pull Ups", description: "Best bodyweight back exercise", category: "strength", equipmentType: "NOTHING", equipment: ["pull up bar"], muscleGroup: "back", secondaryMuscles: ["biceps", "core"], difficulty: "intermediate", goal: ["gain_muscle"], met: 5.0, instructions: ["Hang from bar with overhand grip", "Pull chest to bar", "Lower slowly"], tips: ["Full dead hang at bottom", "Cross feet behind"], sets: 3, reps: "5-10", restSeconds: 90 },
  { name: "Bodyweight Squats", description: "Fundamental lower body movement", category: "strength", equipmentType: "NOTHING", equipment: [], muscleGroup: "quadriceps", secondaryMuscles: ["glutes", "hamstrings"], difficulty: "beginner", goal: ["lose_weight", "maintain"], met: 4.0, instructions: ["Stand feet shoulder width", "Lower hips back and down", "Stand back up"], tips: ["Keep weight in heels", "Chest up throughout"], sets: 3, reps: "15-20", restSeconds: 45 },
  { name: "Burpees", description: "Full body cardio and strength exercise", category: "cardio", equipmentType: "NOTHING", equipment: [], muscleGroup: "full_body", secondaryMuscles: ["chest", "legs", "core"], difficulty: "intermediate", goal: ["lose_weight", "improve_endurance"], met: 8.0, instructions: ["Stand then drop to squat", "Jump feet back to plank", "Do pushup then jump up"], tips: ["Modify by stepping instead of jumping", "Keep core tight"], sets: 3, reps: "10-15", restSeconds: 60 },
  { name: "Plank", description: "Core stability exercise", category: "strength", equipmentType: "NOTHING", equipment: [], muscleGroup: "core", secondaryMuscles: ["shoulders", "back"], difficulty: "beginner", goal: ["maintain", "lose_weight"], met: 3.0, instructions: ["Forearms on floor elbows under shoulders", "Hold body straight", "Breathe steadily"], tips: ["Do not let hips sag", "Squeeze glutes"], sets: 3, reps: "30-60 sec", restSeconds: 45 }
];

const workoutPlans = [
  { name: "Fat Loss Cardio Blast", description: "High intensity cardio to maximize fat burning", category: "cardio", difficulty: "beginner", goal: ["lose_weight"], equipmentType: "NOTHING", duration: 45, caloriesBurned: 400, muscleGroups: ["full_body"], exercises: ["Burpees", "Bodyweight Squats", "Plank"], tags: ["fat loss", "cardio", "home"], gender: "both", bmiRange: { min: 25, max: 100 } },
  { name: "Beginner Machine Strength", description: "Safe machine-based program for beginners", category: "strength", difficulty: "beginner", goal: ["gain_muscle"], equipmentType: "MACHINE", duration: 50, caloriesBurned: 300, muscleGroups: ["full_body"], exercises: ["Chest Press Machine", "Leg Press Machine", "Lat Pulldown Machine"], tags: ["beginner", "machines", "gym"], gender: "both", bmiRange: { min: 0, max: 30 } },
  { name: "Home Bodyweight Circuit", description: "No equipment needed full body workout", category: "hiit", difficulty: "beginner", goal: ["lose_weight", "improve_endurance"], equipmentType: "NOTHING", duration: 30, caloriesBurned: 350, muscleGroups: ["full_body"], exercises: ["Push Ups", "Bodyweight Squats", "Burpees", "Plank"], tags: ["home", "no equipment", "circuit"], gender: "both", bmiRange: { min: 0, max: 100 } },
  { name: "Dumbbell Hypertrophy", description: "Intermediate dumbbell program for muscle growth", category: "strength", difficulty: "intermediate", goal: ["gain_muscle"], equipmentType: "EQUIPMENT", duration: 60, caloriesBurned: 350, muscleGroups: ["upper_body"], exercises: ["Barbell Bench Press", "Dumbbell Shoulder Press", "Dumbbell Lunges"], tags: ["hypertrophy", "dumbbells", "intermediate"], gender: "both", bmiRange: { min: 0, max: 28 } },
  { name: "Advanced Machine Powerbuilding", description: "Advanced machine program for serious gains", category: "strength", difficulty: "advanced", goal: ["gain_muscle"], equipmentType: "MACHINE", duration: 75, caloriesBurned: 450, muscleGroups: ["full_body"], exercises: ["Chest Press Machine", "Cable Row Machine", "Leg Press Machine"], tags: ["advanced", "powerbuilding", "machines"], gender: "both", bmiRange: { min: 0, max: 28 } },
  { name: "Endurance Running Program", description: "Build cardiovascular endurance with running", category: "cardio", difficulty: "intermediate", goal: ["improve_endurance"], equipmentType: "NOTHING", duration: 40, caloriesBurned: 500, muscleGroups: ["legs", "core"], exercises: ["Treadmill Running", "Burpees"], tags: ["running", "endurance", "cardio"], gender: "both", bmiRange: { min: 0, max: 100 } },
  { name: "Beginner Full Body Equipment", description: "Beginner program using basic equipment", category: "strength", difficulty: "beginner", goal: ["gain_muscle", "maintain"], equipmentType: "EQUIPMENT", duration: 45, caloriesBurned: 280, muscleGroups: ["full_body"], exercises: ["Dumbbell Shoulder Press", "Dumbbell Lunges", "Resistance Band Pull Apart"], tags: ["beginner", "equipment", "full body"], gender: "both", bmiRange: { min: 0, max: 100 } },
  { name: "Weight Loss HIIT Home", description: "High intensity interval training for rapid fat loss", category: "hiit", difficulty: "intermediate", goal: ["lose_weight"], equipmentType: "NOTHING", duration: 35, caloriesBurned: 450, muscleGroups: ["full_body"], exercises: ["Burpees", "Push Ups", "Bodyweight Squats", "Plank"], tags: ["hiit", "fat loss", "home", "intense"], gender: "both", bmiRange: { min: 23, max: 100 } }
];

const dietPlans = [
  {
    name: "Calorie Deficit Fat Loss Plan", description: "Structured deficit plan for steady fat loss", goal: ["lose_weight"], dietaryPref: ["none", "halal"], calorieRange: { min: 1400, max: 1800 }, bmiRange: { min: 25, max: 100 }, activityLevel: ["sedentary", "light", "moderate"],
    breakfast: { name: "Oatmeal with Berries", foods: [{ name: "Rolled oats", quantity: "80g", calories: 300, protein: 10, carbs: 55, fat: 6 }, { name: "Mixed berries", quantity: "100g", calories: 50, protein: 1, carbs: 12, fat: 0 }], calories: 350, protein: 12, carbs: 55, fat: 8 },
    lunch: { name: "Grilled Chicken Salad", foods: [{ name: "Chicken breast", quantity: "150g", calories: 250, protein: 35, carbs: 0, fat: 5 }, { name: "Mixed greens", quantity: "100g", calories: 25, protein: 2, carbs: 5, fat: 0 }, { name: "Olive oil dressing", quantity: "15ml", calories: 120, protein: 0, carbs: 0, fat: 14 }], calories: 450, protein: 40, carbs: 25, fat: 15 },
    dinner: { name: "Baked Salmon with Vegetables", foods: [{ name: "Salmon fillet", quantity: "180g", calories: 350, protein: 40, carbs: 0, fat: 18 }, { name: "Steamed broccoli", quantity: "150g", calories: 50, protein: 4, carbs: 10, fat: 0 }, { name: "Brown rice", quantity: "80g", calories: 100, protein: 2, carbs: 22, fat: 1 }], calories: 500, protein: 45, carbs: 20, fat: 18 },
    snacks: { name: "Greek Yogurt and Apple", foods: [{ name: "Greek yogurt", quantity: "150g", calories: 130, protein: 13, carbs: 8, fat: 3 }, { name: "Apple", quantity: "1 medium", calories: 80, protein: 0, carbs: 21, fat: 0 }], calories: 200, protein: 15, carbs: 30, fat: 3 },
    tags: ["deficit", "fat loss", "high protein"]
  },
  {
    name: "Muscle Gain High Protein Plan", description: "Calorie surplus plan optimized for muscle growth", goal: ["gain_muscle"], dietaryPref: ["none", "halal"], calorieRange: { min: 2500, max: 3500 }, bmiRange: { min: 0, max: 25 }, activityLevel: ["moderate", "active", "very_active"],
    breakfast: { name: "Power Breakfast", foods: [{ name: "Whole eggs", quantity: "3 eggs", calories: 210, protein: 18, carbs: 2, fat: 15 }, { name: "Oatmeal", quantity: "100g", calories: 380, protein: 13, carbs: 68, fat: 7 }], calories: 550, protein: 30, carbs: 70, fat: 15 },
    lunch: { name: "Rice and Chicken Bowl", foods: [{ name: "Chicken breast", quantity: "200g", calories: 330, protein: 62, carbs: 0, fat: 7 }, { name: "White rice", quantity: "150g", calories: 195, protein: 4, carbs: 43, fat: 0 }, { name: "Broccoli", quantity: "100g", calories: 34, protein: 3, carbs: 7, fat: 0 }], calories: 700, protein: 55, carbs: 80, fat: 10 },
    dinner: { name: "Steak and Sweet Potato", foods: [{ name: "Beef steak", quantity: "200g", calories: 450, protein: 55, carbs: 0, fat: 25 }, { name: "Sweet potato", quantity: "200g", calories: 180, protein: 4, carbs: 42, fat: 0 }], calories: 750, protein: 60, carbs: 65, fat: 20 },
    snacks: { name: "Protein Shake and Nuts", foods: [{ name: "Whey protein shake", quantity: "1 scoop", calories: 150, protein: 25, carbs: 5, fat: 3 }, { name: "Mixed nuts", quantity: "50g", calories: 300, protein: 8, carbs: 10, fat: 26 }], calories: 400, protein: 35, carbs: 25, fat: 18 },
    tags: ["surplus", "muscle gain", "high protein"]
  },
  {
    name: "Vegetarian Balanced Plan", description: "Complete vegetarian nutrition for fitness", goal: ["maintain", "lose_weight"], dietaryPref: ["vegetarian"], calorieRange: { min: 1600, max: 2200 }, bmiRange: { min: 0, max: 100 }, activityLevel: ["light", "moderate", "active"],
    breakfast: { name: "Smoothie Bowl", foods: [{ name: "Banana", quantity: "1 large", calories: 105, protein: 1, carbs: 27, fat: 0 }, { name: "Greek yogurt", quantity: "150g", calories: 130, protein: 13, carbs: 8, fat: 3 }, { name: "Granola", quantity: "50g", calories: 200, protein: 5, carbs: 35, fat: 6 }], calories: 400, protein: 15, carbs: 60, fat: 10 },
    lunch: { name: "Lentil Soup and Bread", foods: [{ name: "Red lentil soup", quantity: "300ml", calories: 250, protein: 18, carbs: 40, fat: 3 }, { name: "Whole grain bread", quantity: "2 slices", calories: 160, protein: 6, carbs: 30, fat: 2 }], calories: 500, protein: 25, carbs: 70, fat: 8 },
    dinner: { name: "Paneer Curry with Rice", foods: [{ name: "Paneer", quantity: "150g", calories: 350, protein: 25, carbs: 5, fat: 26 }, { name: "Brown rice", quantity: "100g", calories: 216, protein: 5, carbs: 45, fat: 2 }], calories: 600, protein: 30, carbs: 75, fat: 15 },
    snacks: { name: "Nuts and Fruit", foods: [{ name: "Mixed nuts", quantity: "30g", calories: 180, protein: 5, carbs: 8, fat: 16 }, { name: "Orange", quantity: "1 medium", calories: 62, protein: 1, carbs: 15, fat: 0 }], calories: 250, protein: 8, carbs: 30, fat: 12 },
    tags: ["vegetarian", "balanced", "plant-based"]
  },
  {
    name: "Keto Fat Burning Plan", description: "Low carb high fat plan for ketosis and fat loss", goal: ["lose_weight"], dietaryPref: ["keto"], calorieRange: { min: 1500, max: 2000 }, bmiRange: { min: 25, max: 100 }, activityLevel: ["sedentary", "light", "moderate"],
    breakfast: { name: "Keto Eggs and Avocado", foods: [{ name: "Scrambled eggs", quantity: "3 eggs", calories: 210, protein: 18, carbs: 2, fat: 15 }, { name: "Avocado", quantity: "half", calories: 160, protein: 2, carbs: 9, fat: 15 }, { name: "Bacon", quantity: "2 strips", calories: 86, protein: 6, carbs: 0, fat: 7 }], calories: 500, protein: 30, carbs: 5, fat: 40 },
    lunch: { name: "Tuna Salad", foods: [{ name: "Canned tuna", quantity: "150g", calories: 180, protein: 40, carbs: 0, fat: 2 }, { name: "Mayonnaise", quantity: "30g", calories: 200, protein: 0, carbs: 1, fat: 22 }, { name: "Lettuce", quantity: "100g", calories: 15, protein: 1, carbs: 3, fat: 0 }], calories: 450, protein: 40, carbs: 5, fat: 28 },
    dinner: { name: "Grilled Chicken and Cauliflower", foods: [{ name: "Chicken thigh", quantity: "200g", calories: 330, protein: 40, carbs: 0, fat: 18 }, { name: "Cauliflower rice", quantity: "200g", calories: 50, protein: 4, carbs: 10, fat: 0 }], calories: 500, protein: 45, carbs: 10, fat: 25 },
    snacks: { name: "Cheese and Almonds", foods: [{ name: "Cheddar cheese", quantity: "50g", calories: 200, protein: 12, carbs: 1, fat: 17 }, { name: "Almonds", quantity: "30g", calories: 174, protein: 6, carbs: 6, fat: 15 }], calories: 300, protein: 15, carbs: 5, fat: 25 },
    tags: ["keto", "low carb", "fat loss"]
  },
  {
    name: "Maintenance Balanced Plan", description: "Balanced nutrition to maintain current weight", goal: ["maintain"], dietaryPref: ["none", "halal"], calorieRange: { min: 1800, max: 2500 }, bmiRange: { min: 18.5, max: 25 }, activityLevel: ["light", "moderate", "active"],
    breakfast: { name: "Toast and Eggs", foods: [{ name: "Whole grain toast", quantity: "2 slices", calories: 160, protein: 6, carbs: 30, fat: 2 }, { name: "Fried eggs", quantity: "2 eggs", calories: 180, protein: 12, carbs: 1, fat: 14 }], calories: 400, protein: 20, carbs: 45, fat: 12 },
    lunch: { name: "Turkey Sandwich", foods: [{ name: "Turkey breast", quantity: "100g", calories: 135, protein: 30, carbs: 0, fat: 1 }, { name: "Whole grain bread", quantity: "2 slices", calories: 160, protein: 6, carbs: 30, fat: 2 }, { name: "Side salad", quantity: "100g", calories: 30, protein: 2, carbs: 6, fat: 0 }], calories: 550, protein: 35, carbs: 55, fat: 15 },
    dinner: { name: "Pasta with Meat Sauce", foods: [{ name: "Whole wheat pasta", quantity: "100g", calories: 350, protein: 13, carbs: 70, fat: 2 }, { name: "Lean ground beef", quantity: "100g", calories: 215, protein: 26, carbs: 0, fat: 12 }], calories: 650, protein: 35, carbs: 80, fat: 15 },
    snacks: { name: "Banana and Peanut Butter", foods: [{ name: "Banana", quantity: "1 medium", calories: 105, protein: 1, carbs: 27, fat: 0 }, { name: "Peanut butter", quantity: "2 tbsp", calories: 190, protein: 8, carbs: 7, fat: 16 }], calories: 300, protein: 10, carbs: 40, fat: 12 },
    tags: ["maintenance", "balanced", "moderate calories"]
  },
  {
    name: "Endurance Athlete Carb Plan", description: "High carb plan to fuel endurance training", goal: ["improve_endurance"], dietaryPref: ["none", "vegetarian"], calorieRange: { min: 2500, max: 3500 }, bmiRange: { min: 0, max: 100 }, activityLevel: ["active", "very_active"],
    breakfast: { name: "Carb Loading Breakfast", foods: [{ name: "Pancakes", quantity: "3 medium", calories: 450, protein: 12, carbs: 80, fat: 8 }, { name: "Honey", quantity: "2 tbsp", calories: 128, protein: 0, carbs: 35, fat: 0 }], calories: 600, protein: 15, carbs: 100, fat: 10 },
    lunch: { name: "Rice Bowl", foods: [{ name: "White rice", quantity: "200g", calories: 260, protein: 5, carbs: 57, fat: 0 }, { name: "Chicken breast", quantity: "150g", calories: 248, protein: 46, carbs: 0, fat: 5 }, { name: "Mixed vegetables", quantity: "150g", calories: 75, protein: 4, carbs: 15, fat: 0 }], calories: 750, protein: 45, carbs: 95, fat: 12 },
    dinner: { name: "Pasta and Salmon", foods: [{ name: "Pasta", quantity: "150g", calories: 525, protein: 18, carbs: 105, fat: 3 }, { name: "Salmon", quantity: "150g", calories: 280, protein: 39, carbs: 0, fat: 13 }], calories: 700, protein: 40, carbs: 90, fat: 15 },
    snacks: { name: "Energy Bars and Banana", foods: [{ name: "Energy bar", quantity: "1 bar", calories: 250, protein: 8, carbs: 45, fat: 6 }, { name: "Banana", quantity: "1 large", calories: 121, protein: 1, carbs: 31, fat: 0 }], calories: 400, protein: 12, carbs: 70, fat: 8 },
    tags: ["endurance", "high carb", "athlete"]
  }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    await WorkoutPlan.deleteMany({});
    await Exercise.deleteMany({});
    await DietPlan.deleteMany({});
    const ex = await Exercise.insertMany(exercises);
    const wp = await WorkoutPlan.insertMany(workoutPlans);
    const dp = await DietPlan.insertMany(dietPlans);
    console.log(`Seeded: ${ex.length} exercises, ${wp.length} workout plans, ${dp.length} diet plans`);
    console.log("Run: npm run seed-recommendations");
  } catch (err) {
    console.error("Seed error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
