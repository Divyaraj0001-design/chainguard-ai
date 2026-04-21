import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, RefreshCcw, X, AlertTriangle, Zap } from 'lucide-react';
import { useDisruptionAlerts } from '../hooks/useChainGuard';
import { formatDistanceToNow } from 'date-fns';

export default function Header({ title, subtitle, onRefresh, loading }) {
  const { alerts, unreadCount, markAllRead } = useDisruptionAlerts();
  const [showAlerts, setShowAlerts] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-white/8" style={{ background: 'rgba(8,15,32,0.85)', backdropFilter: 'blur(20px)' }}>
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <AnimatePresence>
          {searchOpen ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              className="flex items-center gap-2 glass-panel px-3 py-2 rounded-xl"
            >
              <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
              <input autoFocus placeholder="Search shipments..." className="bg-transparent text-sm text-white placeholder-white/30 outline-none w-full" />
              <button onClick={() => setSearchOpen(false)}><X className="w-4 h-4 text-white/40" /></button>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => setSearchOpen(true)}
              className="btn-secondary p-2.5 rounded-xl"
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Refresh */}
        {onRefresh && (
          <motion.button
            onClick={onRefresh}
            className="btn-secondary p-2.5 rounded-xl"
            animate={loading ? { rotate: 360 } : {}}
            transition={loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCcw className="w-4 h-4" />
          </motion.button>
        )}

        {/* Alert bell */}
        <div className="relative">
          <motion.button
            onClick={() => { setShowAlerts(!showAlerts); if (!showAlerts) markAllRead(); }}
            className="btn-secondary p-2.5 rounded-xl relative"
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          {/* Alert dropdown */}
          <AnimatePresence>
            {showAlerts && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-12 w-80 glass-card p-0 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Live Alerts</span>
                  <span className="text-xs text-white/40">{alerts.length} total</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-white/40 text-sm">No alerts yet</div>
                  ) : alerts.slice(0, 8).map((alert, i) => (
                    <motion.div
                      key={alert.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`px-4 py-3 border-b border-white/5 alert-${alert.riskLevel || 'medium'} flex gap-3`}
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{alert.shipmentName || alert.shipmentId}</div>
                        <div className="text-xs text-white/60 mt-0.5 line-clamp-2">{alert.message}</div>
                        <div className="text-[10px] text-white/30 mt-1">{alert.timestamp ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }) : 'just now'}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Status pill */}
        <motion.div
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-electric-500/30"
          style={{ background: 'rgba(14,165,233,0.08)' }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-3.5 h-3.5 text-electric-400" />
          <span className="text-xs font-medium text-electric-400">Gemini Active</span>
        </motion.div>
      </div>
    </header>
  );
}
