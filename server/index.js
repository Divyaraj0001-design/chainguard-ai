require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const logger = require('./utils/logger');

// Route imports
const shipmentsRouter = require('./routes/shipments');
const disruptionsRouter = require('./routes/disruptions');
const analyticsRouter = require('./routes/analytics');
const alertsRouter = require('./routes/alerts');
const mapsRouter = require('./routes/maps');
const aiRouter = require('./routes/ai');

// Service imports
const { startDataIngestion } = require('./services/dataIngestion');
const { initFirebase } = require('./services/firebase');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Attach io to every request
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ChainGuard AI', timestamp: new Date().toISOString() }));

// API Routes
app.use('/api/shipments', shipmentsRouter);
app.use('/api/disruptions', disruptionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/maps', mapsRouter);
app.use('/api/ai', aiRouter);

// Socket.IO real-time events
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  socket.emit('connected', { message: 'ChainGuard AI real-time feed active', timestamp: new Date().toISOString() });

  socket.on('subscribe_shipment', (shipmentId) => {
    socket.join(`shipment:${shipmentId}`);
    logger.info(`Socket ${socket.id} subscribed to shipment:${shipmentId}`);
  });

  socket.on('disconnect', () => logger.info(`Client disconnected: ${socket.id}`));
});

// Make io globally accessible
app.set('io', io);
global.io = io;

// Initialize Firebase
initFirebase();

// Scheduled real-time data ingestion — every 5 minutes (respects Gemini rate limits)
let ingestionRunning = false;
cron.schedule('*/5 * * * *', () => {
  if (ingestionRunning) { logger.warn('Ingestion already running, skipping cycle'); return; }
  ingestionRunning = true;
  startDataIngestion(io)
    .catch(err => logger.error('Data ingestion error:', err))
    .finally(() => { ingestionRunning = false; });
});

// Run once on startup after 10s delay
setTimeout(() => {
  startDataIngestion(io).catch(err => logger.error('Startup ingestion error:', err));
}, 10000);

// Error handler
app.use((err, _req, res, _next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error', stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 ChainGuard AI server running on port ${PORT}`);
  logger.info(`🔗 WebSocket server active`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, io };
