// 专栏数据：UAC 周刊 + 《像企业家一样写作》
// 后续新增/替换链接时，只需修改本文件，不需要改页面结构。

export interface ColumnIssue {
  issue: number;
  title: string;
  date: string;
  url: string;
}

export interface Column {
  id: string;
  name: string;
  description: string;
  issueCount: number;
  issues: ColumnIssue[];
}

export const columns: Column[] = [
  {
    id: 'uac-weekly',
    name: 'UAC 周刊',
    description: '每周更新的写作与创作笔记，记录真实踩过的坑。',
    issueCount: 12,
    issues: [
      { issue: 12, title: '为什么你的文章没人转发', date: '2026-09-15', url: 'https://mp.weixin.qq.com/s/uac-12' },
      { issue: 11, title: '写作的速度与复利', date: '2026-09-08', url: 'https://mp.weixin.qq.com/s/uac-11' },
      { issue: 10, title: '先有读者，再有产品', date: '2026-09-01', url: 'https://mp.weixin.qq.com/s/uac-10' },
      { issue: 9, title: '选题不是找热点，是找共鸣', date: '2026-08-25', url: 'https://mp.weixin.qq.com/s/uac-09' },
      { issue: 8, title: '如何把口语化表达变成文章', date: '2026-08-18', url: 'https://mp.weixin.qq.com/s/uac-08' },
      { issue: 7, title: '读者的注意力是如何被夺走的', date: '2026-08-11', url: 'https://mp.weixin.qq.com/s/uac-07' },
    ],
  },
  {
    id: 'write-like-entrepreneur',
    name: '《像企业家一样写作》',
    description: '用企业家思维重新理解写作与内容创作。',
    issueCount: 8,
    issues: [
      { issue: 8, title: '内容是不可替代的资产', date: '2026-09-10', url: 'https://mp.weixin.qq.com/s/ent-08' },
      { issue: 7, title: '变现的第一性原理', date: '2026-09-03', url: 'https://mp.weixin.qq.com/s/ent-07' },
      { issue: 6, title: '产品化你的经验', date: '2026-08-27', url: 'https://mp.weixin.qq.com/s/ent-06' },
      { issue: 5, title: '写作的杠杆效应', date: '2026-08-20', url: 'https://mp.weixin.qq.com/s/ent-05' },
      { issue: 4, title: '从读者到客户', date: '2026-08-13', url: 'https://mp.weixin.qq.com/s/ent-04' },
    ],
  },
];
