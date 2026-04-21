import React from 'react';
import Header from '../components/Header';
import { Shield, Github, ExternalLink } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Settings" subtitle="Configure APIs, thresholds, and notification preferences" />
      <div className="flex-1 p-6 space-y-5">
        {[
          { label: 'Gemini AI', key: 'GEMINI_API_KEY', hint: 'Google AI Studio → Get API Key', link: 'https://makersuite.google.com/app/apikey' },
          { label: 'Google Maps', key: 'GOOGLE_MAPS_API_KEY', hint: 'Google Cloud Console → Maps API', link: 'https://console.cloud.google.com' },
          { label: 'OpenWeatherMap', key: 'OPENWEATHER_API_KEY', hint: 'openweathermap.org/api', link: 'https://openweathermap.org/api' },
          { label: 'TomTom Traffic', key: 'TOMTOM_API_KEY', hint: 'developer.tomtom.com', link: 'https://developer.tomtom.com' },
          { label: 'Twilio SMS', key: 'TWILIO_ACCOUNT_SID', hint: 'twilio.com/console', link: 'https://twilio.com/console' },
        ].map(api => (
          <div key={api.key} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-white">{api.label}</div>
                <div className="text-xs text-white/40 font-mono mt-0.5">{api.key}</div>
              </div>
              <a href={api.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-electric-400 hover:underline">
                Get Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="glass-panel px-3 py-2 rounded-xl text-xs text-white/40">
              Set in <code className="text-electric-400">server/.env</code> → {api.hint}
            </div>
          </div>
        ))}

        {/* Risk Thresholds */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white mb-4">Risk Thresholds</h3>
          <div className="space-y-4">
            {[
              { label: 'Auto-Reroute Trigger', value: 50, color: '#f97316' },
              { label: 'Critical Alert Threshold', value: 75, color: '#ef4444' },
              { label: 'SMS Notification Trigger', value: 60, color: '#f59e0b' },
            ].map(t => (
              <div key={t.label} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">{t.label}</span>
                  <span className="font-mono font-bold" style={{ color: t.color }}>{t.value}</span>
                </div>
                <input type="range" min="0" max="100" defaultValue={t.value} className="w-full accent-electric-500" />
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="glass-card p-5 border border-electric-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-electric-400" />
            <div>
              <div className="text-sm font-bold text-white">ChainGuard AI</div>
              <div className="text-xs text-white/40">Google Solution Challenge 2026</div>
            </div>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            AI-powered supply chain disruption detection and auto-rerouting system. Built with Google Gemini 1.5 Flash, Firebase, Google Maps Platform, and React. Aligned with SDG 9 and SDG 11.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2 text-xs py-2 px-3">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href="https://developers.google.com/solutions-challenge" target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2 text-xs py-2 px-3">
              <ExternalLink className="w-4 h-4" /> Solution Challenge
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
