"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = exports.TaskService = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// 任务操作
exports.TaskService = {
    // 创建任务
    async create(task) {
        const { data, error } = await exports.supabase
            .from('tasks')
            .insert([{ ...task, status: 'pending' }])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    // 更新任务状态
    async updateStatus(id, status, errorMessage) {
        const { data, error } = await exports.supabase
            .from('tasks')
            .update({ status, error_message: errorMessage, updated_at: new Date() })
            .eq('id', id);
        if (error)
            throw error;
        return data;
    },
    // 获取所有任务（供前端表格展示）
    async list() {
        const { data, error } = await exports.supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    },
    // 删除任务
    async delete(id) {
        const { error } = await exports.supabase.from('tasks').delete().eq('id', id);
        if (error)
            throw error;
    }
};
// 发布日志操作
exports.LogService = {
    async create(taskId, platform, status, response) {
        const { error } = await exports.supabase
            .from('publish_logs')
            .insert([{ task_id: taskId, platform, status, response }]);
        if (error)
            throw error;
    }
};
