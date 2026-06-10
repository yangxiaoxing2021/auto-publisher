import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TaskService } from './services/supabase.service';
import { generateForPlatforms } from './services/ai.service';
import { PublishService } from './services/publish.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));  // 前端页面静态托管

const publishService = new PublishService();

// 1. 一键生成内容
app.post('/api/generate', async (req, res) => {
  const { topic, platforms } = req.body;
  if (!topic || !platforms || !platforms.length) {
    return res.status(400).json({ error: '缺少topic或platforms参数' });
  }
  try {
    const contents = await generateForPlatforms(topic, platforms);
    res.json({ success: true, contents });
  } catch (error: any) {
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
    // 步骤1：AI生成内容（适配各平台）
    const contents = await generateForPlatforms(topic, platforms);

    // 步骤2：为每个平台创建数据库任务
    const tasks = [];
    for (const platform of platforms) {
      const task = await TaskService.create({
        title: topic,
        content: contents[platform],
        platform
      });
      tasks.push(task);
    }
    // 步骤3：异步执行发布（不阻塞响应）
    const publishResults: Record<string, any> = {};
    for (const platform of platforms) {
      const result = await publishService.publishToPlatform(platform, topic, contents[platform]);
      publishResults[platform] = result;
      const task = tasks.find(t => t.platform === platform);
      if (task) {
        await TaskService.updateStatus(task.id, result.success ? 'completed' : 'failed', result.message);
      }
    }
    res.json({ success: true, results: publishResults });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. 获取所有任务（供前端表格展示）
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await TaskService.list();
    res.json({ success: true, tasks });
  } catch (error: any) {
    console.error('Detailed error:', error);
    // 返回更详细的错误信息
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      cause: error.cause?.message || null
    });
  }
});

// 4. 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await TaskService.delete(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
