import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

// 任务操作
export const TaskService = {
  // 创建任务
  async create(task: { title: string; platform: string; content?: string }) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, status: 'pending' }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 更新任务状态
  async updateStatus(id: string, status: string, errorMessage?: string) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status, error_message: errorMessage, updated_at: new Date() })
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // 获取所有任务（供前端表格展示）
  async list() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // 删除任务
  async delete(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  }
};

// 发布日志操作
export const LogService = {
  async create(taskId: string, platform: string, status: string, response?: any) {
    const { error } = await supabase
      .from('publish_logs')
      .insert([{ task_id: taskId, platform, status, response }]);
    if (error) throw error;
  }
};
