import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Schema & Model
const bangleSchema = new mongoose.Schema({
  category: String,
  imageUrl: String,
  price: String
});
const Bangle = mongoose.model('Bangle', bangleSchema);

// Set up multer to store images in /public/uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join('public', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Get all bangles
app.get('/api/bangles', async (req, res) => {
  const bangles = await Bangle.find();
  res.json(bangles);
});

// Upload a new bangle
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  const { category, price, password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(403).send('Unauthorized');

  if (!req.file) return res.status(400).send('No file uploaded');

  const imageUrl = `/uploads/${req.file.filename}`;
  const newBangle = new Bangle({ category, price, imageUrl });
  await newBangle.save();
  res.json(newBangle);
});

// Delete a bangle
app.delete('/api/delete/:id', async (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(403).send('Unauthorized');

  const bangle = await Bangle.findById(req.params.id);
  if (bangle) {
    const filePath = path.join('public', bangle.imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // delete image file
    }
    await Bangle.findByIdAndDelete(req.params.id);
    res.send('Deleted');
  } else {
    res.status(404).send('Not found');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
