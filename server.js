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

// 🔸 Serve static frontend files (assumes root files like index.html are outside backend/)
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
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// 🔸 API: Submit a new report
app.post('/api/report', upload.single('photo'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const location = latitude && longitude ? `Lat: ${latitude}, Lon: ${longitude}` : 'Unknown';
    const imageUrl = `/uploads/${req.file.filename}`;
    const report = new Report({ location, imageUrl });
    await report.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving report:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// 🔸 API: Get all reports
app.get('/api/events', async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// 🔸 Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve other HTML pages using clean URLs
app.get('/report', (req, res) => {
  res.sendFile(path.join(__dirname, 'report.html'));
});

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'events.html'));
});

app.get('/ngo', (req, res) => {
  res.sendFile(path.join(__dirname, 'ngo.html'));
});

app.get('/userbdg', (req, res) => {
  res.sendFile(path.join(__dirname, 'userbdg.html'));
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// 🔸 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
