import React from 'react';
import Header from '../components/Header';
import LiveMap from '../components/LiveMap';
import { useShipments } from '../hooks/useChainGuard';

export default function MapView() {
  const { shipments, loading, refetch } = useShipments();
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Live Map" subtitle="Global shipment tracking with risk heatmap overlay" onRefresh={refetch} loading={loading} />
      <div className="flex-1 p-6">
        <div className="glass-card overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
          <LiveMap shipments={shipments} height="100%" />
        </div>
      </div>
    </div>
  );
}
