import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { authRequired, publicUser, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authRequired, requireRole('admin'));

const STAFF_FIELDS = 'id, full_name, email, role, created_at';

const createSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'staff']),
});

const updateSchema = z.object({
  full_name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'staff']).optional(),
});

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select(STAFF_FIELDS)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select(STAFF_FIELDS)
    .eq('id', req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Staff member not found' });
  return res.json(data);
});

router.post('/', validate(createSchema), async (req, res) => {
  const password_hash = await bcrypt.hash(req.body.password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert({
      full_name: req.body.full_name,
      email: req.body.email.toLowerCase(),
      password_hash,
      role: req.body.role,
    })
    .select(STAFF_FIELDS)
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json(publicUser(data));
});

router.put('/:id', validate(updateSchema), async (req, res) => {
  const patch = { ...req.body };
  if (patch.email) patch.email = patch.email.toLowerCase();
  if (patch.password) {
    patch.password_hash = await bcrypt.hash(patch.password, 10);
    delete patch.password;
  }

  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', req.params.id)
    .select(STAFF_FIELDS)
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    return res.status(500).json({ error: error.message });
  }
  if (!data) return res.status(404).json({ error: 'Staff member not found' });
  return res.json(data);
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', req.params.id)
    .select('id')
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Staff member not found' });
  return res.status(204).end();
});

export default router;
