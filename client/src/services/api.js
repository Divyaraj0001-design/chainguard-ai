import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor
api.interceptors.request.use(config => {
  config.metadata = { startTime: Date.now() };
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    const msg = error.response?.data?.error || error.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

// ─── Shipments ────────────────────────────────────────────────────────────
export const getShipments = () => api.get('/shipments').then(r => r.data);
export const getShipment = (id) => api.get(`/shipments/${id}`).then(r => r.data);
export const analyzeShipment = (id) => api.post(`/shipments/${id}/analyze`).then(r => r.data);
export const createShipment = (data) => api.post('/shipments', data).then(r => r.data);

// ─── AI Engine ────────────────────────────────────────────────────────────
export const getAIStatus = () => api.get('/ai/status').then(r => r.data);
export const analyzeWithAI = (data) => api.post('/ai/analyze', data).then(r => r.data);
export const rerouteShipment = (data) => api.post('/ai/reroute', data).then(r => r.data);
export const getSupplyChainSummary = () => api.get('/ai/summary').then(r => r.data);

// ─── Disruptions ──────────────────────────────────────────────────────────
export const getDisruptions = (limit) => api.get(`/disruptions${limit ? `?limit=${limit}` : ''}`).then(r => r.data);
export const getActiveDisruptions = () => api.get('/disruptions/active').then(r => r.data);
export const getHeatmapData = () => api.get('/disruptions/heatmap').then(r => r.data);

// ─── Analytics ────────────────────────────────────────────────────────────
export const getAnalyticsOverview = () => api.get('/analytics/overview').then(r => r.data);
export const getTimeseries = (days) => api.get(`/analytics/timeseries?days=${days || 30}`).then(r => r.data);
export const getRiskDistribution = () => api.get('/analytics/risk-distribution').then(r => r.data);
export const getRoutePerformance = () => api.get('/analytics/route-performance').then(r => r.data);

// ─── Alerts ───────────────────────────────────────────────────────────────
export const getAlertHistory = () => api.get('/alerts/history').then(r => r.data);
export const sendSMS = (data) => api.post('/alerts/sms', data).then(r => r.data);
export const broadcastAlert = (data) => api.post('/alerts/broadcast', data).then(r => r.data);

export default api;
