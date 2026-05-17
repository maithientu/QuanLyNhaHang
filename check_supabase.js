import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
const envPath = path.resolve('.env.local');
const env = fs.readFileSync(envPath, 'utf8').split('\n').filter(Boolean).reduce((acc, line) => {
  const [k, ...rest] = line.split('=');
  if (!k) return acc;
  acc[k.trim()] = rest.join('=').trim();
  return acc;
}, {});
console.log('URL=', env.NEXT_PUBLIC_SUPABASE_URL);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const res = await supabase.from('areas').select('*').limit(1);
console.log('err=', res.error);
console.log('data=', res.data);
