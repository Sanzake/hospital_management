import 'dotenv/config';
import bcrypt from 'bcrypt';
import { supabase } from './lib/supabase.js';

const email = (process.env.ADMIN_EMAIL || 'admin@hospital.local').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'admin123';
const fullName = process.env.ADMIN_NAME || 'Hospital Admin';

const password_hash = await bcrypt.hash(password, 10);

const { data: existing, error: findError } = await supabase
  .from('users')
  .select('id')
  .eq('email', email)
  .maybeSingle();

if (findError) {
  console.error(findError);
  process.exit(1);
}

if (existing) {
  const { error } = await supabase
    .from('users')
    .update({ full_name: fullName, password_hash, role: 'admin' })
    .eq('id', existing.id);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Updated admin ${email}`);
} else {
  const { error } = await supabase.from('users').insert({
    full_name: fullName,
    email,
    password_hash,
    role: 'admin',
  });
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Created admin ${email}`);
}
