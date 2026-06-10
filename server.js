const express = require('express');
const axios = require('axios');
const db = require('./db');
const path = require('path');
const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

// 静态文件服务（让前端页面可以被访问）
app.use(express.static('public'));

// 根路径返回前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 你的 DeepSeek API Key（替换成你自己的）
const DEEPSEEK_API_KEY = 'sk-194f94c3f17b49f4906c9e4f1ae80448';

app.post('/api/generate', async (req, res) => {
  const { topic, platform } = req.body;
  if (!topic) return res.status(400).json({ error: '缺少主题' });
  const prompts = {
    xiaohongshu: `为主题"${topic}"写一篇小红书种草笔记，口语化，带表情符号和热门标签，300字左右。`,
    toutiao: `为主题"${topic}"写一篇今日头条文章，标题要有吸引力，正文通俗易懂，500字左右。`,
    baijiahao: `为主题"${topic}"写一篇百家号文章，要求有深度，1000字左右。`,
    default: `为主题"${topic}"写一篇通用文章，300字左右。`
  };
  const prompt = prompts[platform] || prompts.default;
  try {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const content = response.data.choices[0].message.content;
    res.json({ success: true, content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '生成失败' });
  }
});

app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, tasks: rows });
  });
});

app.post('/api/tasks', (req, res) => {
  const { title, platform, content } = req.body;
  db.run('INSERT INTO tasks (title, platform, content, status) VALUES (?, ?, ?, ?)',
    [title, platform, content, 'pending'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    });
});

app.patch('/api/tasks/:id', (req, res) => {
  const { status, error_message } = req.body;
  db.run('UPDATE tasks SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, error_message, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/generate-and-create', async (req, res) => {
  const { topic, platforms } = req.body;
  if (!topic || !platforms?.length) return res.status(400).json({ error: '缺少主题或平台列表' });
  try {
    const tasks = [];
    for (const platform of platforms) {
      const genRes = await axios.post(`http://localhost:${port}/api/generate`, { topic, platform });
      const content = genRes.data.content;
      const insert = db.prepare('INSERT INTO tasks (title, platform, content, status) VALUES (?, ?, ?, ?)');
      const info = insert.run(topic, platform, content, 'pending');
      tasks.push({ id: info.lastID, platform });
    }
    res.json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '生成或保存失败' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});