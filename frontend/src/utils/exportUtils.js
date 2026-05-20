import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { format } from 'date-fns';

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (date) => {
  if (!date) return '—';
  try { return format(new Date(date), 'MMM d, yyyy'); } catch { return '—'; }
};

const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const timestamp = () => format(new Date(), 'yyyy-MM-dd');

// ── PDF base setup ─────────────────────────────────────────────────────────────

const createPDF = (title, subtitle = '') => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header bar
  doc.setFillColor(15, 23, 42);       // dark-950
  doc.rect(0, 0, 210, 28, 'F');

  // Logo text
  doc.setTextColor(34, 197, 94);      // brand-500
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FitStack', 14, 12);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(title, 14, 20);

  // Subtitle / date
  doc.setTextColor(100, 116, 139);    // dark-400
  doc.setFontSize(8);
  doc.text(subtitle || `Generated on ${format(new Date(), 'MMMM d, yyyy')}`, 14, 26);

  // Right side date
  doc.text(timestamp(), 196, 26, { align: 'right' });

  return doc;
};

const pdfTableStyle = {
  headStyles: {
    fillColor: [30, 41, 59],          // dark-800
    textColor: [148, 163, 184],       // dark-400
    fontStyle: 'bold',
    fontSize: 8,
  },
  bodyStyles: {
    fillColor: [15, 23, 42],          // dark-950
    textColor: [241, 245, 249],       // white
    fontSize: 8,
    lineColor: [30, 41, 59],
    lineWidth: 0.1,
  },
  alternateRowStyles: {
    fillColor: [22, 32, 51],
  },
  margin: { top: 35, left: 14, right: 14 },
};

// ── WORKOUTS ───────────────────────────────────────────────────────────────────

export const exportWorkoutsPDF = (workouts, userName = '') => {
  const doc = createPDF('Workout History', `${userName} · ${workouts.length} sessions`);

  const rows = workouts.map((w) => [
    formatDate(w.date),
    w.title,
    w.exercises?.length || 0,
    w.duration ? `${w.duration} min` : '—',
    w.caloriesBurned ? `${w.caloriesBurned} kcal` : '—',
    w.mood || '—',
  ]);

  autoTable(doc, {
    head: [['Date', 'Workout', 'Exercises', 'Duration', 'Calories Burned', 'Mood']],
    body: rows,
    ...pdfTableStyle,
  });

  // Exercise detail pages
  workouts.forEach((w) => {
    if (!w.exercises?.length) return;
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(w.title, 14, 10);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(formatDate(w.date), 14, 16);

    const exRows = w.exercises.map((ex) => [
      ex.name,
      ex.category,
      ex.sets ? `${ex.sets} sets` : '—',
      ex.reps ? `${ex.reps} reps` : ex.duration ? `${ex.duration} min` : '—',
      ex.weight ? `${ex.weight} kg` : '—',
      ex.caloriesBurned ? `${ex.caloriesBurned} kcal` : '—',
    ]);

    autoTable(doc, {
      head: [['Exercise', 'Category', 'Sets', 'Reps/Duration', 'Weight', 'Burned']],
      body: exRows,
      ...pdfTableStyle,
      margin: { top: 22, left: 14, right: 14 },
    });
  });

  doc.save(`FitStack-workouts-${timestamp()}.pdf`);
};

export const exportWorkoutsCSV = (workouts) => {
  const rows = [];
  workouts.forEach((w) => {
    if (!w.exercises?.length) {
      rows.push({
        Date: formatDate(w.date),
        Workout: w.title,
        Exercise: '',
        Category: '',
        Sets: '',
        Reps: '',
        Weight_kg: '',
        Duration_min: w.duration || '',
        Calories_Burned: w.caloriesBurned || '',
        Mood: w.mood || '',
        Notes: w.notes || '',
      });
    } else {
      w.exercises.forEach((ex) => {
        rows.push({
          Date: formatDate(w.date),
          Workout: w.title,
          Exercise: ex.name,
          Category: ex.category,
          Sets: ex.sets || '',
          Reps: ex.reps || '',
          Weight_kg: ex.weight || '',
          Duration_min: ex.duration || w.duration || '',
          Calories_Burned: ex.caloriesBurned || w.caloriesBurned || '',
          Mood: w.mood || '',
          Notes: ex.notes || w.notes || '',
        });
      });
    }
  });

  const csv = Papa.unparse(rows);
  downloadFile(new Blob([csv], { type: 'text/csv' }), `FitStack-workouts-${timestamp()}.csv`);
};

// ── NUTRITION ──────────────────────────────────────────────────────────────────

export const exportNutritionPDF = (entries, userName = '') => {
  const doc = createPDF('Nutrition Log', `${userName} · ${entries.length} entries`);

  const rows = entries.map((e) => [
    formatDate(e.date),
    e.mealType.charAt(0).toUpperCase() + e.mealType.slice(1),
    e.foods?.map((f) => f.name).join(', ') || '—',
    `${Math.round(e.totalCalories)} kcal`,
    `${Math.round(e.totalProtein)}g`,
    `${Math.round(e.totalCarbs)}g`,
    `${Math.round(e.totalFat)}g`,
  ]);

  autoTable(doc, {
    head: [['Date', 'Meal', 'Foods', 'Calories', 'Protein', 'Carbs', 'Fat']],
    body: rows,
    ...pdfTableStyle,
    columnStyles: { 2: { cellWidth: 55 } },
  });

  // Summary section
  const totalCal  = entries.reduce((s, e) => s + e.totalCalories, 0);
  const totalProt = entries.reduce((s, e) => s + e.totalProtein,  0);
  const totalCarb = entries.reduce((s, e) => s + e.totalCarbs,    0);
  const totalFat  = entries.reduce((s, e) => s + e.totalFat,      0);
  const days      = new Set(entries.map((e) => formatDate(e.date))).size;

  const finalY = doc.lastAutoTable.finalY + 8;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(14, finalY, 182, 22, 3, 3, 'F');
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text('TOTALS', 20, finalY + 7);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Math.round(totalCal).toLocaleString()} kcal`, 20, finalY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Protein: ${Math.round(totalProt)}g`, 80, finalY + 15);
  doc.text(`Carbs: ${Math.round(totalCarb)}g`, 120, finalY + 15);
  doc.text(`Fat: ${Math.round(totalFat)}g`, 155, finalY + 15);
  doc.text(`Avg/day: ${Math.round(totalCal / (days || 1))} kcal`, 20, finalY + 20);

  doc.save(`FitStack-nutrition-${timestamp()}.pdf`);
};

export const exportNutritionCSV = (entries) => {
  const rows = [];
  entries.forEach((e) => {
    e.foods?.forEach((f) => {
      rows.push({
        Date: formatDate(e.date),
        Meal_Type: e.mealType,
        Food: f.name,
        Quantity: f.quantity,
        Unit: f.unit,
        Calories: f.calories,
        Protein_g: f.protein,
        Carbs_g: f.carbs,
        Fat_g: f.fat,
        Meal_Total_Calories: e.totalCalories,
      });
    });
  });

  const csv = Papa.unparse(rows);
  downloadFile(new Blob([csv], { type: 'text/csv' }), `FitStack-nutrition-${timestamp()}.csv`);
};

// ── PROGRESS ───────────────────────────────────────────────────────────────────

export const exportProgressPDF = (entries, userName = '') => {
  const doc = createPDF('Progress Report', `${userName} · ${entries.length} entries`);

  const rows = entries.map((e) => [
    formatDate(e.date),
    e.weight ? `${e.weight} kg` : '—',
    e.bodyFat ? `${e.bodyFat}%` : '—',
    e.measurements?.chest  ? `${e.measurements.chest}cm`  : '—',
    e.measurements?.waist  ? `${e.measurements.waist}cm`  : '—',
    e.measurements?.hips   ? `${e.measurements.hips}cm`   : '—',
    e.measurements?.biceps ? `${e.measurements.biceps}cm` : '—',
    e.notes || '—',
  ]);

  autoTable(doc, {
    head: [['Date', 'Weight', 'Body Fat', 'Chest', 'Waist', 'Hips', 'Biceps', 'Notes']],
    body: rows,
    ...pdfTableStyle,
  });

  // Weight change summary
  const withWeight = entries.filter((e) => e.weight).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (withWeight.length >= 2) {
    const first = withWeight[0];
    const last  = withWeight[withWeight.length - 1];
    const diff  = (last.weight - first.weight).toFixed(1);
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(14, finalY, 182, 18, 3, 3, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('WEIGHT CHANGE', 20, finalY + 7);
    doc.setTextColor(diff < 0 ? [34, 197, 94] : [239, 68, 68]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${diff > 0 ? '+' : ''}${diff} kg`, 20, finalY + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`${first.weight}kg → ${last.weight}kg  ·  ${formatDate(first.date)} to ${formatDate(last.date)}`, 50, finalY + 15);
  }

  doc.save(`FitStack-progress-${timestamp()}.pdf`);
};

export const exportProgressCSV = (entries) => {
  const rows = entries.map((e) => ({
    Date: formatDate(e.date),
    Weight_kg: e.weight || '',
    Body_Fat_pct: e.bodyFat || '',
    Chest_cm: e.measurements?.chest  || '',
    Waist_cm: e.measurements?.waist  || '',
    Hips_cm:  e.measurements?.hips   || '',
    Biceps_cm:e.measurements?.biceps || '',
    Thighs_cm:e.measurements?.thighs || '',
    Notes: e.notes || '',
  }));

  const csv = Papa.unparse(rows);
  downloadFile(new Blob([csv], { type: 'text/csv' }), `FitStack-progress-${timestamp()}.csv`);
};

// ── FULL REPORT (all sections) ─────────────────────────────────────────────────

export const exportFullReportPDF = (data, userName = '') => {
  const { workouts = [], nutrition = [], progress = [] } = data;
  const doc = createPDF('Complete Fitness Report', `${userName} · Full export`);

  // Summary page
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, 38);

  const summaryData = [
    ['Total Workouts',       workouts.length],
    ['Total Meals Logged',   nutrition.length],
    ['Progress Entries',     progress.length],
    ['Total Calories Burned',`${workouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0).toLocaleString()} kcal`],
    ['Total Calories Consumed', `${Math.round(nutrition.reduce((s, e) => s + e.totalCalories, 0)).toLocaleString()} kcal`],
    ['Latest Weight',        progress[0]?.weight ? `${progress[0].weight} kg` : '—'],
  ];

  autoTable(doc, {
    body: summaryData,
    ...pdfTableStyle,
    margin: { top: 42, left: 14, right: 14 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: [148, 163, 184] }, 1: { textColor: [255, 255, 255] } },
  });

  // Workouts section
  if (workouts.length > 0) {
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Workouts', 14, 12);

    autoTable(doc, {
      head: [['Date', 'Workout', 'Exercises', 'Duration', 'Calories Burned']],
      body: workouts.map((w) => [
        formatDate(w.date), w.title,
        w.exercises?.length || 0,
        w.duration ? `${w.duration} min` : '—',
        w.caloriesBurned ? `${w.caloriesBurned} kcal` : '—',
      ]),
      ...pdfTableStyle,
      margin: { top: 22, left: 14, right: 14 },
    });
  }

  // Nutrition section
  if (nutrition.length > 0) {
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(249, 115, 22);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Nutrition Log', 14, 12);

    autoTable(doc, {
      head: [['Date', 'Meal', 'Calories', 'Protein', 'Carbs', 'Fat']],
      body: nutrition.map((e) => [
        formatDate(e.date),
        e.mealType,
        `${Math.round(e.totalCalories)} kcal`,
        `${Math.round(e.totalProtein)}g`,
        `${Math.round(e.totalCarbs)}g`,
        `${Math.round(e.totalFat)}g`,
      ]),
      ...pdfTableStyle,
      margin: { top: 22, left: 14, right: 14 },
    });
  }

  // Progress section
  if (progress.length > 0) {
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(168, 85, 247);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Progress Tracking', 14, 12);

    autoTable(doc, {
      head: [['Date', 'Weight', 'Body Fat', 'Waist', 'Chest', 'Notes']],
      body: progress.map((e) => [
        formatDate(e.date),
        e.weight ? `${e.weight} kg` : '—',
        e.bodyFat ? `${e.bodyFat}%` : '—',
        e.measurements?.waist  ? `${e.measurements.waist}cm`  : '—',
        e.measurements?.chest  ? `${e.measurements.chest}cm`  : '—',
        e.notes || '—',
      ]),
      ...pdfTableStyle,
      margin: { top: 22, left: 14, right: 14 },
    });
  }

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`FitStack · Page ${i} of ${pageCount}`, 105, 292, { align: 'center' });
  }

  doc.save(`FitStack-full-report-${timestamp()}.pdf`);
};
