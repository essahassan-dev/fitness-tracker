import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../../../services/api';
import KPIGrid from './KPIGrid';
import DateRangeFilter from '../shared/DateRangeFilter';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#a78bfa','#60a5fa','#4ade80','#fbbf24','#f87171','#34d399','#fb923c','#c084fc'];

const ChartCard = ({ title, children, loading }) => (
  <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <h3 className="text-white font-semibold text-sm mb-4">{title}</h3>
    {loading ? (
      <div className="h-48 rounded-xl animate-pulse bg-white/5" />
    ) : children}
  </div>
);

const SAOverviewPage = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [range,   setRange]   = useState({});

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getDashboardStats(params);
      setStats(res.data.data);
    } catch (err) {
      setError(err);
      toast.error('Failed to load dashboard stats');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRange = (r) => { setRange(r); load(r); };

  const charts = stats?.charts || {};
  const businessGrowth = (charts.businessGrowth || []).map(d => ({ month: d._id, businesses: d.count }));
  const userGrowth     = (charts.userGrowth     || []).map(d => ({ month: d._id, users: d.count }));
  const revenueData    = (charts.revenueOverTime || []).map(d => ({ month: d._id, revenue: d.revenue }));
  const planDist       = (charts.planDistribution || []).map(d => ({ name: d._id || 'Free', value: d.count }));
  const activeVsInactive = (charts.activeVsInactive || []).map(d => ({ status: d._id, count: d.count }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Platform Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time KPIs and analytics for your FitStack platform</p>
        </div>
        <DateRangeFilter onChange={handleRange} />
      </div>

      {/* KPIs */}
      <KPIGrid data={stats} loading={loading} error={error} />

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        <ChartCard title="Business Growth" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={businessGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} />
              <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff' }} />
              <Line type="monotone" dataKey="businesses" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User Growth" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} />
              <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff' }} />
              <Line type="monotone" dataKey="users" stroke="#60a5fa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Over Time" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} />
              <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff' }} formatter={(v) => [`$${v}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#fbbf24" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Subscription Distribution" loading={loading}>
          {planDist.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-16">No plan data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {planDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Active vs Inactive Businesses" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activeVsInactive} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill:'#64748b', fontSize:11 }} />
              <YAxis dataKey="status" type="category" tick={{ fill:'#64748b', fontSize:11 }} width={80} />
              <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff' }} />
              <Bar dataKey="count" radius={[0,4,4,0]}>
                {activeVsInactive.map((e, i) => <Cell key={i} fill={e.status === 'active' ? '#4ade80' : '#f87171'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default SAOverviewPage;
