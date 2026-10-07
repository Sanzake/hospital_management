import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authRequired, requireRole('admin', 'staff'));

const SELECT = 'id, staff_id, shift_date, start_time, end_time, notes, created_at, users(id, full_name, email, role)';

const schema = z
  .object({
    staff_id: z.string().uuid(),
    shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date is required (YYYY-MM-DD)'),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Start time is required (HH:MM)'),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'End time is required (HH:MM)'),
    notes: z.string().optional().nullable(),
  })
  .refine((d) => d.end_time !== d.start_time, {
    message: 'End time cannot be the same as start time',
    path: ['end_time'],
  });

const updateSchema = z
  .object({
    staff_id: z.string().uuid().optional(),
    shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date is required (YYYY-MM-DD)').optional(),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Start time is required (HH:MM)').optional(),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'End time is required (HH:MM)').optional(),
    notes: z.string().optional().nullable(),
  })
  .refine((d) => !d.start_time || !d.end_time || d.end_time !== d.start_time, {
    message: 'End time cannot be the same as start time',
    path: ['end_time'],
  });

router.get('/', async (req, res) => {
  const { staff_id, date } = req.query;
  let query = supabase.from('shifts').select(SELECT);

  if (staff_id) {
    query = query.eq('staff_id', staff_id);
  }
  if (date) {
    query = query.eq('shift_date', date);
  }

  query = query.order('shift_date', { ascending: false }).order('start_time', { ascending: true });
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('shifts').select(SELECT).eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Shift not found' });
  return res.json(data);
});

router.post('/', requireRole('admin'), validate(schema), async (req, res) => {
  const { data, error } = await supabase.from('shifts').insert(req.body).select(SELECT).single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

router.put('/:id', requireRole('admin'), validate(updateSchema), async (req, res) => {
  const { data, error } = await supabase
    .from('shifts')
    .update(req.body)
    .eq('id', req.params.id)
    .select(SELECT)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Shift not found' });
  return res.json(data);
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', req.params.id)
    .select('id')
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Shift not found' });
  return res.status(204).end();
});

export default router;
