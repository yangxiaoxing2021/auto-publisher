import axios from 'axios';

const supabaseUrl = 'https://zaxpbnntcedvdllqumjz.supabase.co';
const supabaseKey = 'sb_publishable_5nW9ABNBtbeFYw_Cl61gqQ_nphhDCYM';

const api = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  }
});

export const TaskService = {
  async create(task: { title: string; platform: string; content?: string }) {
    const response = await api.post('/tasks', { ...task, status: 'pending' });
    return response.data;
  },

  async updateStatus(id: string, status: string, errorMessage?: string) {
    await api.patch(`/tasks?id=eq.${id}`, { status, error_message: errorMessage, updated_at: new Date() });
  },

  async list() {
    try {
      const response = await api.get('/tasks?order=created_at.desc');
      return response.data;
    } catch (err: any) {
      console.error('Axios error:', err.message);
      if (err.response) {
        console.error('Response data:', err.response.data);
        throw new Error(`Supabase error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
      }
      throw new Error(`Network error: ${err.message}`);
    }
  },

  async delete(id: string) {
    await api.delete(`/tasks?id=eq.${id}`);
  }
};