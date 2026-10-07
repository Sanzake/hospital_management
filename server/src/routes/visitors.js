import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { sendVisitSummaryEmail } from '../lib/mailer.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authRequired, requireRole('admin', 'staff'));

const SELECT =
  'id, patient_id, visitor_name, check_in_at, check_out_at, summary, status, created_at, patients(id, full_name, email)';

const createSchema = z.object({
  patient_id: z.string().uuid(),
  visitor_name: z.string().min(1, 'Visitor name is required'),
});

const updateSchema = z.object({
  patient_id: z.string().uuid().optional(),
  visitor_name: z.string().min(1).optional(),
});

const closeSchema = z.object({
  summary: z.string().min(1, 'Summary is required'),
});

router.get('/', async (req, res) => {
  const { q, status, page, limit } = req.query;
  let query = supabase.from('visitors').select(SELECT, { count: 'exact' });

  if (status && ['open', 'closed'].includes(status)) {
    query = query.eq('status', status);
  }

  if (q && typeof q === 'string' && q.trim()) {
    const term = q.trim();
    query = query.or(`visitor_name.ilike.%${term}%,summary.ilike.%${term}%`);
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

router.post('/:id/close', validate(closeSchema), async (req, res) => {
  const { data: visit, error: findError } = await supabase
    .from('visitors')
    .select(SELECT)
    .eq('id', req.params.id)
    .maybeSingle();
  if (findError) return res.status(500).json({ error: findError.message });
  if (!visit) return res.status(404).json({ error: 'Visit not found' });
  if (visit.status === 'closed') {
    return res.status(400).json({ error: 'Visit is already closed' });
  }

  const checkOut = new Date().toISOString();
  const { data: closed, error: updateError } = await supabase
    .from('visitors')
    .update({
      status: 'closed',
      summary: req.body.summary,
      check_out_at: checkOut,
    })
    .eq('id', req.params.id)
    .select(SELECT)
    .single();
  if (updateError) return res.status(500).json({ error: updateError.message });

  const patient = closed.patients;
  const toEmail = patient?.email;
  const payload = {
    to_email: toEmail || 'unknown',
    visitor_id: closed.id,
    sent_at: new Date().toISOString(),
  };

  try {
    if (!toEmail) throw new Error('Patient has no email');
    const { subject, body } = await sendVisitSummaryEmail({
      to: toEmail,
      patientName: patient.full_name,
      visitorName: closed.visitor_name,
      summary: req.body.summary,
      checkIn: closed.check_in_at,
      checkOut,
    });
    const { error: emailError } = await supabase.from('emails').insert({
      ...payload,
      subject,
      body,
      status: 'sent',
    });
    if (emailError) console.error(emailError);
  } catch (err) {
    const subject = `Visit summary for ${patient?.full_name || 'patient'}`;
    const body = req.body.summary;
    const { error: emailError } = await supabase.from('emails').insert({
      ...payload,
      subject,
      body: `${body}\n\nSend error: ${err.message}`,
      status: 'failed',
    });
    if (emailError) console.error(emailError);
  }

  return res.json(closed);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('visitors').select(SELECT).eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Visit not found' });
  return res.json(data);
});

router.post('/', validate(createSchema), async (req, res) => {
  const { data, error } = await supabase
    .from('visitors')
    .insert({
      patient_id: req.body.patient_id,
      visitor_name: req.body.visitor_name,
      status: 'open',
    })
    .select(SELECT)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

router.put('/:id', validate(updateSchema), async (req, res) => {
  const { data: existing, error: findError } = await supabase
    .from('visitors')
    .select('id, status')
    .eq('id', req.params.id)
    .maybeSingle();
  if (findError) return res.status(500).json({ error: findError.message });
  if (!existing) return res.status(404).json({ error: 'Visit not found' });
  if (existing.status === 'closed') {
    return res.status(400).json({ error: 'Closed visits cannot be edited' });
  }

  const { data, error } = await supabase
    .from('visitors')
    .update(req.body)
    .eq('id', req.params.id)
    .select(SELECT)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('visitors')
    .delete()
    .eq('id', req.params.id)
    .select('id')
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Visit not found' });
  return res.status(204).end();
});

export default router;
