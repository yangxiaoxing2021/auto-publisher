"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_service_js_1 = require("./services/supabase.service.js");
const ai_service_js_1 = require("./services/ai.service.js");
const publish_service_js_1 = require("./services/publish.service.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static('frontend'));
const publishService = new publish_service_js_1.PublishService();
// 1. 一键生成内容
app.post('/api/generate', async (req, res) => {
    const { topic, platforms } = req.body;
    if (!topic || !platforms || !platforms.length) {
        return res.status(400).json({ error: '缺少topic或platforms参数' });
    }
    try {
        const contents = await (0, ai_service_js_1.generateForPlatforms)(topic, platforms);
        res.json({ success: true, contents });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 2. 生成并发布（全自动！）
app.post('/api/generate-and-publish', async (req, res) => {
    const { topic, platforms } = req.body;
    if (!topic || !platforms || !platforms.length) {
        return res.status(400).json({ error: '缺少topic或platforms参数' });
    }
    try {
        const contents = await (0, ai_service_js_1.generateForPlatforms)(topic, platforms);
        const tasks = [];
        for (const platform of platforms) {
            const task = await supabase_service_js_1.TaskService.create({
                title: topic,
                content: contents[platform],
                platform
            });
            tasks.push(task);
        }
        const publishResults = {};
        for (const platform of platforms) {
            const result = await publishService.publishToPlatform(platform, topic, contents[platform]);
            publishResults[platform] = result;
            const task = tasks.find(t => t.platform === platform);
            if (task) {
                await supabase_service_js_1.TaskService.updateStatus(task.id, result.success ? 'completed' : 'failed', result.message);
            }
        }
        res.json({ success: true, results: publishResults });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 3. 获取所有任务
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await supabase_service_js_1.TaskService.list();
        res.json({ success: true, tasks });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 4. 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await supabase_service_js_1.TaskService.delete(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
