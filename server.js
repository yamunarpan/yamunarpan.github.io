// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// ✅ Check required ENV variables
if (!process.env.MONGO_URL) {
  console.error('❌ MONGO_URL not defined. Set it in Render dashboard.');
  process.exit(1);
}
if (!process.env.CLOUDINARY_URL) {
  console.error('❌ CLOUDINARY_URL not defined. Set it in Render dashboard.');
  process.exit(1);
}

// 🔧 Cloudinary Config
cloudinary.config(); // uses CLOUDINARY_URL automatically

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'yamuna-reports',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  },
});
const upload = multer({ storage });

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
app.post('/api/report', upload.single('photo'), async (req, res) => {
  try {
    const location = req.body.location || (
      req.body.latitude && req.body.longitude
        ? `Lat: ${req.body.latitude}, Lon: ${req.body.longitude}`
        : 'Unknown'
    );

    const imageUrl = req.file?.secure_url;
    if (!imageUrl) {
    return res.status(400).json({ success: false, error: "Image upload failed" });
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
console.log('Uploaded file:', req.file);
