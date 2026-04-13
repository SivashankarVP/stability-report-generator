import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import medicineRoutes from './routes/medicines';
import batchRoutes from './routes/batches';
import testRoutes from './routes/tests';
import aiRoutes from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('Stability Report Generator API is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
