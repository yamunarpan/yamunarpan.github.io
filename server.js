require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// 🔧 Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 🔸 Middleware
app.use(cors({
  origin: 'https://yamunarpan.github.io',
  methods: ['GET', 'POST'],
  credentials: false
}));
app.use(express.json());

// 🔸 MongoDB connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// 🔸 Mongoose schema
const Report = mongoose.model('Report', {
  location: String,
  imageUrl: String,
  timestamp: { type: Date, default: Date.now },
});

// 🔸 File upload setup (Multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// 🔸 API: Submit report
app.post('/api/report', upload.single('photo'), async (req, res) => {
  try {
    const location = req.body.location || (req.body.latitude && req.body.longitude
      ? `Lat: ${req.body.latitude}, Lon: ${req.body.longitude}`
      : 'Unknown');

    const imageUrl = `/uploads/${req.file.filename}`;
    const report = new Report({ location, imageUrl });
    await report.save();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving report:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// 🔸 API: Get all reports (for events)
app.get('/api/events', async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// 🔸 Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

// 🔸 Serve frontend static files
app.use(express.static(path.join(__dirname, 'backend')));

// 🔸 Serve individual HTML pages
const htmlPages = ['index', 'report', 'events', 'ngo', 'userbdg'];
htmlPages.forEach(page => {
  app.get(`/${page === 'index' ? '' : page}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'backend', `${page}.html`));
  });
});

// 🔸 Redirect root to frontend GitHub Pages (Render won't host frontend)
app.get('/', (req, res) => {
  res.redirect('https://yamunarpan.github.io');
});

// 🔸 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
