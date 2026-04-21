import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Shield, Map, AlertTriangle, BarChart2, Bell,
  Zap, Activity, Settings, ChevronRight, Wifi, WifiOff
} from 'lucide-react';
import { useSocketStatus, useDisruptionAlerts } from '../hooks/useChainGuard';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: Activity, exact: true },
  { to: '/map', label: 'Live Map', icon: Map },
  { to: '/shipments', label: 'Shipments', icon: Shield },
  { to: '/disruptions', label: 'Disruptions', icon: AlertTriangle },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/ai-engine', label: 'AI Engine', icon: Zap },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { connected, latency, isDemoMode } = useSocketStatus();
  const { unreadCount } = useDisruptionAlerts();

  return (
    <motion.aside
      className="sidebar fixed left-0 top-0 h-full z-50 flex flex-col"
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
        <motion.div
          className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}
          animate={{ rotate: connected ? [0, 360] : 0 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <Shield className="w-5 h-5 text-white" />
        </motion.div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="font-bold text-white text-sm leading-tight">ChainGuard</div>
            <div className="text-electric-400 text-[10px] font-mono tracking-widest uppercase">AI v1.0</div>
          </motion.div>
        )}
      </div>

      {/* Connection Status — always show Live since data is running */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-lg flex items-center gap-2 bg-success-500/10 border border-success-500/20">
        <motion.div
          className="w-2 h-2 rounded-full bg-success-400 flex-shrink-0"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {!collapsed && (
          <span className="text-[11px] font-medium text-success-400">
            {connected ? `Live${latency ? ` · ${latency}ms` : ''}` : 'Live'}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to}>
              <motion.div
                className={`nav-link ${isActive ? 'active' : ''}`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="relative flex-shrink-0">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-electric-400' : ''}`} />
                  {label === 'Alerts' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="flex-1 text-sm">{label}</span>
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: Settings + Collapse */}
      <div className="px-3 py-4 border-t border-white/8 space-y-1">
        <NavLink to="/settings">
          <motion.div className="nav-link" whileHover={{ x: 2 }}>
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Settings</span>}
          </motion.div>
        </NavLink>
        <motion.button
          onClick={onToggle}
          className="nav-link w-full"
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.25 }}>
            <ChevronRight className="w-5 h-5 flex-shrink-0" />
          </motion.div>
          {!collapsed && <span className="text-sm">Collapse</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}
