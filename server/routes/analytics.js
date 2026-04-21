const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// GET /api/analytics/overview — KPI summary
router.get('/overview', async (req, res) => {
  try {
    const data = {
      totalShipments: 5,
      activeAlerts: 3,
      avgRiskScore: 52,
      disruptionsDetected: 47,
      routesSaved: 23,
      avgResolutionTime: 2.4,
      earlyDetectionRate: 94,
      onTimeDeliveryRate: 87,
      costSavings: 284000,
      co2Reduced: 12.4,
      sdgImpact: { sdg9: 'Resilient infrastructure', sdg11: 'Sustainable logistics' },
      trend: {
        disruptionsThisWeek: 12,
        disruptionsLastWeek: 20,
        improvement: 40
      }
    };
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/timeseries — disruption trend data
router.get('/timeseries', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.now() - (days - i) * 86400000);
      return {
        date: date.toISOString().slice(0, 10),
        disruptions: Math.floor(Math.random() * 8 + 1),
        resolved: Math.floor(Math.random() * 6 + 1),
        avgRiskScore: Math.floor(Math.random() * 60 + 20),
        reroutesExecuted: Math.floor(Math.random() * 4)
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/risk-distribution — pie chart data
router.get('/risk-distribution', async (req, res) => {
  res.json({
    success: true,
    data: [
      { level: 'Critical', count: 2, color: '#ef4444' },
      { level: 'High', count: 5, color: '#f97316' },
      { level: 'Medium', count: 8, color: '#eab308' },
      { level: 'Low', count: 15, color: '#22c55e' }
    ]
  });
});

// GET /api/analytics/route-performance — route efficiency data
router.get('/route-performance', async (req, res) => {
  res.json({
    success: true,
    data: [
      { route: 'Shanghai→LA', onTime: 92, disruptions: 3, avgDelay: 1.2, cost: 4200 },
      { route: 'Mumbai→London', onTime: 88, disruptions: 5, avgDelay: 2.8, cost: 6800 },
      { route: 'Detroit→Monterrey', onTime: 76, disruptions: 9, avgDelay: 4.1, cost: 1200 },
      { route: 'Bangladesh→Rotterdam', onTime: 84, disruptions: 4, avgDelay: 1.8, cost: 3100 },
      { route: 'SãoPaulo→NYC', onTime: 91, disruptions: 2, avgDelay: 0.9, cost: 8900 }
    ]
  });
});

module.exports = router;
