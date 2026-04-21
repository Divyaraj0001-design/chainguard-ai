import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { RiskBadge } from '../components/RiskGauge';
import { getDisruptions, getActiveDisruptions } from '../services/api';
import { AlertTriangle, CheckCircle, Clock, Navigation, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICONS = {
  weather: '🌩️', traffic: '🚗', port: '⚓', customs: '📋', geopolitical: '🌍', mechanical: '⚙️'
};

export default function Disruptions() {
  const [disruptions, setDisruptions] = useState([]);
  const [active, setActive] = useState([]);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDisruptions(50), getActiveDisruptions()])
      .then(([all, act]) => {
        setDisruptions(all.data || []);
        setActive(act.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = tab === 'active' ? active : disruptions;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Disruptions" subtitle="AI-detected supply chain disruptions and resolutions" />
      <div className="flex-1 p-6 space-y-5">

        {/* Tabs */}
        <div className="flex gap-2">
          {[['active', `Active (${active.length})`, AlertTriangle], ['all', `All History (${disruptions.length})`, Clock]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === key ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30' : 'glass-panel text-white/50 hover:text-white/80'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* Disruption list */}
        <div className="space-y-3">
          {loading
            ? [...Array(5)].map((_, i) => <div key={i} className="glass-card h-20 shimmer" />)
            : displayed.length === 0
              ? <div className="glass-card p-12 flex flex-col items-center text-center">
                  <CheckCircle className="w-12 h-12 text-success-400 mb-3" />
                  <div className="text-white font-semibold">No disruptions detected</div>
                  <div className="text-white/40 text-sm">ChainGuard AI is actively monitoring all routes</div>
                </div>
              : displayed.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`glass-card p-4 flex items-start gap-4 alert-${d.severity}`}>
                  <div className="text-2xl flex-shrink-0">{TYPE_ICONS[d.type] || '⚠️'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-white/40">{d.id}</span>
                      <RiskBadge level={d.severity} />
                      {d.rerouteExecuted && (
                        <span className="flex items-center gap-1 text-[10px] bg-success-500/20 text-success-400 border border-success-500/30 px-2 py-0.5 rounded-full">
                          <RotateCcw className="w-3 h-3" /> Rerouted
                        </span>
                      )}
                      {d.resolvedAt && (
                        <span className="flex items-center gap-1 text-[10px] bg-white/10 text-white/40 border border-white/15 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/80">{d.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {d.shipmentId}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                        {d.analyzedAt ? formatDistanceToNow(new Date(d.analyzedAt), { addSuffix: true }) : '—'}
                      </span>
                      {d.resolutionTimeHours && <span className="text-success-400">Resolved in {d.resolutionTimeHours}h</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-bold" style={{ color: d.riskScore >= 76 ? '#f87171' : d.riskScore >= 51 ? '#fb923c' : d.riskScore >= 26 ? '#fbbf24' : '#4ade80' }}>{d.riskScore}</div>
                    <div className="text-[10px] text-white/30">risk score</div>
                  </div>
                </motion.div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
