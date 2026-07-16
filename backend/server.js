const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const {
  globalLimiter,
  authLimiter,
  chatLimiter,
  uploadLimiter,
  apiLimiter,
  mongoSanitizer,
  chatMessageGuard,
} = require('./middleware/security');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const workspaceRoutes = require('./routes/workspace');
const analyticsRoutes = require('./routes/analytics');
const uploadRoutes = require('./routes/upload');
const visitorsRoutes = require('./routes/visitors');
const billingRoutes = require('./routes/billing');
const knowledgeRoutes = require('./routes/knowledge');
const campaignRoutes = require('./routes/campaign');
const chatSocket = require('./sockets/chatSocket');

const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Security Headers — CSP enabled with widget-safe config
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://*.vercel.app", "https://*.onrender.com", "wss:"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

// CORS — whitelist only known origins (widget uses open CORS per-route below)
const corsOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));

// Global rate limit + MongoDB injection sanitizer — applied to every route
app.use(globalLimiter);
app.use(mongoSanitizer);

// Stripe webhook must come BEFORE express.json() to parse raw bodies
const stripeWebhookRoutes = require('./routes/stripeWebhook');
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRoutes);

app.use(express.json({ limit: '1mb' }));



// Static Files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
chatSocket(io);

// Make IO accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Dashboard Origin Whitelist Middleware
const allowedOrigins = [process.env.FRONTEND_URL || 'https://xiachat-pied.vercel.app', 'http://localhost:3000'];
const restrictOrigin = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'CORS origin not allowed for this route' });
  }
  next();
};

// API Routes
app.use('/api/auth', authLimiter, restrictOrigin, authRoutes);
// Widget chat routes — open CORS (third-party sites) + chat-specific rate limit + message size guard
app.use('/api', cors({ origin: '*', methods: ['GET', 'POST'] }), chatLimiter, chatMessageGuard, chatRoutes);
app.use('/api/workspaces', restrictOrigin, workspaceRoutes);
app.use('/api/analytics', restrictOrigin, analyticsRoutes);
app.use('/api/upload', restrictOrigin, uploadLimiter, uploadRoutes);
app.use('/api/visitors', restrictOrigin, visitorsRoutes);
app.use('/api/billing', restrictOrigin, billingRoutes);
app.use('/api/knowledge', restrictOrigin, knowledgeRoutes);
app.use('/api/campaigns', restrictOrigin, campaignRoutes);

const savedRepliesRoutes = require('./routes/savedReplies');
app.use('/api/saved-replies', restrictOrigin, savedRepliesRoutes);

const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoutes);

// Health check — minimal response (no internal info leakage)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health-v2', (req, res) => {
  res.json({ status: 'ok' });
});

// Start Server
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  console.log(`🚀 Real-time Backend running on http://localhost:${PORT}`);
});
