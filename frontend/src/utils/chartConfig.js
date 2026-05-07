import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#94a3b8',
        font: { family: 'Inter', size: 12 },
        boxWidth: 12,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: '#1e293b', drawBorder: false },
      ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
    },
    y: {
      grid: { color: '#1e293b', drawBorder: false },
      ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
    },
  },
};

export const lineDataset = (label, data, color = '#22c55e') => ({
  label,
  data,
  borderColor: color,
  backgroundColor: `${color}20`,
  borderWidth: 2,
  pointBackgroundColor: color,
  pointBorderColor: '#0f172a',
  pointBorderWidth: 2,
  pointRadius: 4,
  pointHoverRadius: 6,
  tension: 0.4,
  fill: true,
});

export const barDataset = (label, data, color = '#22c55e') => ({
  label,
  data,
  backgroundColor: `${color}80`,
  borderColor: color,
  borderWidth: 1,
  borderRadius: 6,
  borderSkipped: false,
});

export const CHART_COLORS = {
  green: '#22c55e',
  blue: '#3b82f6',
  orange: '#f97316',
  purple: '#a855f7',
  red: '#ef4444',
  yellow: '#eab308',
  cyan: '#06b6d4',
};
