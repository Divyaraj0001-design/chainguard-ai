const express = require('express');
const router = express.Router();
const { queryFirestore, memStore, saveToFirestore } = require('../services/firebase');
const { MOCK_SHIPMENTS, fetchWeatherData, fetchTrafficData } = require('../services/dataIngestion');
const { analyzeDisruptionRisk } = require('../services/geminiEngine');
const logger = require('../utils/logger');

// GET /api/shipments — list all shipments
router.get('/', async (req, res) => {
  try {
    let shipments = await queryFirestore('shipments', [], { field: 'lastAnalyzed', direction: 'desc' }, 100);
    // Fallback to mock data if store is empty
    if (shipments.length === 0) {
      shipments = MOCK_SHIPMENTS.map(s => ({ ...s, analysis: { riskScore: Math.floor(Math.random() * 100), riskLevel: ['low','medium','high','critical'][Math.floor(Math.random()*4)], riskFactors: [], recommendations: [] }, lastAnalyzed: new Date().toISOString() }));
    }
    res.json({ success: true, count: shipments.length, data: shipments });
  } catch (err) {
    logger.error('GET /shipments error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/shipments/:id — single shipment details
router.get('/:id', async (req, res) => {
  try {
    const { getFromFirestore } = require('../services/firebase');
    let shipment = await getFromFirestore('shipments', req.params.id);
    if (!shipment) {
      shipment = MOCK_SHIPMENTS.find(s => s.id === req.params.id);
      if (!shipment) return res.status(404).json({ success: false, error: 'Shipment not found' });
    }
    res.json({ success: true, data: shipment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/shipments/:id/analyze — trigger manual Gemini analysis
router.post('/:id/analyze', async (req, res) => {
  try {
    const { getFromFirestore } = require('../services/firebase');
    let shipment = await getFromFirestore('shipments', req.params.id)
      || MOCK_SHIPMENTS.find(s => s.id === req.params.id);

    if (!shipment) return res.status(404).json({ success: false, error: 'Shipment not found' });

    const [weather, traffic] = await Promise.all([
      fetchWeatherData(shipment.currentLocation.lat, shipment.currentLocation.lng),
      fetchTrafficData(shipment.currentLocation.lat, shipment.currentLocation.lng)
    ]);

    const enriched = { ...shipment, realTimeData: { weather, traffic, timestamp: new Date().toISOString() } };
    const analysis = await analyzeDisruptionRisk(enriched);
    const updated = { ...enriched, analysis, lastAnalyzed: new Date().toISOString() };

    await saveToFirestore('shipments', req.params.id, updated);

    // Emit real-time via socket
    req.io?.emit('shipment_update', { shipmentId: req.params.id, riskScore: analysis.riskScore, riskLevel: analysis.riskLevel });

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error('POST /:id/analyze error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/shipments — create new shipment
router.post('/', async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const newShipment = { id: `SHP-${uuidv4().slice(0,8).toUpperCase()}`, ...req.body, createdAt: new Date().toISOString(), status: 'pending' };
    await saveToFirestore('shipments', newShipment.id, newShipment);
    res.status(201).json({ success: true, data: newShipment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
