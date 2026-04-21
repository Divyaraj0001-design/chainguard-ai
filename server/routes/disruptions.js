const express = require('express');
const router = express.Router();
const { queryFirestore } = require('../services/firebase');
const { MOCK_SHIPMENTS } = require('../services/dataIngestion');
const logger = require('../utils/logger');

// GET /api/disruptions — recent disruptions
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    let disruptions = await queryFirestore('disruptions', [], { field: 'analyzedAt', direction: 'desc' }, limit);

    if (disruptions.length === 0) {
      // Generate mock disruption history
      disruptions = generateMockDisruptions();
    }
    res.json({ success: true, count: disruptions.length, data: disruptions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/disruptions/active — high-risk active disruptions
router.get('/active', async (req, res) => {
  try {
    let disruptions = await queryFirestore('disruptions', [{ field: 'riskScore', op: '>', value: 50 }], { field: 'riskScore', direction: 'desc' }, 20);
    if (disruptions.length === 0) disruptions = generateMockDisruptions().filter(d => d.riskScore > 50);
    res.json({ success: true, count: disruptions.length, data: disruptions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/disruptions/heatmap — risk heatmap data
router.get('/heatmap', async (req, res) => {
  try {
    const heatmapData = MOCK_SHIPMENTS.map(s => ({
      lat: s.currentLocation.lat,
      lng: s.currentLocation.lng,
      weight: Math.random(),
      shipmentId: s.id,
      riskScore: Math.floor(Math.random() * 100)
    }));
    res.json({ success: true, data: heatmapData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function generateMockDisruptions() {
  const types = ['weather', 'traffic', 'port', 'customs', 'geopolitical', 'mechanical'];
  const severities = ['low', 'medium', 'high', 'critical'];
  return Array.from({ length: 20 }, (_, i) => ({
    id: `DIS-${String(i + 1).padStart(3, '0')}`,
    shipmentId: MOCK_SHIPMENTS[i % MOCK_SHIPMENTS.length].id,
    type: types[Math.floor(Math.random() * types.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    riskScore: Math.floor(Math.random() * 100),
    description: `Disruption event detected on route segment ${i + 1}`,
    resolvedAt: i < 15 ? new Date(Date.now() - i * 3600000 * 2).toISOString() : null,
    resolutionTimeHours: i < 15 ? Math.floor(Math.random() * 12) : null,
    analyzedAt: new Date(Date.now() - i * 3600000).toISOString(),
    rerouteExecuted: Math.random() > 0.5
  }));
}

module.exports = router;
