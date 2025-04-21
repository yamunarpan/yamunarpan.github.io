// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// ✅ Check required ENV variables
if (!process.env.MONGO_URL) {
  console.error('❌ MONGO_URL not defined. Set it in Render dashboard.');
  process.exit(1);
}

// 🔸 Middleware
app.use(cors({
  origin: 'https://yamunarpan.github.io',
  methods: ['GET', 'POST'],
  credentials: false
}));
app.use(express.json());

// 🔸 Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// 🔸 Report Schema
const Report = mongoose.model('Report', {
  location: String,
  imageUrl: String,
  timestamp: { type: Date, default: Date.now },
});

// 🔸 API: Submit Report
app.post('/api/report', async (req, res) => {
  try {
    const location = req.body.location || 'Unknown';
    const imageUrl = req.body.imageUrl;

    if (!imageUrl) {
      return res.status(400).json({ success: false, error: "Image URL is missing" });
    }

    const report = new Report({ location, imageUrl });
    await report.save();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving report:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// 🔸 API: Get Reports
app.get('/api/events', async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// 🔸 Serve static files
app.use(express.static(path.join(__dirname, 'backend')));

// 🔸 Serve HTML pages
const htmlPages = ['index', 'report', 'events', 'ngo', 'userbdg', 'ngobdg'];
htmlPages.forEach(page => {
  app.get(`/${page === 'index' ? '' : page}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'backend', `${page}.html`));
  });
});

// 🔸 Redirect root
app.get('/', (req, res) => {
  res.redirect('https://yamunarpan.github.io');
});

// 🔸 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
