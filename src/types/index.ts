export interface PublishTask {
  id: string;
  title: string;
  content: string;
  platforms: Platform[];
  scheduledAt?: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'done' | 'failed';
  createdAt: string;
}

export type Platform = 'xiaohongshu' | 'zhihu' | 'toutiao' | 'wechat';

export interface PublishResult {
  platform: Platform;
  success: boolean;
  url?: string;
  error?: string;
}
