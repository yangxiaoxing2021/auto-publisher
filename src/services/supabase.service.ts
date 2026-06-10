import { createClient } from '@supabase/supabase-js';

// 直接写死密钥（不依赖环境变量）
const supabaseUrl = 'https://zaxpbnntcedvdllqumjz.supabase.co';
const supabaseKey = 'sb_publishable_5nW9ABNBtbeFYw_Cl61gqQ_nphhDCYM';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const TaskService = {
  async create(task: { title: string; platform: string; content?: string }) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, status: 'pending' }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string, errorMessage?: string) {
    const { error } = await supabase
      .from('tasks')
      .update({ status, error_message: errorMessage, updated_at: new Date() })
      .eq('id', id);
    if (error) throw error;
  },

  async list() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  }
};