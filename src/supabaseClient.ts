import { createClient } from '@supabase/supabase-js';

// Твои реальные данные из Supabase
const supabaseUrl = 'https://mmuglipvlbzjkoetjvhu.supabase.co'; // API URL
const supabaseKey = 'sb_publishable_CuW_dkr4bOmsLxuQz4u_Hg_8TvbbSAI'; // Скопируй ВЕСЬ текст из поля 'default' в разделе Publishable key

export const supabase = createClient(supabaseUrl, supabaseKey);