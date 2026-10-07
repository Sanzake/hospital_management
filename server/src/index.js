import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import staffRoutes from './routes/staff.js';
import patientsRoutes from './routes/patients.js';
import shiftsRoutes from './routes/shifts.js';
import visitorsRoutes from './routes/visitors.js';
import emailsRoutes from './routes/emails.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/visitors', visitorsRoutes);
app.use('/api/emails', emailsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Hospital Manager API on http://localhost:${port}`);
});
