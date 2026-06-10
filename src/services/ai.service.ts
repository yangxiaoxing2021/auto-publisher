import axios from 'axios';

// 各平台的风格提示词
const platformPrompts: Record<string, string> = {
  xiaohongshu: `为主题"{topic}"写一篇小红书种草笔记，要求：
- 标题简洁有吸引力，带2-3个Emoji
- 正文口语化、亲切，多用感叹号和表情符号
- 结尾带3-5个热门话题标签
- 全文字数300-500字`,

  zhihu: `为主题"{topic}"写一篇知乎回答，要求：
- 开头用"谢邀"或直接抛出观点吸引眼球
- 正文逻辑严谨，分点论述，可引用数据或案例
- 结尾设置悬念或引发讨论
- 全文字数800-1200字`,

  toutiao: `为主题"{topic}"写一篇今日头条文章，要求：
- 标题吸睛，带数字或疑问句式
- 正文通俗易懂，适合快速阅读
- 每段不超过150字，适当加粗关键词
- 全文字数600-1000字`,

  wechat: `为主题"{topic}"写一篇微信公众号文章，要求：
- 标题6-12字，简洁有力
- 正文结构清晰：引言+分段论述+结语
- 适当使用加粗、引用等排版元素
- 全文字数1500-2500字`
};

// 调用LLM生成内容
async function callLLM(prompt: string): Promise<string> {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.choices[0].message.content;
}

// 为指定平台生成内容
export async function generateContent(topic: string, platform: string): Promise<string> {
  const promptTemplate = platformPrompts[platform] || platformPrompts.wechat;
  const prompt = promptTemplate.replace('{topic}', topic);
  return await callLLM(prompt);
}

// 批量生成多平台内容
export async function generateForPlatforms(topic: string, platforms: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  for (const platform of platforms) {
    results[platform] = await generateContent(topic, platform);
  }
  return results;
}
