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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
for (const table of ['areas','tables','menu_categories','menu_items','orders','payments']) {
  const res = await supabase.from(table).select('*', { count: 'exact', head: true });
  console.log(table, 'count=', res.count, 'error=', res.error?.message || null);
}
