const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../utils/logger');

// POST /api/alerts/sms — send SMS via Twilio
router.post('/sms', async (req, res) => {
  try {
    const { to, message, shipmentId } = req.body;
    if (!to || !message) return res.status(400).json({ success: false, error: 'to and message required' });

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      logger.warn('Twilio not configured — SMS simulated');
      return res.json({ success: true, simulated: true, message: `SMS would be sent to ${to}: ${message}` });
    }

    const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msg = await client.messages.create({
      body: `🚨 ChainGuard AI Alert [${shipmentId}]: ${message}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });

    logger.info(`SMS sent to ${to}: ${msg.sid}`);
    res.json({ success: true, sid: msg.sid });
  } catch (err) {
    logger.error('SMS error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/alerts/webhook — fire webhook notification
router.post('/webhook', async (req, res) => {
  try {
    const { payload } = req.body;
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
      return res.json({ success: true, simulated: true, message: 'Webhook not configured — notification simulated' });
    }

    const { data } = await axios.post(webhookUrl, {
      source: 'ChainGuard AI',
      timestamp: new Date().toISOString(),
      ...payload
    }, { timeout: 10000, headers: { 'Content-Type': 'application/json', 'X-ChainGuard-Signature': 'v1:' + Date.now() } });

    res.json({ success: true, response: data });
  } catch (err) {
    logger.error('Webhook error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/alerts/broadcast — broadcast alert to all connected clients
router.post('/broadcast', async (req, res) => {
  try {
    const { type, message, severity, shipmentId } = req.body;
    const alert = { id: `ALERT-${Date.now()}`, type, message, severity, shipmentId, timestamp: new Date().toISOString() };
    req.io?.emit('global_alert', alert);
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/alerts/history — recent alerts
router.get('/history', async (req, res) => {
  const mockAlerts = Array.from({ length: 15 }, (_, i) => ({
    id: `ALERT-${i + 1}`,
    type: ['disruption', 'reroute', 'delay', 'weather'][i % 4],
    message: `Alert event ${i + 1} — Shipment flagged for review`,
    severity: ['low', 'medium', 'high', 'critical'][i % 4],
    shipmentId: `SHP-00${(i % 5) + 1}`,
    timestamp: new Date(Date.now() - i * 3600000 * 3).toISOString(),
    acknowledged: i > 5
  }));
  res.json({ success: true, count: mockAlerts.length, data: mockAlerts });
});

module.exports = router;
