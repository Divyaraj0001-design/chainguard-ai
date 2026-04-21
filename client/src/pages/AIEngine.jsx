import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Brain, Activity, CheckCircle, AlertTriangle, RefreshCcw, BarChart2, Send, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import { RiskGauge, RiskBadge } from '../components/RiskGauge';
import { getAIStatus, getSupplyChainSummary, analyzeWithAI } from '../services/api';
import { useShipments } from '../hooks/useChainGuard';
import toast from 'react-hot-toast';

export default function AIEngine() {
  const { shipments } = useShipments();
  const [status, setStatus] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: '👋 I\'m ChainGuard AI powered by Google Gemini 1.5 Flash. Ask me about any shipment risk, suggest reroutes, or request a supply chain analysis.' }
  ]);

  useEffect(() => {
    getAIStatus().then(r => setStatus(r)).catch(() => {});
  }, []);

  async function fetchSummary() {
    setLoadingSummary(true);
    try {
      const r = await getSupplyChainSummary();
      setSummary(r.data);
      toast.success('Gemini analysis complete');
    } catch {
      toast.error('Summary unavailable');
    } finally {
      setLoadingSummary(false);
    }
  }

  async function runAnalysis() {
    if (!selectedShipment) return toast.error('Select a shipment first');
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await analyzeWithAI(selectedShipment);
      setAnalysisResult(res.data);
      toast.success('AI analysis complete');
    } catch {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function sendMessage() {
    if (!prompt.trim()) return;
    const userMsg = { role: 'user', content: prompt };
    setChatHistory(prev => [...prev, userMsg]);
    setPrompt('');

    // Simulate Gemini response
    setTimeout(() => {
      const responses = [
        `Based on current data, I'm monitoring ${shipments.length} active shipments. ${shipments.filter(s => s.analysis?.riskScore >= 50).length} are flagged as high risk. I recommend prioritizing rerouting for SHP-003 (Auto Parts Cargo) which shows an 89% risk score due to major highway closure.`,
        `The current supply chain health index is ${shipments.length ? Math.round(shipments.reduce((a,s) => a + (s.analysis?.riskScore || 0), 0) / shipments.length) : 52}/100. Weather disruptions are the primary threat across 60% of active routes.`,
        `I've analyzed your query against real-time IoT feeds, weather APIs, and traffic data. Cascade risk is estimated at medium severity. Recommend activating contingency routes R2 and R3 for critical shipments.`,
      ];
      setChatHistory(prev => [...prev, { role: 'assistant', content: responses[Math.floor(Math.random() * responses.length)] }]);
    }, 1500);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Gemini AI Engine" subtitle="Google Gemini 1.5 Flash — multimodal supply chain intelligence" />

      <div className="flex-1 p-6 space-y-6">
        {/* Engine Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border border-electric-500/30" style={{ boxShadow: '0 0 30px rgba(14,165,233,0.1)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-electric-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-electric-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Gemini 1.5 Flash</div>
                <div className={`text-xs ${status?.status === 'active' ? 'text-success-400' : 'text-amber-400'}`}>
                  {status?.status === 'active' ? '● Active' : '● Demo Mode'}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {(status?.capabilities || ['disruption_analysis','rerouting','eta_adjustment','cascade_prediction']).map(c => (
                <div key={c} className="flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle className="w-3.5 h-3.5 text-success-400 flex-shrink-0" />
                  <span className="capitalize">{c.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white">Analysis Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Analyses Run', value: '1,284' },
                { label: 'Accuracy', value: '94.2%' },
                { label: 'Avg Latency', value: '1.8s' },
                { label: 'Reroutes', value: '247' },
              ].map(s => (
                <div key={s.label} className="glass-panel p-2.5 rounded-xl">
                  <div className="text-lg font-bold text-white">{s.value}</div>
                  <div className="text-[10px] text-white/40">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="w-4 h-4 text-success-400" />
              <span className="text-sm font-bold text-white">Supply Chain Summary</span>
            </div>
            {summary ? (
              <p className="text-xs text-white/70 leading-relaxed line-clamp-5">{summary.summary}</p>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 gap-3">
                <p className="text-xs text-white/40 text-center">Generate a real-time AI health report for all shipments</p>
                <button onClick={fetchSummary} disabled={loadingSummary} className="btn-primary flex items-center gap-1.5 text-xs py-2 px-4">
                  {loadingSummary ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  {loadingSummary ? 'Analyzing...' : 'Generate Report'}
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* AI Chat + Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gemini Chat Interface */}
          <div className="glass-card flex flex-col h-[520px]">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-electric-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-electric-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Gemini AI Assistant</div>
                <div className="text-xs text-white/40">Ask anything about your supply chain</div>
              </div>
              <motion.div className="ml-auto w-2 h-2 rounded-full bg-success-400" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-white rounded-tr-sm' : 'glass-panel text-white/80 rounded-tl-sm border border-electric-500/20'
                  }`} style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' } : {}}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-white/8 flex gap-2">
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Gemini about your supply chain..."
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-electric-500/50"
              />
              <motion.button onClick={sendMessage} className="btn-primary p-2.5 rounded-xl" whileTap={{ scale: 0.95 }}>
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Shipment Analysis Panel */}
          <div className="glass-card flex flex-col h-[520px]">
            <div className="px-5 py-4 border-b border-white/8">
              <div className="text-sm font-bold text-white">On-Demand Analysis</div>
              <div className="text-xs text-white/40 mt-0.5">Select a shipment for live Gemini risk assessment</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {shipments.map(s => (
                <motion.div
                  key={s.id}
                  onClick={() => setSelectedShipment(s)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedShipment?.id === s.id ? 'border-electric-500/50 bg-electric-500/10' : 'glass-panel hover:border-white/20'} border`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RiskGauge score={s.analysis?.riskScore ?? 0} size={44} showLabel={false} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{s.name}</div>
                    <div className="text-xs text-white/40">{s.id} · {s.carrier}</div>
                  </div>
                  <RiskBadge level={s.analysis?.riskLevel ?? 'low'} />
                  {selectedShipment?.id === s.id && <ChevronRight className="w-4 h-4 text-electric-400 flex-shrink-0" />}
                </motion.div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-white/8 space-y-3">
              <motion.button
                onClick={runAnalysis}
                disabled={!selectedShipment || analyzing}
                className="btn-primary w-full flex items-center justify-center gap-2"
                whileTap={{ scale: 0.97 }}
              >
                {analyzing ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Running Gemini Analysis...</>
                  : <><Zap className="w-4 h-4" /> Analyze Selected Shipment</>}
              </motion.button>

              {analysisResult && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-electric-400">Analysis Result</span>
                    <RiskGauge score={analysisResult.riskScore} size={40} showLabel={false} />
                  </div>
                  <p className="text-xs text-white/70 line-clamp-3">{analysisResult.aiInsight}</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
