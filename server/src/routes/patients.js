import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authRequired, requireRole('admin', 'staff'));

const createSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  phone: z.string().min(5, 'Phone is required'),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial();

router.get('/', async (req, res) => {
  const { q, priority, page, limit } = req.query;
  let query = supabase.from('patients').select('*', (page || limit) ? { count: 'exact' } : undefined);

  if (priority && ['low', 'medium', 'high'].includes(priority)) {
    query = query.eq('priority', priority);
  }

  if (q && typeof q === 'string' && q.trim()) {
    const term = q.replace(/[,()]/g, ' ').trim();
    if (term) {
      query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    }
  }

  query = query.order('created_at', { ascending: false });

  if (page || limit) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ items: data || [], total: count ?? (data?.length || 0), page: pageNum, limit: limitNum });
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('patients').select('*').eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Patient not found' });
  return res.json(data);
});

router.post('/', validate(createSchema), async (req, res) => {
  const payload = {
    ...req.body,
    email: req.body.email.toLowerCase(),
  };
  const { data, error } = await supabase.from('patients').insert(payload).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

router.put('/:id', validate(updateSchema), async (req, res) => {
  const patch = { ...req.body };
  if (patch.email) patch.email = patch.email.toLowerCase();
  const { data, error } = await supabase
    .from('patients')
    .update(patch)
    .eq('id', req.params.id)
    .select('*')
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Patient not found' });
  return res.json(data);
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('patients')
    .delete()
    .eq('id', req.params.id)
    .select('id')
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Patient not found' });
  return res.status(204).end();
});

export default router;
