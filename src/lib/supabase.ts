import { createClient } from "@supabase/supabase-js";

// SERVER-SIDE CLIENT ONLY
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  {
    auth: { persistSession: false }
  }
);
