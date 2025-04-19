// 🔸 Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();

// 🔸 Middleware
app.use(cors());
app.use(express.json());

// 🔸 Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 🔸 Serve static frontend files
app.use(express.static(path.join(__dirname, 'backend')));

// 🔸 Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// 🔸 Define Report schema
const Report = mongoose.model('Report', {
  location: String,
  imageUrl: String,
  timestamp: { type: Date, default: Date.now },
});

// 🔸 Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '/uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// 🔸 API: Submit a new report
app.post('/api/report', upload.single('photo'), async (req, res) => {
  try {
    const location = req.body.location || 'Unknown';
    const imageUrl = `/uploads/${req.file.filename}`;
    const report = new Report({ location, imageUrl });
    await report.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving report:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// 🔸 API: Get all reports (used for events)
app.get('/api/events', async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// 🔸 Serve frontend HTML pages
const htmlPages = ['index', 'report', 'events', 'ngo', 'userbdg'];
htmlPages.forEach(page => {
  app.get(`/${page === 'index' ? '' : page}`, (req, res) => {
    res.sendFile(path.join(__dirname, `/${page}.html`));
  });
});

// 🔸 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
