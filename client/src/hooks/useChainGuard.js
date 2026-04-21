import { useState, useEffect, useCallback, useRef } from 'react';
import { getShipments, getAnalyticsOverview } from '../services/api';
import getSocket from '../services/socket';

/**
 * Hook for live shipment data with Socket.IO updates
 */
export function useShipments() {
  const [shipments, setShipments] = useState(getDemoShipments()); // Always start with demo data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getShipments();
      // Only update if we got valid shipment data (not HTML from Firebase rewrite)
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setShipments(res.data);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
      // Keep demo data — already set as initial state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();

    const socket = getSocket();
    socket.on('shipment_update', (update) => {
      setShipments(prev => prev.map(s =>
        s.id === update.shipmentId
          ? { ...s, analysis: { ...s.analysis, riskScore: update.riskScore, riskLevel: update.riskLevel } }
          : s
      ));
    });

    const interval = setInterval(fetchShipments, 60000);
    return () => {
      socket.off('shipment_update');
      clearInterval(interval);
    };
  }, [fetchShipments]);

  return { shipments, loading, error, refetch: fetchShipments };
}

/**
 * Hook for real-time disruption alerts via Socket.IO
 */
export function useDisruptionAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();

    socket.on('disruption_alert', (alert) => {
      setAlerts(prev => [{ ...alert, id: Date.now(), read: false }, ...prev].slice(0, 50));
      setUnreadCount(c => c + 1);
    });

    socket.on('global_alert', (alert) => {
      setAlerts(prev => [{ ...alert, read: false }, ...prev].slice(0, 50));
      setUnreadCount(c => c + 1);
    });

    return () => {
      socket.off('disruption_alert');
      socket.off('global_alert');
    };
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    setUnreadCount(0);
  }, []);

  return { alerts, unreadCount, markAllRead };
}

/**
 * Hook for analytics overview data
 */
export function useAnalytics() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsOverview()
      .then(res => setOverview(res.data))
      .catch(() => setOverview(getDemoOverview()))
      .finally(() => setLoading(false));
  }, []);

  return { overview, loading };
}

/**
 * WebSocket connection status hook
 */
export function useSocketStatus() {
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const pingRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    // After 5s if still not connected → demo mode
    const demoTimer = setTimeout(() => {
      if (!socket.connected) setIsDemoMode(true);
    }, 5000);

    socket.on('connect', () => { setConnected(true); setIsDemoMode(false); });
    socket.on('disconnect', () => { setConnected(false); setLatency(null); });
    socket.on('connected', () => setConnected(true));

    pingRef.current = setInterval(() => {
      if (socket.connected) {
        const start = Date.now();
        socket.emit('ping', () => setLatency(Date.now() - start));
      }
    }, 10000);

    setConnected(socket.connected);
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connected');
      clearInterval(pingRef.current);
      clearTimeout(demoTimer);
    };
  }, []);

  return { connected, latency, isDemoMode };
}

// ─── Demo Data Fallback ───────────────────────────────────────────────────────
function getDemoShipments() {
  return [
    {
      id: 'SHP-001', name: 'Electronics Batch A', origin: 'Shanghai, CN', destination: 'Los Angeles, CA',
      status: 'in_transit', carrier: 'COSCO', priority: 'high',
      eta: new Date(Date.now() + 72*3600000).toISOString(),
      currentLocation: { lat: 35.6762, lng: 139.6503, city: 'Tokyo Bay' },
      route: [{ lat: 31.2304, lng: 121.4737 }, { lat: 35.6762, lng: 139.6503 }, { lat: 34.0522, lng: -118.2437 }],
      analysis: { riskScore: 72, riskLevel: 'high', riskFactors: [{ type: 'weather', severity: 'high', description: 'Typhoon warning in transit zone', affectedSegment: 'Pacific Route', estimatedDelayHours: 8 }], recommendations: [{ action: 'reroute', priority: 'high', description: 'Alternate northern route recommended', alternateRoute: 'Northern Pacific', estimatedTimeSaving: 4 }], aiInsight: 'High risk due to typhoon activity. Rerouting via northern corridor recommended.' }
    },
    {
      id: 'SHP-002', name: 'Pharma Cold Chain', origin: 'Mumbai, IN', destination: 'London, UK',
      status: 'in_transit', carrier: 'DHL Express', priority: 'critical',
      eta: new Date(Date.now() + 18*3600000).toISOString(),
      currentLocation: { lat: 25.2048, lng: 55.2708, city: 'Dubai Hub' },
      route: [{ lat: 19.0760, lng: 72.8777 }, { lat: 25.2048, lng: 55.2708 }, { lat: 51.5074, lng: -0.1278 }],
      analysis: { riskScore: 28, riskLevel: 'low', riskFactors: [{ type: 'mechanical', severity: 'low', description: 'No significant risk factors detected', affectedSegment: 'All segments', estimatedDelayHours: 0 }], recommendations: [{ action: 'monitor', priority: 'low', description: 'Normal operations — continue monitoring', alternateRoute: null, estimatedTimeSaving: 0 }], aiInsight: 'Shipment on track. Cold chain integrity maintained through Dubai hub.' }
    },
    {
      id: 'SHP-003', name: 'Auto Parts Cargo', origin: 'Detroit, MI', destination: 'Monterrey, MX',
      status: 'delayed', carrier: 'FedEx Freight', priority: 'high',
      eta: new Date(Date.now() + 36*3600000).toISOString(),
      currentLocation: { lat: 29.4241, lng: -98.4936, city: 'San Antonio, TX' },
      route: [{ lat: 42.3314, lng: -83.0458 }, { lat: 29.4241, lng: -98.4936 }, { lat: 25.6866, lng: -100.3161 }],
      analysis: { riskScore: 89, riskLevel: 'critical', riskFactors: [{ type: 'traffic', severity: 'critical', description: 'Major highway closure detected', affectedSegment: 'I-35 Corridor', estimatedDelayHours: 12 }], recommendations: [{ action: 'reroute', priority: 'immediate', description: 'Take I-10 bypass immediately', alternateRoute: 'I-10 West', estimatedTimeSaving: 6 }], aiInsight: 'Critical: Highway closure causing severe delays. Immediate rerouting via I-10 bypass required.' }
    },
    {
      id: 'SHP-004', name: 'Textile Export', origin: 'Bangladesh', destination: 'Rotterdam, NL',
      status: 'at_port', carrier: 'Maersk', priority: 'medium',
      eta: new Date(Date.now() + 120*3600000).toISOString(),
      currentLocation: { lat: 23.8103, lng: 90.4125, city: 'Chittagong Port' },
      route: [{ lat: 23.8103, lng: 90.4125 }, { lat: 12.3657, lng: 43.5950 }, { lat: 51.9225, lng: 4.4792 }],
      analysis: { riskScore: 45, riskLevel: 'medium', riskFactors: [{ type: 'port', severity: 'medium', description: 'Port congestion at Chittagong', affectedSegment: 'Origin Port', estimatedDelayHours: 18 }], recommendations: [{ action: 'hold', priority: 'medium', description: 'Monitor port congestion levels', alternateRoute: null, estimatedTimeSaving: 0 }], aiInsight: 'Port congestion causing moderate delays. Monitoring berth availability.' }
    },
    {
      id: 'SHP-005', name: 'Food Perishables', origin: 'São Paulo, BR', destination: 'New York, NY',
      status: 'in_transit', carrier: 'LATAM Cargo', priority: 'critical',
      eta: new Date(Date.now() + 28*3600000).toISOString(),
      currentLocation: { lat: 10.4806, lng: -66.9036, city: 'Caracas Airspace' },
      route: [{ lat: -23.5505, lng: -46.6333 }, { lat: 10.4806, lng: -66.9036 }, { lat: 40.7128, lng: -74.0060 }],
      analysis: { riskScore: 61, riskLevel: 'high', riskFactors: [{ type: 'weather', severity: 'high', description: 'Severe turbulence zone ahead', affectedSegment: 'Caribbean Corridor', estimatedDelayHours: 3 }], recommendations: [{ action: 'expedite', priority: 'high', description: 'Expedite handling at JFK arrival', alternateRoute: null, estimatedTimeSaving: 2 }], aiInsight: 'Perishables at risk due to turbulence. Priority handling at destination recommended.' }
    }
  ];
}

function getDemoOverview() {
  return { totalShipments: 5, activeAlerts: 3, avgRiskScore: 59, disruptionsDetected: 47, routesSaved: 23, avgResolutionTime: 2.4, earlyDetectionRate: 94, onTimeDeliveryRate: 87, costSavings: 284000, co2Reduced: 12.4, trend: { improvement: 40 } };
}
