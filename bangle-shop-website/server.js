import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import bodyParser from 'body-parser';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const bangleSchema = new mongoose.Schema({
  category: String,
  imageUrl: String,
  price: String
});
const Bangle = mongoose.model('Bangle', bangleSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/api/bangles', async (req, res) => {
  const bangles = await Bangle.find();
  res.json(bangles);
});

app.post('/api/upload', upload.single('photo'), async (req, res) => {
  const { category, price, password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(403).send('Unauthorized');

  const stream = cloudinary.uploader.upload_stream(
    { folder: 'bangles' },
    async (error, result) => {
      if (error) return res.status(500).send('Upload failed');
      const newBangle = new Bangle({ category, price, imageUrl: result.secure_url });
      await newBangle.save();
      res.json(newBangle);
    }
  );
  stream.end(req.file.buffer);
});

app.delete('/api/delete/:id', async (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(403).send('Unauthorized');
  await Bangle.findByIdAndDelete(req.params.id);
  res.send('Deleted');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
