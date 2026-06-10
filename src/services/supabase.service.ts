// 模拟任务数据（不连接 Supabase）
let mockTasks: any[] = [
  { id: '1', title: '示例任务', platform: '百家号', status: 'completed', created_at: new Date().toISOString() }
];

export const TaskService = {
  async create(task: { title: string; platform: string; content?: string }) {
    const newTask = {
      id: String(Date.now()),
      ...task,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    mockTasks.unshift(newTask);
    return newTask;
  },

  async updateStatus(id: string, status: string, errorMessage?: string) {
    const task = mockTasks.find(t => t.id === id);
    if (task) task.status = status;
  },

  async list() {
    return mockTasks;
  },

  async delete(id: string) {
    mockTasks = mockTasks.filter(t => t.id !== id);
  }
};