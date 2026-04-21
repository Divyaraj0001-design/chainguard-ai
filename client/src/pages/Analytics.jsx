import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { getAnalyticsOverview, getTimeseries, getRoutePerformance, getRiskDistribution } from '../services/api';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { TrendingUp, Award, Target } from 'lucide-react';

const RISK_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e'];

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [routePerf, setRoutePerf] = useState([]);
  const [riskDist, setRiskDist] = useState([]);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    getAnalyticsOverview().then(r => setOverview(r.data)).catch(() => {});
    getTimeseries(period).then(r => setTimeseries(r.data || [])).catch(() => {});
    getRoutePerformance().then(r => setRoutePerf(r.data || [])).catch(() => {});
    getRiskDistribution().then(r => setRiskDist(r.data || [])).catch(() => {});
  }, [period]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Analytics" subtitle="Historical disruption data, route performance, and resolution metrics" />
      <div className="flex-1 p-6 space-y-6">

        {/* Impact KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Disruptions Detected', value: overview?.disruptionsDetected ?? 47, icon: '🔍', color: 'text-electric-400' },
            { label: 'On-Time Delivery', value: `${overview?.onTimeDeliveryRate ?? 87}%`, icon: '✅', color: 'text-success-400' },
            { label: 'Total Cost Savings', value: `$${((overview?.costSavings ?? 284000)/1000).toFixed(0)}K`, icon: '💰', color: 'text-amber-400' },
            { label: 'Early Detection Rate', value: `${overview?.earlyDetectionRate ?? 94}%`, icon: '⚡', color: 'text-electric-400' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-5">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/50 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Trend + Route Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Disruption Trend */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Disruption Trend</h3>
              <div className="flex gap-1">
                {[7, 14, 30].map(d => (
                  <button key={d} onClick={() => setPeriod(d)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${period === d ? 'bg-electric-500/30 text-electric-400' : 'text-white/40 hover:text-white/70'}`}>{d}d</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeseries}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(8,15,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px' }} />
                <Area type="monotone" dataKey="disruptions" stroke="#0ea5e9" fill="url(#g1)" strokeWidth={2} name="Disruptions" />
                <Area type="monotone" dataKey="resolved" stroke="#22c55e" fill="url(#g2)" strokeWidth={2} name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Score Distribution */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-white mb-4">Risk Level Distribution</h3>
            <div className="flex items-center justify-center mb-4">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={riskDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="count" strokeWidth={0} paddingAngle={3}>
                    {riskDist.map((entry, i) => <Cell key={i} fill={RISK_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(8,15,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {riskDist.map((d, i) => (
                <div key={d.level} className="flex items-center justify-between glass-panel p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[i] }} />
                    <span className="text-xs text-white/60">{d.level}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Route Performance */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Route Performance Comparison</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={routePerf} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="route" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'rgba(8,15,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px' }} />
              <Bar dataKey="onTime" fill="#0ea5e9" radius={[4,4,0,0]} name="On-Time %" />
              <Bar dataKey="disruptions" fill="#f59e0b" radius={[4,4,0,0]} name="Disruptions" />
              <Bar dataKey="avgDelay" fill="#ef4444" radius={[4,4,0,0]} name="Avg Delay (h)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SDG Impact section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { sdg: 'SDG 9', title: 'Industry, Innovation & Infrastructure', metrics: [{ label: 'Detection speed improvement', value: '40%' }, { label: 'Disruptions prevented', value: '23' }, { label: 'System uptime', value: '99.9%' }], color: '#f97316', icon: '🏭' },
            { sdg: 'SDG 11', title: 'Sustainable Cities & Communities', metrics: [{ label: 'CO₂ reduced', value: '12.4T' }, { label: 'Route optimization', value: '87%' }, { label: 'Community impact', value: 'High' }], color: '#22c55e', icon: '🏙️' },
          ].map(s => (
            <motion.div key={s.sdg} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border" style={{ borderColor: `${s.color}30` }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">{s.sdg}</div>
                  <div className="text-xs text-white/50">{s.title}</div>
                </div>
              </div>
              <div className="space-y-3">
                {s.metrics.map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-xs text-white/60">{m.label}</span>
                    <span className="text-sm font-bold" style={{ color: s.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
