/**
 * Shared utility formatters for ChainGuard AI
 */

export function formatRiskScore(score) {
  if (score >= 76) return { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)' };
  if (score >= 51) return { label: 'HIGH',     color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.35)' };
  if (score >= 26) return { label: 'MEDIUM',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)' };
  return              { label: 'LOW',       color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.35)' };
}

export function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function formatCurrency(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export function getRiskLevelFromScore(score) {
  if (score >= 76) return 'critical';
  if (score >= 51) return 'high';
  if (score >= 26) return 'medium';
  return 'low';
}

export function formatShipmentStatus(status) {
  const map = {
    in_transit:   { label: 'In Transit',  color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)'  },
    delayed:      { label: 'Delayed',     color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
    at_port:      { label: 'At Port',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
    delivered:    { label: 'Delivered',   color: '#22c55e', bg: 'rgba(34,197,94,0.15)'   },
    pending:      { label: 'Pending',     color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  };
  return map[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' };
}

export function truncate(str, max = 40) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}
