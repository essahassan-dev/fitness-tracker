import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../../../services/api';
import DateRangeFilter from '../shared/DateRangeFilter';
import ExportButton from '../shared/ExportButton';
import { SkeletonKPI } from '../shared/SkeletonKPI';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

const MetricCard = ({ label, value, sub, color }) => (
  <div className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
    <p className="text-slate-500 text-xs font-medium mb-2">{label}</p>
    <p className="text-2xl font-black mb-1" style={{ color }}>{value}</p>
    {sub && <p className="text-slate-600 text-xs">{sub}</p>}
  </div>
);

const SAAnalyticsPage = () => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange]     = useState({});

  const load = async (r = {}) => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getDashboardStats(r);
      setStats(res.data.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const kpis   = stats?.kpis   || {};
  const charts = stats?.charts || {};

  const businessGrowth = (charts.businessGrowth || []).map(d => ({ month:d._id, businesses:d.count }));
  const userGrowth     = (charts.userGrowth     || []).map(d => ({ month:d._id, users:d.count }));
  const revenueData    = (charts.revenueOverTime || []).map(d => ({ month:d._id, revenue:d.revenue }));

  const mrr = kpis.monthlyRevenue || 0;
  const arr = mrr * 12;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Platform-wide growth, revenue and engagement metrics</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeFilter onChange={r => { setRange(r); load(r); }} />
          <ExportButton onExport={() => toast.success('Exporting analytics...')} formats={['csv']} />
        </div>
      </div>

      {/* Revenue metrics */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-3">Revenue</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loading ? [...Array(4)].map((_,i) => <SkeletonKPI key={i} />) : (
            <>
              <MetricCard label="MRR"          value={`$${mrr.toFixed(2)}`}               color="#fbbf24" sub="Monthly Recurring Revenue" />
              <MetricCard label="ARR"          value={`$${arr.toFixed(2)}`}               color="#fb923c" sub="Annual Recurring Revenue" />
              <MetricCard label="Total Revenue" value={`$${(kpis.totalRevenue||0).toFixed(2)}`} color="#4ade80" sub="All time" />
              <MetricCard label="Pending"      value={kpis.pendingRequests||0}             color="#f87171" sub="Subscription requests" />
            </>
          )}
        </div>
      </div>

      {/* Growth metrics */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-3">Growth</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loading ? [...Array(4)].map((_,i) => <SkeletonKPI key={i} />) : (
            <>
              <MetricCard label="Total Businesses" value={kpis.totalBusinesses||0}   color="#a78bfa" />
              <MetricCard label="Active Businesses" value={kpis.activeBusinesses||0} color="#4ade80" />
              <MetricCard label="Total Users"       value={kpis.totalUsers||0}       color="#60a5fa" />
              <MetricCard label="New This Month"    value={kpis.newUsersThisMonth||0} color="#c084fc" />
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        {[
          { title:'Business Growth', data:businessGrowth, key:'businesses', color:'#a78bfa' },
          { title:'User Growth',     data:userGrowth,     key:'users',       color:'#60a5fa' },
        ].map(c => (
          <div key={c.title} className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-white font-semibold text-sm mb-4">{c.title}</h3>
            {loading ? <div className="h-40 rounded-xl animate-pulse bg-white/5" /> : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={c.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:10 }} />
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} />
                  <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff' }} />
                  <Line type="monotone" dataKey={c.key} stroke={c.color} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        ))}

        <div className="rounded-2xl p-5 md:col-span-2" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-white font-semibold text-sm mb-4">Revenue Over Time</h3>
          {loading ? <div className="h-48 rounded-xl animate-pulse bg-white/5" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:10 }} />
                <YAxis tick={{ fill:'#64748b', fontSize:10 }} />
                <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#fff' }} formatter={v => [`$${v}`,'Revenue']} />
                <Bar dataKey="revenue" fill="#fbbf24" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default SAAnalyticsPage;
