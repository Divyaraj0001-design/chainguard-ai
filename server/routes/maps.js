const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../utils/logger');

// GET /api/maps/directions — get route directions
router.get('/directions', async (req, res) => {
  try {
    const { origin, destination, waypoints } = req.query;
    if (!origin || !destination) return res.status(400).json({ success: false, error: 'origin and destination required' });

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // Return mock route data
      return res.json({ success: true, simulated: true, data: getMockDirections(origin, destination) });
    }

    const params = new URLSearchParams({
      origin, destination,
      key: apiKey,
      mode: 'driving',
      alternatives: 'true',
      traffic_model: 'best_guess',
      departure_time: 'now'
    });
    if (waypoints) params.set('waypoints', waypoints);

    const { data } = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?${params}`, { timeout: 10000 });
    res.json({ success: true, data });
  } catch (err) {
    logger.error('Directions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/maps/routes — compute optimal route (Routes API v2)
router.post('/routes', async (req, res) => {
  try {
    const { origin, destination, travelMode } = req.body;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) return res.json({ success: true, simulated: true, data: getMockRoute() });

    const { data } = await axios.post('https://routes.googleapis.com/directions/v2:computeRoutes', {
      origin: { address: origin },
      destination: { address: destination },
      travelMode: travelMode || 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: true
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline,routes.legs'
      },
      timeout: 10000
    });
    res.json({ success: true, data });
  } catch (err) {
    logger.error('Routes API error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/maps/geocode — geocode an address
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.json({ success: true, simulated: true, data: { lat: 40.7128, lng: -74.0060 } });

    const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
    const loc = data.results?.[0]?.geometry?.location;
    res.json({ success: true, data: loc || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function getMockDirections(origin, destination) {
  return {
    status: 'OK',
    routes: [{
      summary: 'Main Route',
      legs: [{ distance: { text: '850 km', value: 850000 }, duration: { text: '8 hrs 30 mins', value: 30600 }, start_address: origin, end_address: destination }],
      overview_polyline: { points: 'mockPolyline' }
    }]
  };
}

function getMockRoute() {
  return {
    routes: [
      { duration: '8h 30m', distanceMeters: 850000, summary: 'Optimal route via highway' },
      { duration: '10h 15m', distanceMeters: 920000, summary: 'Alternative scenic route' }
    ]
  };
}

module.exports = router;
