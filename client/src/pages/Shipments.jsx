import React from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import ShipmentCard from '../components/ShipmentCard';
import { useShipments } from '../hooks/useChainGuard';
import { Package, Filter, SortDesc } from 'lucide-react';

const STATUS_FILTERS = ['all', 'in_transit', 'delayed', 'at_port', 'delivered'];
const RISK_FILTERS = ['all', 'critical', 'high', 'medium', 'low'];

export default function Shipments() {
  const { shipments, loading, refetch } = useShipments();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [riskFilter, setRiskFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('risk');

  const filtered = shipments
    .filter(s => statusFilter === 'all' || s.status === statusFilter)
    .filter(s => riskFilter === 'all' || s.analysis?.riskLevel === riskFilter)
    .sort((a, b) => sortBy === 'risk'
      ? (b.analysis?.riskScore ?? 0) - (a.analysis?.riskScore ?? 0)
      : new Date(a.eta) - new Date(b.eta));

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Shipments" subtitle={`${filtered.length} shipment${filtered.length !== 1 ? 's' : ''} tracked`} onRefresh={refetch} loading={loading} />

      <div className="flex-1 p-6 space-y-5">
        {/* Filters */}
        <div className="glass-card p-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/40 font-medium uppercase tracking-wide">Status:</span>
            <div className="flex gap-1.5">
              {STATUS_FILTERS.map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${statusFilter === f ? 'bg-electric-500/30 text-electric-400 border border-electric-500/40' : 'text-white/40 hover:text-white/70'}`}>
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-medium uppercase tracking-wide">Risk:</span>
            <div className="flex gap-1.5">
              {RISK_FILTERS.map(f => (
                <button key={f} onClick={() => setRiskFilter(f)} className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${riskFilter === f ? 'bg-electric-500/30 text-electric-400 border border-electric-500/40' : 'text-white/40 hover:text-white/70'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <SortDesc className="w-4 h-4 text-white/40" />
            <button onClick={() => setSortBy(sortBy === 'risk' ? 'eta' : 'risk')} className="text-xs text-white/60 hover:text-white transition-colors">
              Sort by: <span className="text-electric-400 font-medium">{sortBy === 'risk' ? 'Risk Score' : 'ETA'}</span>
            </button>
          </div>
        </div>

        {/* Shipment Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="glass-card h-52 shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 flex flex-col items-center text-center">
            <Package className="w-14 h-14 text-white/20 mb-4" />
            <div className="text-white/60 font-medium">No shipments match your filters</div>
            <button onClick={() => { setStatusFilter('all'); setRiskFilter('all'); }} className="mt-3 text-electric-400 text-xs hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((s, i) => (
              <ShipmentCard key={s.id} shipment={s} index={i} onUpdate={refetch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
