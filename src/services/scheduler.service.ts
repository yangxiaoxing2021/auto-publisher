import { PublishTask } from '../types/index';

const tasks: PublishTask[] = [];

export function scheduleTask(task: PublishTask): void {
  tasks.push(task);
  console.log(`Task scheduled: ${task.title} at ${task.scheduledAt}`);
}

export function listTasks(): PublishTask[] {
  return tasks;
}
