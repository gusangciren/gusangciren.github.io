// 资源中心共享数据：书单推荐 / 网站推荐 / 我的开源（教程+作品）/ 现有下载素材
// 三个方案页（资源枢纽 / 资源+作品 / 百宝箱）共用此模块，避免重复维护。

export interface BookRec {
  title: string;
  reason: string;
  url?: string;
  // 以下为「站内书单」字段（2026-10-18 变体 B：豆瓣链接 + 评分 + 独立推荐理由块）
  author?: string;
  cover?: string;
  /** 豆瓣简介（书方信息），与下方 reason（我的推荐语）分层显示 */
  doubanIntro?: string;
  /** 我为什么推荐——支持多段，用 \n\n 分隔，每段单独 <p> */
  reasonBlocks?: string;
  /** 豆瓣评分，字符串以保留一位小数（'8.3'）；豆瓣无公开 API，需手工维护 */
  doubanScore?: string;
  /** 微信读书推荐值（'87.1'，渲染时加 %），来自公众号书单长图 */
  wrScore?: string;
  /** 微信读书等级标签：神作 / 好评如潮 / 脍炙人口 / 值得一读 */
  wrBadge?: string;
  publisher?: string;
  /** 阅读提示语，如「2026-10 读过」，可留空 */
  readAt?: string;
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

// ① 推荐书单（站内可读清单 · 2026-10-18 定稿：变体 B + 680px 居中）
// 封面放 public/images/booklist/（豆瓣图有防盗链，必须下载到本地，不能外链）
// 数据来源：公众号「种一个梦」读者必读书单（微信读书「Gus'的书单」长截图，2026-10-18 逐字录入）
// 推荐理由为原文照录，不做改写；微信读书推荐值需手工维护
export const bookRecs: BookRec[] = [
  {
    title: '终身成长（全新修订版）',
    author: '卡罗尔·德韦克 / 楚祎楠 译',
    cover: '/images/booklist/growth.jpg',
    doubanIntro:
      '坐镇美国亚马逊心理类畅销榜10年，累计印量180万册，比尔·盖茨撰文推荐。颠覆传统成功学观点，影响美国校园教育的创新理念。',
    reasonBlocks:
      '关于这本书的推荐信，我在「种一个梦」的已经写的很好了。同时，那一篇文章也是公众号读者必读的文章。\n\n' +
      '链接放这里🔗：https://mp.weixin.qq.com/s/Q1mhJ18ImQZnVoBephvHJg\n\n' +
      '这本书必须重视。',
    wrScore: '78.4',
    wrBadge: '值得一读',
    reason: '',
  },
  {
    title: '纳瓦尔宝典',
    author: '埃里克·乔根森 / 赵灿 译',
    cover: '/images/booklist/naval.jpg',
    doubanIntro:
      '致富不仅仅靠运气，幸福也不是从天而降。这本书收集整理了纳瓦尔过去十年在推特、博客和播客里分享的智慧箴言。',
    reasonBlocks:
      '人生需要杠杆。有史以来，人类出现了三种杠杆，（1）人力杠杆（2）资本杠杆（3）边际成本为零的杠杆。\n\n' +
      '这本书，是被我认定为践行到骨子里的一本书。我希望你不只是阅读这本书，而是活出来。',
    wrScore: '87.1',
    wrBadge: '好评如潮',
    reason: '',
  },
  {
    title: '穷查理宝典：查理·芒格智慧箴言录（全新增订本）',
    author: '彼得·考夫曼 / 李继宏 等 译',
    cover: '/images/booklist/poorcharlie.jpg',
    doubanIntro:
      '查理·芒格的智慧箴言录，收录芒格十一讲演讲、芒格小传与生活学习决策方法，并收有巴菲特论芒格的序言及李录撰写的中文版序言。',
    reasonBlocks:
      '这不只是关于投资的书籍。这是一个99岁的老爷子留给世人的宝藏。常读常新，每次的阅读，你都能感受有财富的涌动。\n\n' +
      '每次阅读，你都会更加智慧，更加幸福，更加会生活。查理·芒格的思考方式、跨学科学习理念、阅读重要性等，会深刻影响你。\n\n' +
      '其次，你也会感受到简单道理的力量。',
    wrScore: '84.6',
    wrBadge: '脍炙人口',
    reason: '',
  },
  {
    title: '文明、现代化、价值投资与中国',
    author: '李录',
    cover: '/images/booklist/civilization.jpg',
    doubanIntro:
      '李录将自己的阅读、实践与思考汇编成书：上篇探讨人类文明的演进与现代化的理论体系，下篇收录他对价值投资与中国未来的思考。',
    reasonBlocks:
      '李录在书中把人类文明分为了三个阶段。1.0：狩猎-采集文明。2.0：农业文明。3.0：科技文明。\n\n' +
      '以大跨度的历史视角来分析未来。读完本书，你会更了解进步的本质。以及中国未来可能出现的机会和问题。\n\n' +
      '阅读本书，让我对分析未来有了一个大致的框架。因为，所有的过去史都是未来史。',
    wrScore: '83.8',
    wrBadge: '脍炙人口',
    reason: '',
  },
  {
    title: '经济学的思维方式：第13版',
    author: '保罗·海恩 彼得·勃特克 大卫·普雷契特科',
    cover: '/images/booklist/economic-way.jpg',
    doubanIntro:
      '长居美国亚马逊经济类榜首、美国国民经济学读本。暌违多年再版，用日常案例讲清经济学的思维方式。',
    reasonBlocks:
      '对于经济学的重要性。我引用纳瓦尔的一句话——“从头到尾认真研读一本微观经济学教科书，你会受益匪浅。”。还说，如果不能深刻理解供求关系、劳资关系、博弈论等问题，你就不可能在商业上取得成功，甚至也无法很好地适应现代社会。\n\n' +
      '经济学在我的世界观构建方面，起来很重要的作用。让我变得理性和客观，学习经济学真的可以变得长寿。\n\n' +
      '如果你想学习经济学，就读这本书。小白也可以。',
    wrScore: '82.7',
    reason: '',
  },
  {
    title: '洞见：从科学到哲学，打开人类的认知真相',
    author: '罗伯特·赖特 / 宋伟 译',
    cover: '/images/booklist/insight.jpg',
    doubanIntro:
      '《为什么佛学是真的》简体中文版。用进化心理学与现代科学解释佛学中「无我」「正念冥想」等观念，打开人类的认知真相。',
    reasonBlocks:
      '学习正念冥想——知道有念、知道无念、知道就好。其次，你还可以学习进化心理学，对周遭的事物有一定的进化心理学上的解释。\n\n' +
      '无我，即我认为的开放。无我是想要快速成长人的必要条件。真正思考明白“无我”，以及操作系统中的各种妨碍进步的bug，你才能欣然接受，并可以避免“认知失调”带来的痛苦。',
    wrScore: '77.3',
    wrBadge: '值得一读',
    reason: '',
  },
  {
    title: '思考致富',
    author: '拿破仑·希尔 / 洪友 译',
    cover: '/images/booklist/think-grow-rich.jpg',
    doubanIntro:
      '拿破仑·希尔最重要的作品，创作受到卡内基的启发，被誉为「彻底改变了美国人的思想观念，激发了所有美国人的潜能」。',
    reasonBlocks:
      '一看书名很鸡汤，味道很浓，对吧？如果你这样想，原谅你，之前的我也是如此。但，借此也说明：你严重缺乏心理学、认知心理学、脑科学的基本知识。\n\n' +
      '和《洞见》这两本，进行主题阅读，你会更加明白如何运用强大的潜意识。学会积极暗示来改变和激发自己潜意识的力量。\n\n' +
      '正确运用潜意识的力量，自我预言总会实现。卡尔·荣格说：你的潜意识正在操纵你的人生，而你却称其为命运。\n\n' +
      '积极暗示自己吧。为什么？你的预言会自我实现。',
    wrScore: '75.9',
    wrBadge: '值得一读',
    reason: '',
  },
  {
    title: '自私的基因（40周年增订版）',
    author: '理查德·道金斯 / 卢允中,张岱云等 译',
    cover: '/images/booklist/selfish-gene.jpg',
    doubanIntro:
      '20世纪最经典的著作之一。复制、变异和淘汰三种简单机制，演变出大千世界的生命现象；任何生物，包括我们自己，都只是求生的机器。',
    reasonBlocks:
      '我们的体验的基因，给我们一个核心的指令——使自己的基因复制最大化。进而，我们为了达成此指令，我们会最大程度地生存和繁衍。\n\n' +
      '第二，由于我们大脑很长一段时间都是在狩猎-采集文明的环境下进化而来。然后自工业革命后，我们环境完全不同于狩猎-采集文明的环境，进而出现很多应激错误。\n\n' +
      '阅读此书，你会更加明白“商业是最大的慈善这句话”。（经济学底层的原理就是自利）。你可能更加明白为什么男人都不专心、女性都偏向拜金等，你会更明白男人和女人的差别，最终你会明白“人”，包括你自己。',
    wrScore: '75.5',
    wrBadge: '值得一读',
    reason: '',
  },
  {
    title: '影响力（全新升级版）',
    author: '罗伯特·西奥迪尼 / 闾佳 译',
    cover: '/images/booklist/influence.jpg',
    doubanIntro:
      '风靡全球的说服力经典。拆解互惠、社会认同、权威、稀缺等影响力武器的心理机制，解释为什么有些人轻而易举就能说服别人。',
    reasonBlocks:
      '判断力很重要，但人性中存在很多妨碍判断力的机制——比如，社会认同、权威。\n\n' +
      '因为受社会认同的影响而开始从众，那么，你永远是多数人的那一边，根据供需原则，你的价格永远不会高。\n\n' +
      '对于运营、营销、销售、文案、咨询等多方面，很多方面都是用到书中的原则。买一本，每年重新读一遍。这是一本经典书籍。',
    wrScore: '90.1',
    wrBadge: '神作',
    reason: '',
  },
  {
    title: '先发影响力',
    author: '罗伯特·西奥迪尼 / 闾佳 译',
    cover: '/images/booklist/pre-suasion.jpg',
    doubanIntro:
      '《影响力》前置篇：说服的最佳时刻，是在开口之前。西奥迪尼揭示如何先创建有利时机、再传递信息，让人在注意力被抓住的瞬间被说服。',
    reasonBlocks:
      '同一样作者，很实用。\n\n' +
      '影响力是最坚挺的货币。也很多想要打造自己的IP，拥有个人影响力，这本书都不读了，那我只能祝你早死早超生。',
    wrScore: '79.6',
    wrBadge: '值得一读',
    reason: '',
  },
  {
    title: '人类简史：从动物到上帝',
    author: '尤瓦尔·赫拉利 / 林俊宏 译',
    cover: '/images/booklist/sapiens.jpg',
    doubanIntro:
      '十万年前，地球上至少有六种不同的人；但今日，世界舞台为什么只剩下了我们自己？一部讲述人类从动物到上帝的宏大简史。',
    reasonBlocks:
      '人类的简史，在此书中记录了过去对于人类人类影响最大的几个因素。故事、金钱、帝国、宗教、科学……\n\n' +
      '简史就是记录权重最高因素的集合。人类简史就是对人类影响最大的因素的集合。你必须重视。\n\n' +
      '历史总是以不同的面貌反复出现着。',
    wrScore: '87.8',
    wrBadge: '好评如潮',
    reason: '',
  },
  {
    title: '枪炮、病菌与钢铁',
    author: '贾雷德·戴蒙德 / 王道还,廖月娟 译',
    cover: '/images/booklist/guns-germs-steel.jpg',
    doubanIntro:
      '为什么是欧亚大陆人征服了其他大陆，而不是相反？演化生物学家戴蒙德揭示塑造历史最广泛模式的环境因素，是一部真正关于全世界各民族的历史。',
    reasonBlocks:
      '也是一本历史书。\n\n' +
      '预测未来，活在未来，是致富最快的方法。如果你知道未来世界的样子，你现在就可以按着未来的样子生活。\n\n' +
      '这本书籍中创新，尤其交易带来的创新带我影响很大。所有跌汤起伏都是影响是交易，交易包括商品交易和随之带来的思想的交易。所谓的创新就是旧有元素新组合。',
    wrScore: '86.3',
    wrBadge: '好评如潮',
    reason: '',
  },
  {
    title: '思考，快与慢',
    author: '丹尼尔·卡尼曼 / 胡晓姣,李爱民,何梦莹 译',
    cover: '/images/booklist/thinking-fast-slow.jpg',
    doubanIntro:
      '《纽约时报》2011年度十大好书。诺贝尔经济学奖得主卡尼曼揭示大脑中「快思考」与「慢思考」两套系统，以及它们如何影响判断与决策。',
    reasonBlocks:
      '作者第一个心理学家获得诺贝尔奖的作家。书籍有点难读，真的难，但懂了，在产品营销、销售与人打交道的场面，你会如鱼得水。',
    wrScore: '76.4',
    wrBadge: '值得一读',
    reason: '',
  },
  {
    title: '财富自由之路',
    author: '李笑来',
    cover: '/images/booklist/wealth-freedom.jpg',
    doubanIntro:
      '李笑来写给普通人的个人成长之书，谈注意力、元认知与复利，目标是让一部分知识分子先富起来。',
    reasonBlocks:
      '一个通篇没有一句钱字，但处处提到钱的书籍。\n\n' +
      '李笑来把个人成长中的最底层的东西，扒给你看了。千万不要被李笑来书名给吓到了。勇气是最不可造假的美德。\n\n' +
      '李笑来的很多书籍已经都是开源状态。为什么？李笑来正在财富自由ing。没必要啊。\n\n' +
      '李笑来个人博客网址：https://lixiaolai.com/##/',
    wrScore: '89.7',
    reason: '',
  },
  {
    title: '稀缺：我们是如何陷入贫穷与忙碌的',
    author: '塞德希尔·穆来纳森 / 魏薇,龙志勇 译',
    cover: '/images/booklist/scarcity.jpg',
    doubanIntro:
      '一个惊人真相：穷困之人会永远缺钱，而忙碌之人会永远缺时间。稀缺会形成「管窥」之见，俘获我们的注意力。',
    reasonBlocks:
      '忙碌不一定是一个好事。中国人骨子里提倡勤奋，但人的精力和体力是有限的，过多的精力和体力放在“术”层面上，自然对“道”层面少了注意。\n\n' +
      '道往往需要时间来思考。跳出框架来思考，这需要“你不能太忙”。留出空白来思考——思考未来、思考思考的方式、思考方法论……',
    wrScore: '70.5',
    wrBadge: '值得一读',
    reason: '',
  },
  {
    title: '认知觉醒：开启自我改变的原动力',
    author: '周岭',
    cover: '/images/booklist/cognition-awake.jpg',
    doubanIntro:
      '一部可以穿透时间的个人成长方法论：通过「大脑构造、潜意识、元认知」等思维规律看清自己，通过「深度学习、关联、反馈」洞悉如何真正成事。',
    reasonBlocks:
      '很适合普通人了解脑科学的书籍，所有社会学科的底层都是脑科学。\n\n' +
      '个人成长的最必要的知识就是脑科学。书中作者给你讲了三个不同的大脑🧠。\n\n' +
      '了解大脑，才能和它交朋友，一起成长。',
    wrScore: '90.5',
    wrBadge: '神作',
    reason: '',
  },
];

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
