import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import Disruptions from './pages/Disruptions';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import AIEngine from './pages/AIEngine';
import MapView from './pages/MapView';
import Settings from './pages/Settings';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-navy-950">
        {/* Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />

        {/* Main Content */}
        <motion.main
          className="flex-1 min-h-screen overflow-y-auto"
          animate={{ marginLeft: sidebarCollapsed ? 72 : 240 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/disruptions" element={<Disruptions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/ai-engine" element={<AIEngine />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </motion.main>

        {/* Toast Notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(8,15,32,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: 'rgba(8,15,32,0.95)' }
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: 'rgba(8,15,32,0.95)' }
            }
          }}
        />
      </div>
    </BrowserRouter>
  );
}
