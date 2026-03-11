import { createClient } from '@supabase/supabase-js';

// ============================================================
// 🔧 REPLACE THESE WITH YOUR SUPABASE PROJECT VALUES
// Found in: Supabase Dashboard → Project Settings → API
// ============================================================
const SUPABASE_URL = 'https://yawyrcdanbrvwhupgjsa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pGbmNmQwespjMh-L37-0rA_ZMJka6mS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);