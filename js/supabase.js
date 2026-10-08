const SUPABASE_URL = "https://istjyfycswagzfgnfbxr.supabase.co";
const SUPABASE_KEY = "sb_publishable_mDCFKKUir6Sb6nodK2tDQg_tlGUykjW";

const { createClient } = supabase;

const db = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);