// 资源中心共享数据：书单推荐 / 网站推荐 / 我的开源（教程+作品）/ 现有下载素材
// 三个方案页（资源枢纽 / 资源+作品 / 百宝箱）共用此模块，避免重复维护。

export interface BookRec {
  title: string;
  reason: string;
  url?: string;
}
export interface SiteRec {
  name: string;
  why: string;
  url?: string;
}
export interface OpenSourceItem {
  name: string;
  desc: string;
  stars?: string;
  url?: string;
  kind: 'tutorial' | 'project';
}
export interface PdfItem {
  name: string;
  author: string;
  icon: string;
  file: string;
}
export interface Wallpaper {
  file: string;
  name: string;
}

// ① 推荐书单（我推荐的，别人写的）—— 内容整理中，页面先显示占位
export const bookRecs: BookRec[] = [];

// ② 推荐网站 / 工具（我推荐的）—— 内容整理中
export const siteRecs: SiteRec[] = [];

// ③ + ④ 合并：我的开源（教程 + 作品，统一在一个页面展示）
// kind: 'tutorial' = 站内阅读页；'project' = 跳 GitHub 仓库
export const openSources: OpenSourceItem[] = [
  {
    name: '搜索课',
    desc: '10+3 个搜索方法：从选项卡、双引号到 filetype 与站内搜索。读完之后你大概率会感慨——之前的自己不太会搜索。',
    kind: 'tutorial',
    url: '/resources/opensource/search-course/',
  },
  {
    name: 'md-to-book-pdf',
    desc: '把 Markdown 书稿一键排版成出版级 PDF：自动封面、章节扉页、可点击目录、侧边栏书签。你只管写，排版交给它。',
    kind: 'project',
    url: 'https://github.com/gusangciren/md-to-book-pdf',
  },
];

// ⑤ 素材下载（现有 resources.astro 的内容，原样保留）
export const pdfs: PdfItem[] = [
  { name: '100M Offers', author: 'Alex Hormozi', icon: '📈', file: '/resources/100M_Offers_-_Alex_Hormozi.pdf' },
  { name: 'Breakthrough Advertising', author: 'Eugene Swartz', icon: '📣', file: '/resources/Breakthrough_advertising_-_Eugene_Swartz.pdf' },
  { name: 'Case Study · StoryLearning', author: 'Olly Richards', icon: '🗣️', file: '/resources/Case%20Study%20-%20StoryLearning%20_%20OllyRichards.pdf' },
  { name: 'Leads', author: 'Alex Hormozi', icon: '🎯', file: '/resources/Leads_-_Alex_hormozi.pdf' },
  { name: 'Snow Leopard', author: 'Nicolas Cole', icon: '🐆', file: '/resources/snow_leopard_-_nicolas_cole.pdf' },
];

export const wallpapers: Wallpaper[] = [
  { file: '/resources/2778c2174c280000bca95903b70a2476.jpg', name: '壁纸 01' },
  { file: '/resources/2dd7720b5a5187e16d6c4dbcc12e410c.png', name: '壁纸 02' },
  { file: '/resources/841a441a04e1b958f5287a6a84bbeb33.png', name: '壁纸 03' },
  { file: '/resources/d9c7269ee0c6f4e4bce4e820db9d5584.jpg', name: '壁纸 04' },
];
