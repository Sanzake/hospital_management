import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import staffRoutes from './routes/staff.js';
import patientsRoutes from './routes/patients.js';
import shiftsRoutes from './routes/shifts.js';
import visitorsRoutes from './routes/visitors.js';
import emailsRoutes from './routes/emails.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../client/dist');

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const clientOrigin = process.env.CLIENT_ORIGIN;
app.use(
  cors({
    origin: clientOrigin
      ? clientOrigin.includes(',')
        ? clientOrigin.split(',').map((s) => s.trim())
        : clientOrigin
      : true,
    credentials: true,
  }),
);

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

// In production, serve built frontend if available
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Hospital Manager API on http://localhost:${port}`);
});
