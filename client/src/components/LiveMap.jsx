import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';

// Fix Leaflet's default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function getRiskColor(score) {
  if (score >= 76) return '#ef4444';
  if (score >= 51) return '#f97316';
  if (score >= 26) return '#f59e0b';
  return '#22c55e';
}

function getRiskLabel(score) {
  if (score >= 76) return 'Critical';
  if (score >= 51) return 'High';
  if (score >= 26) return 'Medium';
  return 'Low';
}

// Custom colored marker icon
function createShipmentIcon(riskScore) {
  const color = getRiskColor(riskScore);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${color}" flood-opacity="0.5"/>
        </filter>
      </defs>
      <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 24 12 24s12-15 12-24C28 5.4 22.6 0 16 0z"
        fill="${color}" stroke="white" stroke-width="2" filter="url(#shadow)"/>
      <circle cx="16" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
    className: '',
  });
}

// Auto-fit map to shipment bounds
function FitBounds({ shipments }) {
  const map = useMap();
  useEffect(() => {
    if (shipments.length === 0) return;
    const coords = shipments
      .filter(s => s.currentLocation?.lat && s.currentLocation?.lng)
      .map(s => [s.currentLocation.lat, s.currentLocation.lng]);
    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [60, 60], maxZoom: 5 });
    }
  }, [shipments, map]);
  return null;
}

export default function LiveMap({ shipments = [], height = 480 }) {
  const validShipments = useMemo(() =>
    shipments.filter(s => s.currentLocation?.lat && s.currentLocation?.lng),
  [shipments]);

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 py-3 flex items-center justify-between pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(8,15,32,0.85), transparent)', backdropFilter: 'blur(4px)' }}>
        <div className="flex items-center gap-3">
          <motion.div
            className="w-2 h-2 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-sm font-semibold text-white">Live Shipment Tracker</span>
          <span className="text-xs text-white/50">{validShipments.length} active shipments</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-white/60">
          {[['Critical','#ef4444'],['High','#f97316'],['Medium','#f59e0b'],['Low','#22c55e']].map(([label,color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ width: '100%', height: '100%', background: '#050c1a' }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        {/* Dark themed map tiles from CartoDB */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        <FitBounds shipments={validShipments} />

        {validShipments.map(shipment => {
          const riskScore = shipment.analysis?.riskScore ?? 0;
          const color = getRiskColor(riskScore);
          const pos = [shipment.currentLocation.lat, shipment.currentLocation.lng];

          // Route polyline points
          const routePoints = shipment.route?.map(r => [r.lat, r.lng]) ?? [];

          return (
            <React.Fragment key={shipment.id}>
              {/* Route line */}
              {routePoints.length >= 2 && (
                <Polyline
                  positions={routePoints}
                  pathOptions={{
                    color,
                    weight: 2.5,
                    opacity: 0.6,
                    dashArray: '8 5',
                  }}
                />
              )}

              {/* Risk heatmap glow circle */}
              {riskScore >= 50 && (
                <CircleMarker
                  center={pos}
                  radius={30}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.08,
                    weight: 0,
                  }}
                />
              )}

              {/* Shipment marker */}
              <Marker
                position={pos}
                icon={createShipmentIcon(riskScore)}
              >
                <Popup
                  className="chainguard-popup"
                  maxWidth={260}
                >
                  <div style={{
                    background: 'rgba(8,15,32,0.97)',
                    border: `1px solid ${color}40`,
                    borderRadius: '12px',
                    padding: '14px',
                    color: 'white',
                    fontFamily: 'Inter, sans-serif',
                    minWidth: '220px',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                      <div style={{ fontWeight:700, fontSize:'13px' }}>{shipment.name}</div>
                      <div style={{
                        background: color + '25',
                        border: `1px solid ${color}60`,
                        borderRadius:'20px',
                        padding:'2px 8px',
                        fontSize:'10px',
                        fontWeight:700,
                        color,
                        textTransform:'uppercase',
                        letterSpacing:'0.05em',
                      }}>
                        {getRiskLabel(riskScore)} {riskScore}
                      </div>
                    </div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', lineHeight:'1.7' }}>
                      <div>📍 <b style={{color:'white'}}>Location:</b> {shipment.currentLocation?.city || 'In transit'}</div>
                      <div>🚢 <b style={{color:'white'}}>Carrier:</b> {shipment.carrier}</div>
                      <div>📦 <b style={{color:'white'}}>From:</b> {shipment.origin}</div>
                      <div>🎯 <b style={{color:'white'}}>To:</b> {shipment.destination}</div>
                      <div>⏰ <b style={{color:'white'}}>ETA:</b> {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : '—'}</div>
                      <div>⚡ <b style={{color:'white'}}>Status:</b> {shipment.status?.replace('_',' ')}</div>
                    </div>
                    {shipment.analysis?.aiInsight && (
                      <div style={{
                        marginTop:'10px',
                        padding:'8px',
                        background:'rgba(255,255,255,0.04)',
                        borderRadius:'8px',
                        fontSize:'10px',
                        color:'rgba(255,255,255,0.55)',
                        lineHeight:'1.5',
                      }}>
                        🤖 {shipment.analysis.aiInsight.slice(0, 120)}...
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Bottom shipment pills */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] p-3 flex gap-2 overflow-x-auto pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(8,15,32,0.92), transparent)' }}>
        {validShipments.map(s => (
          <motion.div
            key={s.id}
            className="pointer-events-auto flex-shrink-0 flex items-center gap-2 rounded-xl px-3 py-1.5 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
            whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.12)' }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: getRiskColor(s.analysis?.riskScore ?? 0), boxShadow: `0 0 6px ${getRiskColor(s.analysis?.riskScore ?? 0)}` }} />
            <div>
              <div className="text-xs font-semibold text-white whitespace-nowrap">{s.name?.split(' ').slice(0,2).join(' ')}</div>
              <div className="text-[10px] text-white/40">{s.analysis?.riskScore ?? '—'} risk · {s.currentLocation?.city || 'In transit'}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom popup styles */}
      <style>{`
        .chainguard-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
          border-radius: 12px !important;
        }
        .chainguard-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .chainguard-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-container {
          background: #050c1a !important;
        }
      `}</style>
    </div>
  );
}
