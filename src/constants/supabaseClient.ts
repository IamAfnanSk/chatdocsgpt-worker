import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_HOST, SUPABASE_KEY } from './global.js';

const supabase = createClient(SUPABASE_HOST, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export { supabase };
