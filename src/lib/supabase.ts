import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** False when build omitted secrets — app still mounts so we can show a message instead of a white screen */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Valid client when configured; placeholder URL avoids crashing createClient when env is missing */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDIwNjQ5NDAsImV4cCI6MTk1NzM5MDk0MH0.placeholder'
);
