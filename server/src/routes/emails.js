import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired, requireRole('admin'));

const SELECT =
  'id, to_email, subject, body, visitor_id, sent_at, status, visitors(id, visitor_name, patients(full_name))';

router.get('/', async (req, res) => {
  const { status, q } = req.query;
  let query = supabase.from('emails').select(SELECT);

  if (status && ['sent', 'failed'].includes(status)) {
    query = query.eq('status', status);
  }

  if (q && typeof q === 'string' && q.trim()) {
    const term = q.replace(/[,()]/g, ' ').trim();
    if (term) {
      query = query.or(`to_email.ilike.%${term}%,subject.ilike.%${term}%`);
    }
  }

  query = query.order('sent_at', { ascending: false });
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('emails').select(SELECT).eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Email not found' });
  return res.json(data);
});

export default router;
