const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

// ---------- 你的 DeepSeek API Key（必须替换）----------
const DEEPSEEK_API_KEY = 'sk-194f94c3f17b49f4906c9e4f1ae80448';

// ---------- 模拟数据库（内存存储，重启后数据会丢失，但用于演示足够了）----------
let tasks = [];
let nextId = 1;

// ---------- 根路由：返回前端页面 ----------
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head><title>自动发布系统</title></head>
<body>
  <h1>🤖 一键生成文案并创建任务</h1>
  <input id="topic" placeholder="输入主题" size="40">
  <div>
    <label><input type="checkbox" value="toutiao"> 头条号</label>
    <label><input type="checkbox" value="baijiahao"> 百家号</label>
    <label><input type="checkbox" value="xiaohongshu"> 小红书</label>
  </div>
  <button onclick="generate()">生成并创建任务</button>
  <h3>📋 任务列表</h3>
  <div id="tasks">加载中...</div>
  <script>
    async function generate() {
      const topic = document.getElementById('topic').value;
      const platforms = Array.from(document.querySelectorAll('input:checked')).map(cb => cb.value);
      if (!topic) return alert('输入主题');
      if (platforms.length === 0) return alert('至少选一个平台');
      const btn = document.querySelector('button');
      btn.disabled = true;
      btn.textContent = '处理中...';
      try {
        const res = await fetch('/api/generate-and-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, platforms })
        });
        const data = await res.json();
        if (data.success) alert('已创建 ' + data.tasks.length + ' 个任务');
        else alert('失败：' + data.error);
        loadTasks();
      } catch(e) { alert('网络错误'); }
      finally { btn.disabled = false; btn.textContent = '生成并创建任务'; }
    }
    async function loadTasks() {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.success && data.tasks) {
        const tasksDiv = document.getElementById('tasks');
        if (data.tasks.length === 0) tasksDiv.innerHTML = '暂无任务';
        else tasksDiv.innerHTML = data.tasks.map(t => 
          '<div><strong>' + t.title + '</strong> - ' + t.platform + ' - 状态：' + t.status + 
          (t.error_message ? ' (' + t.error_message + ')' : '') + '</div>'
        ).join('');
      }
    }
    loadTasks();
    setInterval(loadTasks, 5000);
  </script>
</body>
</html>
  `);
});

// ---------- AI 生成接口 ----------
app.post('/api/generate', async (req, res) => {
  const { topic, platform } = req.body;
  if (!topic) return res.status(400).json({ error: '缺少主题' });
  const prompts = {
    xiaohongshu: `为主题"${topic}"写一篇小红书种草笔记，口语化，带表情符号和热门标签，300字左右。`,
    toutiao: `为主题"${topic}"写一篇今日头条文章，标题有吸引力，正文通俗易懂，500字左右。`,
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
    res.json({ success: true, content: response.data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI 生成失败' });
  }
});

// ---------- 获取所有任务 ----------
app.get('/api/tasks', (req, res) => {
  res.json({ success: true, tasks });
});

// ---------- 创建任务 ----------
app.post('/api/tasks', (req, res) => {
  const { title, platform, content } = req.body;
  const newTask = {
    id: nextId++,
    title,
    platform,
    content,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  tasks.push(newTask);
  res.json({ success: true, id: newTask.id });
});

// ---------- 更新任务状态 ----------
app.patch('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { status, error_message } = req.body;
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.status = status;
    if (error_message) task.error_message = error_message;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: '任务不存在' });
  }
});

// ---------- 删除任务 ----------
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  tasks = tasks.filter(t => t.id !== id);
  res.json({ success: true });
});

// ---------- 一键生成并创建任务 ----------
app.post('/api/generate-and-create', async (req, res) => {
  const { topic, platforms } = req.body;
  if (!topic || !platforms || platforms.length === 0) {
    return res.status(400).json({ error: '缺少主题或平台列表' });
  }
  try {
    const createdTasks = [];
    for (const platform of platforms) {
      const genRes = await axios.post(`http://localhost:${port}/api/generate`, { topic, platform });
      const content = genRes.data.content;
      const newTask = {
        id: nextId++,
        title: topic,
        platform,
        content,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      tasks.push(newTask);
      createdTasks.push({ id: newTask.id, platform });
    }
    res.json({ success: true, tasks: createdTasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '生成或保存失败' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});