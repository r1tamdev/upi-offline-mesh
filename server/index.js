import 'dotenv/config';
import express from "express";
import cors from 'cors';
import mongoose from "mongoose";


import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
import accountRoutes from './routes/account.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth',authRoutes);
app.use('/payment',paymentRoutes);
app.use('/account',accountRoutes);

app.get('/', (req, res) => 
  res.json({status:'ok',time: new Date()}));


const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI || MONGO_URI.includes('<username>')) {
  console.error('ERROR: Set MONGO_URI in server/.env');
  process.exit(1);
}

mongoose
.connect(MONGO_URI)
.then(() => {
  console.log('Database connected');
    app.listen(PORT,'0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
});

