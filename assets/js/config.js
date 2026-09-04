// ==========================================
// DAROU SALAM BUSINESS
// CONFIGURATION SUPABASE
// ==========================================

const SUPABASE_URL = "https://prrhykwskzyserxbjjre.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_LK1TnzClB9smIlNK1LQWow_Ytc6zlLM";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);