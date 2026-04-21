const express = require('express');
const router = express.Router();
const { analyzeDisruptionRisk, generateRerouteRecommendation, generateSupplyChainSummary } = require('../services/geminiEngine');
const { queryFirestore, saveToFirestore } = require('../services/firebase');
const { MOCK_SHIPMENTS } = require('../services/dataIngestion');
const logger = require('../utils/logger');

// GET /api/ai/status — Gemini engine status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    engine: 'Google Gemini 1.5 Flash',
    status: process.env.GEMINI_API_KEY ? 'active' : 'demo_mode',
    capabilities: ['disruption_analysis', 'rerouting', 'cascade_prediction', 'eta_adjustment', 'supply_chain_summary'],
    rateLimit: '15 rpm (Gemini Flash)',
    timestamp: new Date().toISOString()
  });
});

// POST /api/ai/analyze — analyze a single shipment
router.post('/analyze', async (req, res) => {
  try {
    const shipmentData = req.body;
    if (!shipmentData || !shipmentData.id) {
      return res.status(400).json({ success: false, error: 'Shipment data with id required' });
    }
    const analysis = await analyzeDisruptionRisk(shipmentData);
    await saveToFirestore('disruptions', `${shipmentData.id}-${Date.now()}`, { ...analysis, shipmentId: shipmentData.id });
    req.io?.emit('disruption_alert', { shipmentId: shipmentData.id, riskScore: analysis.riskScore, riskLevel: analysis.riskLevel });
    res.json({ success: true, data: analysis });
  } catch (err) {
    logger.error('POST /ai/analyze error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai/reroute — generate reroute recommendation
router.post('/reroute', async (req, res) => {
  try {
    const { shipmentData, disruptionContext, availableRoutes } = req.body;
    const recommendation = await generateRerouteRecommendation(shipmentData, disruptionContext, availableRoutes || getDefaultRoutes(shipmentData));
    res.json({ success: true, data: recommendation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ai/summary — global supply chain health summary
router.get('/summary', async (req, res) => {
  try {
    let shipments = await queryFirestore('shipments', [], null, 50);
    if (shipments.length === 0) shipments = MOCK_SHIPMENTS.map(s => ({ ...s, riskScore: Math.floor(Math.random() * 100) }));
    const summary = await generateSupplyChainSummary(shipments);
    res.json({ success: true, data: { summary, shipmentCount: shipments.length, generatedAt: new Date().toISOString() } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function getDefaultRoutes(shipment) {
  return [
    { id: 'R1', name: 'Sea Route via Pacific', estimatedDays: 14, cost: 4200, reliabilityScore: 87 },
    { id: 'R2', name: 'Air Freight Express', estimatedDays: 2, cost: 18500, reliabilityScore: 96 },
    { id: 'R3', name: 'Rail + Sea Hybrid', estimatedDays: 18, cost: 2800, reliabilityScore: 79 }
  ];
}

module.exports = router;
