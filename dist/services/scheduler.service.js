"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleTask = scheduleTask;
exports.listTasks = listTasks;
const tasks = [];
function scheduleTask(task) {
    tasks.push(task);
    console.log(`Task scheduled: ${task.title} at ${task.scheduledAt}`);
}
function listTasks() {
    return tasks;
}
