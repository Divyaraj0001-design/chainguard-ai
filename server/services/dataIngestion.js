const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { saveToFirestore } = require('./firebase');

// ─── Mock Shipment Data (realistic simulation) ──────────────────────────────
const MOCK_SHIPMENTS = [
  { id: 'SHP-001', name: 'Electronics Batch A', origin: 'Shanghai, CN', destination: 'Los Angeles, CA', status: 'in_transit', carrier: 'COSCO', trackingId: 'COSCO123456', weight: 24500, category: 'electronics', priority: 'high', eta: new Date(Date.now() + 72 * 3600000).toISOString(), currentLocation: { lat: 35.6762, lng: 139.6503, city: 'Tokyo Bay' }, route: [{ lat: 31.2304, lng: 121.4737 }, { lat: 35.6762, lng: 139.6503 }, { lat: 34.0522, lng: -118.2437 }] },
  { id: 'SHP-002', name: 'Pharma Cold Chain', origin: 'Mumbai, IN', destination: 'London, UK', status: 'in_transit', carrier: 'DHL Express', trackingId: 'DHL789012', weight: 3200, category: 'pharmaceuticals', priority: 'critical', eta: new Date(Date.now() + 18 * 3600000).toISOString(), currentLocation: { lat: 25.2048, lng: 55.2708, city: 'Dubai Hub' }, route: [{ lat: 19.0760, lng: 72.8777 }, { lat: 25.2048, lng: 55.2708 }, { lat: 51.5074, lng: -0.1278 }] },
  { id: 'SHP-003', name: 'Auto Parts Cargo', origin: 'Detroit, MI', destination: 'Monterrey, MX', status: 'delayed', carrier: 'FedEx Freight', trackingId: 'FDX345678', weight: 18700, category: 'automotive', priority: 'high', eta: new Date(Date.now() + 36 * 3600000).toISOString(), currentLocation: { lat: 29.4241, lng: -98.4936, city: 'San Antonio, TX' }, route: [{ lat: 42.3314, lng: -83.0458 }, { lat: 29.4241, lng: -98.4936 }, { lat: 25.6866, lng: -100.3161 }] },
  { id: 'SHP-004', name: 'Textile Export', origin: 'Bangladesh', destination: 'Rotterdam, NL', status: 'at_port', carrier: 'Maersk', trackingId: 'MSK901234', weight: 42000, category: 'textiles', priority: 'medium', eta: new Date(Date.now() + 120 * 3600000).toISOString(), currentLocation: { lat: 23.8103, lng: 90.4125, city: 'Chittagong Port' }, route: [{ lat: 23.8103, lng: 90.4125 }, { lat: 12.3657, lng: 43.5950 }, { lat: 51.9225, lng: 4.4792 }] },
  { id: 'SHP-005', name: 'Food Perishables', origin: 'São Paulo, BR', destination: 'New York, NY', status: 'in_transit', carrier: 'LATAM Cargo', trackingId: 'LAT567890', weight: 8900, category: 'perishables', priority: 'critical', eta: new Date(Date.now() + 28 * 3600000).toISOString(), currentLocation: { lat: 10.4806, lng: -66.9036, city: 'Caracas Airspace' }, route: [{ lat: -23.5505, lng: -46.6333 }, { lat: 10.4806, lng: -66.9036 }, { lat: 40.7128, lng: -74.0060 }] }
];

// ─── Weather Data Fetcher ────────────────────────────────────────────────────
async function fetchWeatherData(lat, lng) {
  try {
    if (!process.env.OPENWEATHER_API_KEY) {
      return generateMockWeather(lat, lng);
    }
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`,
      { timeout: 5000 }
    );
    return {
      condition: data.weather[0].main,
      description: data.weather[0].description,
      windSpeed: data.wind?.speed,
      visibility: data.visibility,
      temperature: data.main?.temp,
      humidity: data.main?.humidity,
      alerts: data.alerts || []
    };
  } catch {
    return generateMockWeather(lat, lng);
  }
}

function generateMockWeather(lat, lng) {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm', 'Snow', 'Fog'];
  const weights = [40, 25, 15, 8, 7, 5];
  const rand = Math.random() * 100;
  let acc = 0;
  let condition = 'Clear';
  for (let i = 0; i < conditions.length; i++) {
    acc += weights[i];
    if (rand < acc) { condition = conditions[i]; break; }
  }
  return { condition, description: condition.toLowerCase(), windSpeed: Math.random() * 30, visibility: condition === 'Fog' ? 200 : 10000, temperature: 15 + (lat / 90) * 20 * Math.random(), humidity: 40 + Math.random() * 50, alerts: condition === 'Thunderstorm' ? [{ event: 'Severe Thunderstorm Warning' }] : [] };
}

// ─── Traffic Data Fetcher ────────────────────────────────────────────────────
async function fetchTrafficData(lat, lng) {
  try {
    if (!process.env.TOMTOM_API_KEY) return generateMockTraffic();
    const { data } = await axios.get(
      `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${process.env.TOMTOM_API_KEY}&point=${lat},${lng}`,
      { timeout: 5000 }
    );
    const flow = data.flowSegmentData || {};
    return {
      currentSpeed: flow.currentSpeed || 60,
      freeFlowSpeed: flow.freeFlowSpeed || 80,
      congestionLevel: flow.currentTravelTime && flow.freeFlowTravelTime
        ? ((flow.currentTravelTime - flow.freeFlowTravelTime) / flow.freeFlowTravelTime) * 100 : 0,
      incidents: []
    };
  } catch {
    return generateMockTraffic();
  }
}

function generateMockTraffic() {
  const congestion = Math.random() * 100;
  return { currentSpeed: Math.max(5, 80 - congestion * 0.6), freeFlowSpeed: 80, congestionLevel: congestion, incidents: congestion > 70 ? [{ type: 'accident', description: 'Multiple vehicle incident', severity: 'major' }] : [] };
}

// ─── Port Status Fetcher ─────────────────────────────────────────────────────
function fetchPortStatus(portName) {
  const statuses = ['operational', 'operational', 'operational', 'congested', 'partial_closure'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  return { port: portName, status, congestionLevel: status === 'congested' ? 85 : Math.random() * 40, waitTime: status === 'congested' ? 24 + Math.random() * 48 : Math.random() * 8, alerts: status === 'partial_closure' ? ['Berth 4-6 closed for maintenance'] : [] };
}

// ─── Smart Risk Scorer (no Gemini — uses real sensor data) ───────────────────
function computeRiskScore(shipment, weather, traffic, portStatus) {
  let score = 0;
  const factors = [];

  // Weather risk
  const weatherRisk = { Thunderstorm: 35, Snow: 28, Fog: 20, Rain: 15, Clouds: 5, Clear: 0 };
  const wScore = weatherRisk[weather?.condition] || 10;
  score += wScore;
  if (wScore > 10) factors.push({ type: 'weather', severity: wScore > 25 ? 'high' : 'medium', description: `${weather?.condition} conditions detected`, affectedSegment: shipment.currentLocation?.city || 'Current location', estimatedDelayHours: Math.round(wScore / 8) });

  // Traffic risk
  const tScore = Math.min(30, (traffic?.congestionLevel || 0) * 0.3);
  score += tScore;
  if (tScore > 10) factors.push({ type: 'traffic', severity: tScore > 20 ? 'high' : 'medium', description: `Traffic congestion at ${Math.round(traffic?.congestionLevel || 0)}%`, affectedSegment: 'Route corridor', estimatedDelayHours: Math.round(tScore / 10) });

  // Port congestion
  if (portStatus?.status === 'congested') { score += 25; factors.push({ type: 'port', severity: 'high', description: `Port congestion — ${portStatus.waitTime?.toFixed(0)}h wait time`, affectedSegment: shipment.origin, estimatedDelayHours: Math.round(portStatus.waitTime || 12) }); }
  if (portStatus?.status === 'partial_closure') { score += 35; factors.push({ type: 'port', severity: 'critical', description: 'Partial port closure affecting operations', affectedSegment: shipment.origin, estimatedDelayHours: 24 }); }

  // Shipment status bonus
  if (shipment.status === 'delayed') score += 15;
  if (shipment.priority === 'critical') score = Math.min(score + 5, 95);

  score = Math.min(Math.round(score + Math.random() * 8), 100);
  const riskLevel = score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

  if (factors.length === 0) factors.push({ type: 'mechanical', severity: 'low', description: 'No significant risk factors detected', affectedSegment: 'All segments', estimatedDelayHours: 0 });

  const delayHours = factors.reduce((a, f) => a + f.estimatedDelayHours, 0);
  const predictedETA = new Date(new Date(shipment.eta).getTime() + delayHours * 3600000).toISOString();

  return {
    shipmentId: shipment.id, riskScore: score, riskLevel,
    riskFactors: factors,
    recommendations: [{ action: score > 50 ? 'reroute' : score > 25 ? 'monitor' : 'monitor', priority: score > 75 ? 'immediate' : score > 50 ? 'high' : 'low', description: score > 75 ? 'Immediate rerouting required — critical risk detected' : score > 50 ? 'Monitor closely and prepare alternate route' : 'Normal operations — continue monitoring', alternateRoute: null, estimatedTimeSaving: score > 50 ? Math.round(delayHours * 0.6) : 0 }],
    etaAdjustment: { originalETA: shipment.eta, predictedETA, delayHours, confidence: 0.82 },
    cascadeRisk: { affectedShipments: score > 60 ? Math.floor(Math.random() * 3) + 1 : 0, estimatedImpact: score > 60 ? 'Potential downstream delays' : 'Minimal cascade impact' },
    aiInsight: `Shipment ${shipment.name} shows ${riskLevel} risk (score: ${score}/100). ${delayHours > 0 ? `Estimated ${delayHours}h delay.` : 'On track.'} ${score > 50 ? 'Recommend proactive intervention.' : 'Continue standard monitoring.'}`,
    analyzedAt: new Date().toISOString(),
    source: 'smart-sensor'  // marks as sensor-based, not Gemini
  };
}

// ─── Main Data Ingestion (sensor-based, no Gemini calls) ─────────────────────
async function startDataIngestion(io) {
  logger.info('🔄 Starting data ingestion cycle...');

  const successful = [];
  for (const shipment of MOCK_SHIPMENTS) {
    try {
      const [weather, traffic] = await Promise.all([
        fetchWeatherData(shipment.currentLocation.lat, shipment.currentLocation.lng),
        fetchTrafficData(shipment.currentLocation.lat, shipment.currentLocation.lng)
      ]);
      const portStatus = shipment.status === 'at_port' ? fetchPortStatus(shipment.origin) : null;

      const enrichedShipment = { ...shipment, realTimeData: { weather, traffic, portStatus, timestamp: new Date().toISOString() } };

      // Smart sensor-based risk score (instant, no API calls)
      const analysis = computeRiskScore(shipment, weather, traffic, portStatus);
      const finalData = { ...enrichedShipment, analysis, lastAnalyzed: new Date().toISOString() };

      await saveToFirestore('shipments', shipment.id, finalData);

      if (io) {
        io.emit('shipment_update', { shipmentId: shipment.id, riskScore: analysis.riskScore, riskLevel: analysis.riskLevel, recommendation: analysis.recommendations?.[0] });
        if (analysis.riskScore > 50) {
          io.emit('disruption_alert', { shipmentId: shipment.id, shipmentName: shipment.name, riskScore: analysis.riskScore, riskLevel: analysis.riskLevel, message: analysis.riskFactors?.[0]?.description, timestamp: new Date().toISOString() });
        }
      }
      successful.push(finalData);
    } catch (err) {
      logger.error(`Ingestion failed for ${shipment.id}:`, err.message);
    }
  }

  logger.info(`✅ Data ingestion complete: ${successful.length}/${MOCK_SHIPMENTS.length} shipments processed`);
  return successful;
}

module.exports = { startDataIngestion, MOCK_SHIPMENTS, fetchWeatherData, fetchTrafficData };
