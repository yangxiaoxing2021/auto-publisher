const axios = require('axios');
const { chromium } = require('playwright');

const RENDER_URL = process.env.RENDER_URL || 'https://auto-publisher-minimal.onrender.com';

// 获取所有 pending 任务
async function getPendingTasks() {
  const res = await axios.get(`${RENDER_URL}/api/tasks`);
  return res.data.tasks.filter(task => task.status === 'pending');
}

// 更新任务状态
async function updateTaskStatus(id, status, errorMsg = null) {
  await axios.patch(`${RENDER_URL}/api/tasks/${id}`, { status, error_message: errorMsg });
}

// ---------- 各平台的发布函数（需要你根据实际页面完善）----------
async function publishToToutiao(task) {
  console.log(`[头条] 开始发布: ${task.title}`);
  // 示例：打开头条发布页并填写
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto('https://mp.toutiao.com');
    // TODO: 这里需要实现登录和发布逻辑
    // 你可以先用 PostBot 或手动复制 cookie 的方式简化
    await page.fill('input[name="title"]', task.title);
    await page.fill('.editor-content', task.content);
    await page.click('button:has-text("发布")');
    await page.waitForSelector('.success-tip', { timeout: 10000 });
    await browser.close();
    return true;
  } catch (err) {
    console.error(err);
    await browser.close();
    return false;
  }
}

async function publishToBaijiahao(task) {
  console.log(`[百家号] 开始发布: ${task.title}`);
  // 类似实现
  return true; // 占位
}

async function publishToXiaohongshu(task) {
  console.log(`[小红书] 开始发布: ${task.title}`);
  // 类似实现
  return true; // 占位
}

// 主函数
async function main() {
  console.log('检查待发布任务...');
  const tasks = await getPendingTasks();
  if (tasks.length === 0) {
    console.log('没有待发布任务');
    return;
  }
  for (const task of tasks) {
    console.log(`处理任务 ${task.id} (${task.platform})`);
    let success = false;
    if (task.platform === 'toutiao') success = await publishToToutiao(task);
    else if (task.platform === 'baijiahao') success = await publishToBaijiahao(task);
    else if (task.platform === 'xiaohongshu') success = await publishToXiaohongshu(task);
    else console.log(`未知平台: ${task.platform}`);
    if (success) {
      await updateTaskStatus(task.id, 'completed');
      console.log(`任务 ${task.id} 发布成功`);
    } else {
      await updateTaskStatus(task.id, 'failed', '发布失败');
      console.log(`任务 ${task.id} 发布失败`);
    }
  }
}

main();