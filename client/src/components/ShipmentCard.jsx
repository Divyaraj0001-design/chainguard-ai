import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, MapPin, Clock, AlertTriangle, Zap, ChevronDown, ChevronUp, RefreshCw, Navigation } from 'lucide-react';
import { RiskGauge, RiskBadge, RiskBar } from './RiskGauge';
import { analyzeShipment } from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const STATUS_STYLES = {
  in_transit: 'bg-electric-500/20 text-electric-400 border border-electric-500/30',
  delayed: 'bg-danger-500/20 text-danger-400 border border-danger-500/30',
  at_port: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  delivered: 'bg-success-500/20 text-success-400 border border-success-500/30',
  pending: 'bg-white/10 text-white/50 border border-white/15',
};

const PRIORITY_STYLES = {
  critical: 'text-danger-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-success-400',
};

export default function ShipmentCard({ shipment, index = 0, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const { id, name, origin, destination, status, carrier, priority, eta, currentLocation, analysis } = shipment;
  const riskScore = analysis?.riskScore ?? 0;
  const riskLevel = analysis?.riskLevel ?? 'low';
  const topFactor = analysis?.riskFactors?.[0];
  const topRec = analysis?.recommendations?.[0];

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      await analyzeShipment(id);
      toast.success(`Gemini analysis complete for ${name}`);
      onUpdate?.();
    } catch {
      toast.error('Analysis failed — using cached data');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className={`glass-card overflow-hidden ${riskScore >= 76 ? 'border-danger-500/30' : riskScore >= 51 ? 'border-orange-500/20' : 'border-white/10'}`}
      style={riskScore >= 76 ? { boxShadow: '0 0 20px rgba(239,68,68,0.15)' } : {}}
    >
      {/* Risk accent bar */}
      <div className="h-0.5 w-full" style={{ background: riskScore >= 76 ? '#ef4444' : riskScore >= 51 ? '#f97316' : riskScore >= 26 ? '#f59e0b' : '#22c55e', opacity: 0.7 }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-4">
          <RiskGauge score={riskScore} size={72} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-white/40">{id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
                {status?.replace('_', ' ')}
              </span>
              <span className={`text-xs font-semibold uppercase ${PRIORITY_STYLES[priority]}`}>{priority}</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 truncate">{name}</h3>
            <p className="text-xs text-white/50 mt-0.5">{carrier}</p>

            <div className="flex items-center gap-1.5 mt-2 text-xs text-white/60">
              <MapPin className="w-3.5 h-3.5 text-electric-400 flex-shrink-0" />
              <span className="truncate">{origin}</span>
              <span className="text-white/30">→</span>
              <span className="truncate">{destination}</span>
            </div>
          </div>
        </div>

        {/* Risk bar + ETA */}
        <div className="mt-4 space-y-2">
          <RiskBar score={riskScore} />
          <div className="flex items-center justify-between text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>ETA: {eta ? formatDistanceToNow(new Date(eta), { addSuffix: true }) : '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-electric-400" />
              <span className="text-electric-400">{currentLocation?.city || '—'}</span>
            </div>
          </div>
        </div>

        {/* Top disruption factor */}
        {topFactor && riskScore > 25 && (
          <div className={`mt-3 px-3 py-2 rounded-xl alert-${riskLevel} flex items-start gap-2`}>
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: riskScore >= 76 ? '#f87171' : riskScore >= 51 ? '#fb923c' : '#fbbf24' }} />
            <div>
              <div className="text-xs font-semibold text-white/90 capitalize">{topFactor.type} risk</div>
              <div className="text-xs text-white/60 mt-0.5">{topFactor.description}</div>
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="mt-4 flex items-center gap-2">
          <motion.button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3 flex-1"
            whileTap={{ scale: 0.97 }}
          >
            {analyzing
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
              : <><Zap className="w-3.5 h-3.5" /> Analyze</>
            }
          </motion.button>
          <motion.button
            onClick={() => setExpanded(!expanded)}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3"
            whileTap={{ scale: 0.97 }}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Less' : 'Details'}
          </motion.button>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/8 space-y-4">
                {/* All risk factors */}
                {analysis?.riskFactors?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">Risk Factors</div>
                    <div className="space-y-2">
                      {analysis.riskFactors.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <RiskBadge level={f.severity} />
                          <span className="text-white/70">{f.description}</span>
                          {f.estimatedDelayHours > 0 && (
                            <span className="ml-auto text-amber-400 font-mono whitespace-nowrap">+{f.estimatedDelayHours}h</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysis?.recommendations?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">AI Recommendations</div>
                    <div className="space-y-2">
                      {analysis.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs glass-panel p-2.5 rounded-lg">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.priority === 'immediate' ? 'bg-danger-500/30 text-danger-400' : r.priority === 'high' ? 'bg-orange-500/30 text-orange-400' : 'bg-white/10 text-white/50'}`}>
                            {r.priority}
                          </span>
                          <div>
                            <div className="font-semibold text-white/90 capitalize">{r.action}</div>
                            <div className="text-white/60 mt-0.5">{r.description}</div>
                            {r.estimatedTimeSaving > 0 && <div className="text-success-400 mt-0.5">Saves ~{r.estimatedTimeSaving}h</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Insight */}
                {analysis?.aiInsight && (
                  <div className="glass-panel p-3 rounded-xl border border-electric-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-3.5 h-3.5 text-electric-400" />
                      <span className="text-xs font-semibold text-electric-400">Gemini Insight</span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">{analysis.aiInsight}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
