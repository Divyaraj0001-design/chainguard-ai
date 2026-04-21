import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

function getRiskColor(score) {
  if (score >= 76) return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.6)', text: 'text-danger-400', label: 'CRITICAL' };
  if (score >= 51) return { stroke: '#f97316', glow: 'rgba(249,115,22,0.6)', text: 'text-orange-400', label: 'HIGH' };
  if (score >= 26) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.6)', text: 'text-amber-400', label: 'MEDIUM' };
  return { stroke: '#22c55e', glow: 'rgba(34,197,94,0.6)', text: 'text-success-400', label: 'LOW' };
}

/**
 * Animated circular risk score gauge
 */
export function RiskGauge({ score = 0, size = 80, showLabel = true }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colors = getRiskColor(score);

  return (
    <div className="relative flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${score}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Risk ring */}
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 6px ${colors.glow})` }}
        />
        {/* Score text */}
        <text x="50%" y="50%" textAnchor="middle" dy="0.3em" fill="white" fontSize={size * 0.22} fontWeight="700" fontFamily="Inter">
          {score}
        </text>
      </svg>
      {showLabel && (
        <span className={`text-[10px] font-bold tracking-widest uppercase ${colors.text}`}>{colors.label}</span>
      )}
    </div>
  );
}

/**
 * Inline risk badge pill
 */
export function RiskBadge({ score, level }) {
  const colors = getRiskColor(score ?? (level === 'critical' ? 90 : level === 'high' ? 65 : level === 'medium' ? 40 : 15));
  const cls = { critical: 'risk-critical', high: 'risk-high', medium: 'risk-medium', low: 'risk-low' }[level || 'low'];
  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${level === 'critical' ? 'bg-danger-400' : level === 'high' ? 'bg-orange-400' : level === 'medium' ? 'bg-amber-400' : 'bg-success-400'}`} style={{ animation: level === 'critical' ? 'pulse 1s infinite' : 'none' }} />
      {level?.toUpperCase() || 'LOW'}
    </span>
  );
}

/**
 * Mini bar risk indicator
 */
export function RiskBar({ score = 0 }) {
  const colors = getRiskColor(score);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: colors.stroke, boxShadow: `0 0 8px ${colors.glow}` }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <span className={`text-xs font-mono font-semibold ${colors.text}`}>{score}</span>
    </div>
  );
}
