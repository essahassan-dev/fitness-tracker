import React, { useState, useEffect, useCallback } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { RiBarChartLine, RiRefreshLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import { workoutAPI, nutritionAPI } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import { defaultChartOptions, lineDataset, barDataset, CHART_COLORS } from '../../utils/chartConfig';
import '../../utils/chartConfig';

const Analytics = () => {
  const [workoutAnalytics, setWorkoutAnalytics] = useState(null);
  const [nutritionAnalytics, setNutritionAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [workoutRes, nutritionRes] = await Promise.all([
        workoutAPI.getAnalytics({ period }),
        nutritionAPI.getAnalytics({ period }),
      ]);
      setWorkoutAnalytics(workoutRes.data.data);
      setNutritionAnalytics(nutritionRes.data.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Workout frequency chart
  const workoutFreqData = {
    labels: workoutAnalytics?.frequency?.map((d) => formatDate(d._id, 'MMM d')) || [],
    datasets: [barDataset('Workouts', workoutAnalytics?.frequency?.map((d) => d.count) || [], CHART_COLORS.green)],
  };

  const caloriesBurnedData = {
    labels: workoutAnalytics?.caloriesBurnedHistory?.map((d) => formatDate(d._id, 'MMM d')) || [],
    datasets: [lineDataset('Calories Burned', workoutAnalytics?.caloriesBurnedHistory?.map((d) => d.caloriesBurned) || [], CHART_COLORS.red)],
  };
  // Category breakdown (doughnut)
  const categoryData = {
    labels: workoutAnalytics?.categoryBreakdown?.map((d) => d._id?.charAt(0).toUpperCase() + d._id?.slice(1)) || [],
    datasets: [{
      data: workoutAnalytics?.categoryBreakdown?.map((d) => d.count) || [],
      backgroundColor: [CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.orange, CHART_COLORS.purple, CHART_COLORS.yellow],
      borderColor: '#0f172a',
      borderWidth: 3,
    }],
  };

  // Nutrition calories chart
  const nutritionCalData = {
    labels: nutritionAnalytics?.dailyCalories?.map((d) => formatDate(d._id, 'MMM d')) || [],
    datasets: [
      lineDataset('Calories', nutritionAnalytics?.dailyCalories?.map((d) => d.calories) || [], CHART_COLORS.orange),
    ],
  };

  // Macros chart
  const macrosData = {
    labels: nutritionAnalytics?.dailyCalories?.map((d) => formatDate(d._id, 'MMM d')) || [],
    datasets: [
      lineDataset('Protein (g)', nutritionAnalytics?.dailyCalories?.map((d) => d.protein) || [], CHART_COLORS.blue),
      lineDataset('Carbs (g)', nutritionAnalytics?.dailyCalories?.map((d) => d.carbs) || [], CHART_COLORS.orange),
      lineDataset('Fat (g)', nutritionAnalytics?.dailyCalories?.map((d) => d.fat) || [], CHART_COLORS.purple),
    ],
  };

  const barOptions = {
    ...defaultChartOptions,
    plugins: { ...defaultChartOptions.plugins, legend: { display: false } },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 16, boxWidth: 12 },
      },
      tooltip: defaultChartOptions.plugins.tooltip,
    },
  };

  const stats = workoutAnalytics?.totalStats;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Deep insights into your fitness journey</p>
        </div>
        <div className="flex items-center gap-2">
          {['7', '30', '90'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'
              }`}
            >
              {p}d
            </button>
          ))}
          <button onClick={fetchAnalytics} className="btn-secondary py-1.5 px-3">
            <RiRefreshLine className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card-sm text-center">
            <p className="text-2xl font-bold text-brand-400">{stats.totalWorkouts || 0}</p>
            <p className="text-dark-400 text-xs mt-1">Total Workouts</p>
          </div>
          <div className="card-sm text-center">
            <p className="text-2xl font-bold text-blue-400">{Math.round(stats.totalDuration || 0)}</p>
            <p className="text-dark-400 text-xs mt-1">Total Minutes</p>
          </div>
          <div className="card-sm text-center">
            <p className="text-2xl font-bold text-orange-400">{Math.round(stats.avgDuration || 0)}</p>
            <p className="text-dark-400 text-xs mt-1">Avg Duration (min)</p>
          </div>
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : (
        <div className="space-y-6">
          {/* Workout frequency */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <h2 className="text-white font-semibold mb-4">Workout Frequency</h2>
              {workoutAnalytics?.frequency?.length > 0 ? (
                <div className="h-56">
                  <Bar data={workoutFreqData} options={barOptions} />
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center">
                  <div className="text-center">
                    <RiBarChartLine className="text-4xl text-dark-700 mx-auto mb-2" />
                    <p className="text-dark-500 text-sm">No workout data for this period</p>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-white font-semibold mb-4">Exercise Categories</h2>
              {workoutAnalytics?.categoryBreakdown?.length > 0 ? (
                <div className="h-56">
                  <Doughnut data={categoryData} options={doughnutOptions} />
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center">
                  <p className="text-dark-500 text-sm">No data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Nutrition charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-white font-semibold mb-4">Daily Calories Consumed</h2>
              {nutritionAnalytics?.dailyCalories?.length > 0 ? (
                <div className="h-52">
                  <Line data={nutritionCalData} options={{ ...defaultChartOptions, plugins: { ...defaultChartOptions.plugins, legend: { display: false } } }} />
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center">
                  <p className="text-dark-500 text-sm">No nutrition data for this period</p>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-white font-semibold mb-4">Calories Burned (Workouts)</h2>
              {workoutAnalytics?.caloriesBurnedHistory?.length > 0 ? (
                <div className="h-52">
                  <Line data={caloriesBurnedData} options={{ ...defaultChartOptions, plugins: { ...defaultChartOptions.plugins, legend: { display: false } } }} />
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center">
                  <p className="text-dark-500 text-sm">No workout data for this period</p>
                </div>
              )}
            </div>

            <div className="card lg:col-span-2">
              <h2 className="text-white font-semibold mb-4">Macros Breakdown</h2>
              {nutritionAnalytics?.dailyCalories?.length > 0 ? (
                <div className="h-52">
                  <Line data={macrosData} options={defaultChartOptions} />
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center">
                  <p className="text-dark-500 text-sm">No nutrition data for this period</p>
                </div>
              )}
            </div>
          </div>

          {/* Strength progress */}
          {workoutAnalytics?.strengthProgress?.length > 0 && (
            <div className="card">
              <h2 className="text-white font-semibold mb-4">Strength Progress</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-800">
                      <th className="text-left text-dark-400 font-medium pb-3">Exercise</th>
                      <th className="text-right text-dark-400 font-medium pb-3">Date</th>
                      <th className="text-right text-dark-400 font-medium pb-3">Max Weight</th>
                      <th className="text-right text-dark-400 font-medium pb-3">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800">
                    {workoutAnalytics.strengthProgress.slice(0, 10).map((item, i) => (
                      <tr key={i} className="hover:bg-dark-800/30 transition-colors">
                        <td className="py-3 text-white font-medium">{item._id?.exercise}</td>
                        <td className="py-3 text-dark-400 text-right">{formatDate(item._id?.date)}</td>
                        <td className="py-3 text-brand-400 font-semibold text-right">{item.maxWeight} kg</td>
                        <td className="py-3 text-dark-300 text-right">{Math.round(item.totalVolume)} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
