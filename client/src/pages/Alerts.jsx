import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { getAlertHistory, sendSMS, broadcastAlert } from '../services/api';
import { useDisruptionAlerts } from '../hooks/useChainGuard';
import { Bell, Send, CheckCircle, AlertTriangle, Clock, MessageSquare, Webhook } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const SEVERITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };

export default function Alerts() {
  const { alerts: liveAlerts, markAllRead } = useDisruptionAlerts();
  const [history, setHistory] = useState([]);
  const [smsForm, setSmsForm] = useState({ to: '', message: '', shipmentId: '' });
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('live');

  useEffect(() => {
    getAlertHistory().then(r => setHistory(r.data || [])).catch(() => {});
    markAllRead();
  }, []);

  async function handleSendSMS(e) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await sendSMS(smsForm);
      toast.success(res.simulated ? 'SMS simulated (add Twilio creds to send real)' : 'SMS sent successfully!');
      setSmsForm({ to: '', message: '', shipmentId: '' });
    } catch {
      toast.error('SMS send failed');
    } finally {
      setSending(false);
    }
  }

  const displayed = tab === 'live'
    ? liveAlerts.map(a => ({ ...a, type: 'disruption' }))
    : history;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Alert Center" subtitle="SMS notifications, webhooks, and real-time disruption alerts" />
      <div className="flex-1 p-6 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alert Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="flex gap-2">
              {[['live', `Live (${liveAlerts.length})`, Bell], ['history', `History (${history.length})`, Clock]].map(([key, label, Icon]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === key ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30' : 'glass-panel text-white/50 hover:text-white/80'}`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {displayed.length === 0 ? (
                <div className="glass-card p-12 flex flex-col items-center text-center">
                  <Bell className="w-10 h-10 text-white/20 mb-3" />
                  <div className="text-white/50 text-sm">No alerts {tab === 'live' ? 'yet — disruptions will appear here in real-time' : 'in history'}</div>
                </div>
              ) : displayed.map((alert, i) => (
                <motion.div key={alert.id || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className={`glass-card p-4 flex items-start gap-3 alert-${alert.severity || alert.riskLevel || 'medium'} ${!alert.acknowledged && !alert.read ? 'border-l-2' : ''}`}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${SEVERITY_COLORS[alert.severity || alert.riskLevel || 'medium']}20` }}>
                    <AlertTriangle className="w-4 h-4" style={{ color: SEVERITY_COLORS[alert.severity || alert.riskLevel || 'medium'] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-white/40">{alert.shipmentId}</span>
                      {(alert.acknowledged || alert.read) && <CheckCircle className="w-3.5 h-3.5 text-success-400" />}
                    </div>
                    <p className="text-sm text-white/80 mt-0.5">{alert.message}</p>
                    <div className="text-[11px] text-white/30 mt-1">
                      {alert.timestamp ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }) : 'just now'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Notification Controls */}
          <div className="space-y-4">
            {/* Send SMS */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-electric-400" />
                <h3 className="text-sm font-bold text-white">Send SMS Alert</h3>
              </div>
              <form onSubmit={handleSendSMS} className="space-y-3">
                <input value={smsForm.to} onChange={e => setSmsForm(p => ({ ...p, to: e.target.value }))}
                  placeholder="+1234567890" required
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-electric-500/50" />
                <input value={smsForm.shipmentId} onChange={e => setSmsForm(p => ({ ...p, shipmentId: e.target.value }))}
                  placeholder="Shipment ID (e.g. SHP-001)"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-electric-500/50" />
                <textarea value={smsForm.message} onChange={e => setSmsForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Alert message..." required rows={3}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-electric-500/50 resize-none" />
                <button type="submit" disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send SMS'}
                </button>
              </form>
            </div>

            {/* Webhook info */}
            <div className="glass-card p-5 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Webhook className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Webhooks</h3>
              </div>
              <p className="text-xs text-white/50 mb-3">Configure webhook URL in <code className="text-electric-400">.env</code> to receive real-time push notifications for all disruption events.</p>
              <div className="glass-panel p-3 rounded-xl">
                <div className="text-xs text-white/40 font-mono">POST {'{WEBHOOK_URL}'}</div>
                <div className="text-[10px] text-white/20 mt-1">Payload: shipmentId, riskScore, riskLevel, timestamp</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
