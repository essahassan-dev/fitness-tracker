import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return '—';
  return format(new Date(date), fmt);
};

export const formatRelativeDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '—';
  return Number(num).toFixed(decimals);
};

export const formatCalories = (cal) => {
  if (!cal) return '0';
  return Math.round(cal).toLocaleString();
};

export const getMoodEmoji = (mood) => {
  const moods = { great: '🔥', good: '😊', okay: '😐', tired: '😴', bad: '😞' };
  return moods[mood] || '';
};

export const getCategoryColor = (category) => {
  const colors = {
    strength: 'text-blue-400 bg-blue-400/10',
    cardio: 'text-orange-400 bg-orange-400/10',
    flexibility: 'text-purple-400 bg-purple-400/10',
    sports: 'text-yellow-400 bg-yellow-400/10',
    other: 'text-gray-400 bg-gray-400/10',
  };
  return colors[category] || colors.other;
};

export const getMealTypeColor = (type) => {
  const colors = {
    breakfast: 'text-yellow-400 bg-yellow-400/10',
    lunch: 'text-green-400 bg-green-400/10',
    dinner: 'text-blue-400 bg-blue-400/10',
    snack: 'text-purple-400 bg-purple-400/10',
  };
  return colors[type] || 'text-gray-400 bg-gray-400/10';
};

export const getMealTypeIcon = (type) => {
  const icons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
  return icons[type] || '🍽️';
};

export const calculateBMI = (weight, height) => {
  if (!weight || !height) return null;
  const heightM = height / 100;
  return (weight / (heightM * heightM)).toFixed(1);
};

export const getBMICategory = (bmi) => {
  if (!bmi) return null;
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
  if (bmi < 25) return { label: 'Normal', color: 'text-green-400' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-400' };
  return { label: 'Obese', color: 'text-red-400' };
};

export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const truncate = (str, len = 30) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
};

export const getErrorMessage = (error) => {
  return error?.response?.data?.message || error?.message || 'Something went wrong';
};
