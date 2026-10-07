import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { supabase } from '../lib/supabase.js';
import { authRequired, publicUser, signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, password_hash')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const safe = publicUser(user);
  return res.json({ token: signToken(safe), user: safe });
});

router.get('/me', authRequired, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ user });
});

router.get('/stats', authRequired, async (req, res) => {
  const [{ count: patients }, { count: openVisits }, { count: shifts }] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('visitors').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('shifts').select('id', { count: 'exact', head: true }),
  ]);

  const stats = {
    patients: patients ?? 0,
    openVisits: openVisits ?? 0,
    shifts: shifts ?? 0,
  };

  if (req.user.role === 'admin') {
    const [{ count: staff }, { count: emails }] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('emails').select('id', { count: 'exact', head: true }),
    ]);
    stats.staff = staff ?? 0;
    stats.emails = emails ?? 0;
  }

  return res.json(stats);
});

export default router;
