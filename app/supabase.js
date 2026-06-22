import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uloizhzpmzudigaitxid.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsb2l6aHpwbXp1ZGlnYWl0eGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTA0MjcsImV4cCI6MjA5NTUyNjQyN30.QTlHvi5tRWAfbkt21RpiT4BjWBoPdlTyxB9mG1AWLHs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
