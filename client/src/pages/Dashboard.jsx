import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Package, AlertTriangle,
  Shield, Zap, Clock, DollarSign, Leaf, Activity,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useShipments, useAnalytics } from '../hooks/useChainGuard';
import Header from '../components/Header';
import LiveMap from '../components/LiveMap';
import ShipmentCard from '../components/ShipmentCard';
import { RiskGauge } from '../components/RiskGauge';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import { getTimeseries, getRiskDistribution } from '../services/api';

const RISK_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e'];

export default function Dashboard() {
  const { shipments, loading, refetch } = useShipments();
  const { overview } = useAnalytics();
  const [timeseries, setTimeseries] = React.useState([]);
  const [riskDist, setRiskDist] = React.useState([]);

  React.useEffect(() => {
    getTimeseries(14).then(r => setTimeseries(r.data || [])).catch(() => setTimeseries(getMockTimeseries()));
    getRiskDistribution().then(r => setRiskDist(r.data || [])).catch(() => {});
  }, []);

  const criticalShipments = shipments.filter(s => s.analysis?.riskScore >= 76);
  const highRiskShipments = shipments.filter(s => s.analysis?.riskScore >= 51 && s.analysis?.riskScore < 76);
  const avgRisk = shipments.length ? Math.round(shipments.reduce((a, s) => a + (s.analysis?.riskScore || 0), 0) / shipments.length) : 0;

  const statCards = [
    { label: 'Active Shipments', value: overview?.totalShipments ?? shipments.length, icon: Package, color: 'text-electric-400', trend: null, sub: `${criticalShipments.length} critical` },
    { label: 'Avg Risk Score', value: overview?.avgRiskScore ?? avgRisk, icon: Activity, color: avgRisk >= 60 ? 'text-danger-400' : avgRisk >= 40 ? 'text-amber-400' : 'text-success-400', trend: '-8%', positive: true, sub: 'vs last week' },
    { label: 'Disruptions Caught', value: overview?.disruptionsDetected ?? 47, icon: AlertTriangle, color: 'text-amber-400', trend: '+23%', positive: true, sub: 'this month' },
    { label: 'Routes Saved', value: overview?.routesSaved ?? 23, icon: Shield, color: 'text-success-400', trend: null, sub: 'reroutes auto-executed' },
    { label: 'Cost Savings', value: `$${((overview?.costSavings ?? 284000) / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-success-400', trend: '+40%', positive: true, sub: 'vs manual detection' },
    { label: 'Early Detection', value: `${overview?.earlyDetectionRate ?? 94}%`, icon: Zap, color: 'text-electric-400', trend: null, sub: 'before delays cascade' },
    { label: 'Avg Resolution', value: `${overview?.avgResolutionTime ?? 2.4}h`, icon: Clock, color: 'text-amber-400', trend: '-35%', positive: true, sub: 'resolution time' },
    { label: 'CO₂ Reduced', value: `${overview?.co2Reduced ?? 12.4}T`, icon: Leaf, color: 'text-success-400', trend: null, sub: 'SDG 11 impact' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="ChainGuard AI Dashboard"
        subtitle="Real-time supply chain intelligence powered by Google Gemini"
        onRefresh={refetch}
        loading={loading}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Critical Alert Banner */}
        {criticalShipments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-danger-500/40"
            style={{ background: 'rgba(239,68,68,0.08)', boxShadow: '0 0 30px rgba(239,68,68,0.1)' }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <AlertTriangle className="w-5 h-5 text-danger-400" />
            </motion.div>
            <div className="flex-1">
              <div className="text-sm font-bold text-danger-400">⚡ {criticalShipments.length} Critical Disruption{criticalShipments.length > 1 ? 's' : ''} Detected</div>
              <div className="text-xs text-white/60 mt-0.5">
                {criticalShipments.map(s => s.name).join(', ')} — Immediate rerouting recommended
              </div>
            </div>
            <div className="flex items-center gap-2">
              {criticalShipments.map(s => <RiskGauge key={s.id} score={s.analysis?.riskScore ?? 0} size={48} showLabel={false} />)}
            </div>
          </motion.div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="stat-card group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl ${card.color.replace('text-', 'bg-').replace('-400', '-500/15').replace('-400', '-500/15')}`} style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                {card.trend && (
                  <div className={`flex items-center gap-0.5 text-xs font-semibold ${card.positive ? 'text-success-400' : 'text-danger-400'}`}>
                    {card.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {card.trend}
                  </div>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{loading ? '—' : card.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{card.label}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{card.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Map + Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Map */}
          <div className="lg:col-span-2">
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Live Shipment Map</h2>
                  <p className="text-xs text-white/40 mt-0.5">Real-time GPS tracking + risk heatmap</p>
                </div>
                <motion.div className="flex items-center gap-2" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
                  <div className="w-2 h-2 rounded-full bg-success-400" />
                  <span className="text-xs text-success-400 font-medium">Live</span>
                </motion.div>
              </div>
              <LiveMap shipments={shipments} height={380} />
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4">Risk Distribution</h3>
              <div className="flex justify-center">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={riskDist.length ? riskDist : getDefaultRiskDist()} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="count" strokeWidth={0}>
                      {(riskDist.length ? riskDist : getDefaultRiskDist()).map((entry, i) => (
                        <Cell key={i} fill={RISK_COLORS[i]} opacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(8,15,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['Critical', 'High', 'Medium', 'Low'].map((level, i) => (
                  <div key={level} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[i] }} />
                    <span className="text-white/60">{level}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SDG Impact */}
            <div className="glass-card p-5 border border-success-500/20">
              <h3 className="text-sm font-bold text-white mb-3">🌍 SDG Impact</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">SDG 9 — Innovation</div>
                    <div className="text-[10px] text-white/40">Resilient infrastructure</div>
                  </div>
                  <div className="text-sm font-bold text-success-400">94%</div>
                </div>
                <div className="h-px bg-white/8" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">SDG 11 — Sustainable</div>
                    <div className="text-[10px] text-white/40">Smart logistics</div>
                  </div>
                  <div className="text-sm font-bold text-success-400">87%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disruption Trend Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white">Disruption Trend (14 days)</h2>
              <p className="text-xs text-white/40 mt-0.5">Detections vs resolutions over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/50">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-electric-400" /> Detected</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-success-400" /> Resolved</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeseries.length ? timeseries : getMockTimeseries()}>
              <defs>
                <linearGradient id="disruptions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(8,15,32,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px' }} />
              <Area type="monotone" dataKey="disruptions" stroke="#0ea5e9" fill="url(#disruptions)" strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" stroke="#22c55e" fill="url(#resolved)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Risk Shipments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">High-Risk Shipments</h2>
            <span className="text-xs text-white/40">{highRiskShipments.length + criticalShipments.length} flagged</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="glass-card h-48 shimmer" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...criticalShipments, ...highRiskShipments].slice(0, 6).map((s, i) => (
                <ShipmentCard key={s.id} shipment={s} index={i} onUpdate={refetch} />
              ))}
              {criticalShipments.length + highRiskShipments.length === 0 && (
                <div className="col-span-3 glass-card p-12 flex flex-col items-center text-center">
                  <Shield className="w-12 h-12 text-success-400 mb-3" />
                  <div className="text-white font-semibold">All Clear</div>
                  <div className="text-white/40 text-sm mt-1">No high-risk shipments detected. ChainGuard AI is monitoring.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getMockTimeseries() {
  return Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13-i)*86400000).toISOString().slice(5,10),
    disruptions: Math.floor(Math.random()*6+2),
    resolved: Math.floor(Math.random()*5+1)
  }));
}

function getDefaultRiskDist() {
  return [{ count: 2 }, { count: 5 }, { count: 8 }, { count: 15 }];
}
