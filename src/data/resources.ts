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

// ① 推荐书单（站内可读清单 · 2026-10-18 定稿：变体 B + 680px 居中）
// 封面放 public/images/booklist/（豆瓣图有防盗链，必须下载到本地，不能外链）
// 数据来源：公众号「种一个梦」读者必读书单（微信读书「Gus'的书单」长截图，2026-10-18 逐字录入）
// 推荐理由为原文照录，不做改写；微信读书推荐值需手工维护
export const bookRecs: BookRec[] = [
  {
    title: '《终身成长》（全新修订版）',
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
    title: '《纳瓦尔宝典》',
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
    title: '《穷查理宝典：查理·芒格智慧箴言录》（全新增订本）',
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
    title: '《文明、现代化、价值投资与中国》',
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
    title: '《经济学的思维方式》（第13版）',
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
    title: '《洞见：从科学到哲学，打开人类的认知真相》',
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
    title: '《思考致富》',
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
    title: '《自私的基因》（40周年增订版）',
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
    title: '《影响力》（全新升级版）',
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
    title: '《先发影响力》',
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
    title: '《人类简史：从动物到上帝》',
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
    title: '《枪炮、病菌与钢铁》',
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
    title: '《思考，快与慢》',
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
    title: '《财富自由之路》',
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
    title: '《稀缺：我们是如何陷入贫穷与忙碌的》',
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
    title: '《认知觉醒：开启自我改变的原动力》',
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
  {
    title: '《Rework》',
    author: '37signals（Jason Fried & David Heinemeier Hansson）',
    cover: '/images/booklist/rework.jpg',
    doubanIntro: '37signals 写给创业者的反常识手册：少做、做对、快速行动，用更少的资源把事做成。',
    reasonBlocks:
      '第4章「成长才是最大的副产品」里，我整段引用了这本书的「卖掉副产品」一节：37signals 的《Getting Real》本就是写书过程中不经意产生的副产品，最后直接赚了超过 100 万美元。' +
      '\n\n' +
      '它彻底改变了我对「做产品」的理解——你不需要先计划好要出一本书、做一个课，你只管好好做事、好好分享，产品会作为副产品自己长出来。' +
      '\n\n' +
      '先去做，再卖掉副产品。',
    reason: '',
  },
  {
    title: '《Show Your Work!》',
    author: 'Austin Kleon',
    cover: '/images/booklist/show-your-work.jpg',
    doubanIntro: 'Austin Kleon 关于「如何大方展示自己的创作过程」的短指南：被人看见，从公开分享开始。',
    reasonBlocks:
      '第4章讲「白天当学生，晚上当老师」，这本书就是「公开分享」最好的注脚。' +
      '\n\n' +
      '书里那段话我几乎全文引了：你仰慕并想效仿的人，没有一个是囤积作品、对别人保密的，他们都在网上不断发布自己作品的片段、想法和学到的知识。' +
      '\n\n' +
      '他们不浪费时间「建立人脉」，而是靠慷慨分享，反而收获了一个观众。想被看见，先公开做事。',
    reason: '',
  },
  {
    title: '《The Art of Focus》',
    author: 'Dan Koe',
    cover: '/images/booklist/the-art-of-focus.jpg',
    doubanIntro: 'Dan Koe 关于专注与一人公司的思考合集：把注意力放在重要的事上，而不是做更多。',
    reasonBlocks:
      '和《Rework》《Show Your Work!》一起列在第4章的书单里，因为它讲的恰恰是如何把注意力放在真正重要的事上。' +
      '\n\n' +
      'Dan Koe 的思路和我一致：不是做更多，而是少做、做对。一个人、一台电脑，靠的是聚焦，不是堆量。' +
      '\n\n' +
      '专注，是这个时代最被低估的杠杆。',
    reason: '',
  },
  {
    title: '《价值心法》',
    author: '姜胡说',
    cover: '/images/booklist/jiahu-xinfa.jpg',
    doubanIntro: '姜胡说把「如何想清楚、如何做成事」拆成可复用的方法论，偏实战、不灌鸡汤。',
    reasonBlocks:
      '姜胡说的内容我一直当「公开学习、公开分享」的范本在看，所以把它和《Rework》《Show Your Work!》列在一起。' +
      '\n\n' +
      '他最打动我的一点：把「如何想清楚、如何做成事」拆解成可以复用的方法，而不是灌鸡汤。' +
      '\n\n' +
      '想认真做事的人，值得翻一翻。',
    reason: '',
  },
  {
    title: '《小而美：持续盈利的经营法则》',
    author: 'Sahil Lavingia（萨希尔·拉文吉亚）',
    cover: '/images/booklist/xiao-er-mei.jpg',
    doubanIntro: 'Sahil Lavingia 用自己 Gumroad 的经历说明：不追求成为巨头，先把一门小生意做成、做盈利。',
    reasonBlocks:
      '第5章讲「为观众提供真正有价值的服务」，这本书是「一个人也能做成生意」的活样本。' +
      '\n\n' +
      'Sahil 把自己做 Gumroad 的经历写成了「小而美」——不追求成为巨头，先把一件小事做成、做盈利，再慢慢长大。' +
      '\n\n' +
      '和《闭环》里「第一个100块」的逻辑一脉相承：先跑通一个小闭环。',
    reason: '',
  },
  {
    title: '《The Mom Test》',
    author: 'Rob Fitzpatrick',
    cover: '/images/booklist/the-mom-test.jpg',
    doubanIntro: 'Rob Fitzpatrick 教你如何跟客户聊天还不被忽悠——别问「你会买吗」，要问出真话。',
    reasonBlocks:
      '第5章反复讲「去和用户建联、拿反馈」，这本书就是教你怎么和用户聊天还不被忽悠。' +
      '\n\n' +
      '名字来自一个真相：你妈都会对你说谎（出于爱护），所以别问「你会买吗」这种傻问题。' +
      '\n\n' +
      '怎么问出真话、怎么从聊天里挖出真需求，这本书讲透了。做产品前必读。',
    reason: '',
  },
  {
    title: '《Write Useful Books》',
    author: 'Rob Fitzpatrick',
    cover: '/images/booklist/write-useful-books.jpg',
    doubanIntro: '同一位作者专讲「怎么写一本真正有用、能卖出去的非虚构书」的可执行指南。',
    reasonBlocks:
      '同一位作者（写《The Mom Test》的那位）写的，专门讲「怎么写一本真正有用、能卖出去的非虚构书」。' +
      '\n\n' +
      '第5章我说「服务是产品的 1.0 版本」，这本书把「把你的解决方案写成书」这件事拆成了可执行的步骤。' +
      '\n\n' +
      '如果你也想把自己解决问题的能力打包成一本数字产品，这是绕不开的一本。',
    reason: '',
  },
  {
    title: '《Anything You Want》',
    author: 'Derek Sivers',
    cover: '/images/booklist/anything-you-want.jpg',
    doubanIntro: 'Derek Sivers 用 40 多条短心得讲透「从零做一门小生意」：生意是为别人解决问题。',
    reasonBlocks:
      'Derek Sivers 把「怎么从零开始做一门小生意」写成了 40 多条短心得，十几分钟就能读完。' +
      '\n\n' +
      '第5章讲「为其他人构建、别闭门造车」，他恰恰是用自己的 CD Baby 故事说明：生意是为别人解决问题的，不是为自己圆梦的。' +
      '\n\n' +
      '短、狠、没有废话，适合想清楚「我到底要不要开始」的人。',
    reason: '',
  },
  {
    title: '《俞军产品方法论》',
    author: '俞军',
    cover: '/images/booklist/yujun-product.jpg',
    doubanIntro: '俞军把产品思维的底层框架讲清楚，核心是「用户价值 = 新体验 − 旧体验 − 替换成本」。',
    reasonBlocks:
      '第6章讲「如何在你睡觉时赚钱」，前提是先有真正有用的产品，这本书是中文世界里产品思维的底层框架。' +
      '\n\n' +
      '俞军把「用户价值 = 新体验 − 旧体验 − 替换成本」这条公式讲得很透，也讲清楚了什么是「产品经理」该想的。' +
      '\n\n' +
      '想认真做产品的人，这是绕不开的一本。',
    reason: '',
  },
  {
    title: '《重新理解企业家精神》',
    author: '张维迎',
    cover: '/images/booklist/chongxin-lijie.jpg',
    doubanIntro: '张维迎把企业家精神还原为「发现机会、承担不确定性」，重新理解财富与市场的本质。',
    reasonBlocks:
      '和《俞军产品方法论》一起列在第6章，因为它把「企业家精神」还原成了「发现机会、承担不确定性」这件事。' +
      '\n\n' +
      '张维迎的观点和我一致：财富来自为别人解决问题，来自对未来的判断，而不是来自囤积。' +
      '\n\n' +
      '想理解「生意的本质」，这本书能帮你把地基打牢。',
    reason: '',
  },
  {
    title: '《The Heart Is the Bottleneck》',
    author: 'Tiago Forte',
    cover: '/images/booklist/heart-bottleneck.jpg',
    doubanIntro: 'Tiago Forte（打造第二大脑作者）谈「瓶颈在人、不在方法」，以及如何把已有好东西重新打包成产品。',
    reasonBlocks:
      '第6章我引用了 Tiago 的一段真实经历：他的第一个在线课程，是基于《搞定：无压工作的艺术》做的视频版，目标只赚 1000 美元，结果 4 年多下来 15000+ 人参加。' +
      '\n\n' +
      '这本书（以及他的「打造第二大脑」思路）说明一件事：你不需要原创一个惊天动地的点子，把一个已有的好东西重新打包、做成交付，就是一门生意。' +
      '\n\n' +
      '完美的「第一个数字产品」范本。',
    reason: '',
  },
  {
    title: '《How to Start a Startup》',
    author: 'Y Combinator / Sam Altman 等',
    cover: '/images/booklist/how-to-start-a-startup.jpg',
    doubanIntro: 'Y Combinator 在斯坦福开设的创业公开课，系统讲怎么从0到1做一家公司。',
    reasonBlocks:
      'YC 在斯坦福开的那门创业课，几乎把「从0到1做一家公司」拆成了公开课。' +
      '\n\n' +
      '第6章讲「数字产品风险几乎为零、可以先做再改」，这门课则是从更系统的角度讲：怎么找方向、怎么做产品、怎么增长。' +
      '\n\n' +
      '免费、完整、可以当播客一样反复听。',
    reason: '',
  },
  {
    title: '《Snow Leopard: How Legendary Writers Create A Category Of One》',
    author: 'Nicolas Cole、Christopher Lochhead、Eddie Yoon（Category Pirates）',
    cover: '/images/booklist/snow-leopard.png',
    doubanIntro: 'Category Pirates 讲「创造属于自己的品类」：厉害的写作者不开品类内卷，而是自己开一个品类。',
    reasonBlocks:
      '第7章讲「创造自己的品类」，这本书把这件事讲到了极致：真正厉害的写作者，不是在一个品类里卷，而是自己开一个只属于自己的品类。' +
      '\n\n' +
      'Category Pirates（Nicolas Cole 等人）用大量案例说明：差异化不是装饰，是生存方式。' +
      '\n\n' +
      '想做内容、又不想被淹没在红海里，这本值得反复读。',
    reason: '',
  },
  {
    title: '《$100M Offers》',
    author: 'Alex Hormozi',
    cover: '/images/booklist/100m-offers.jpg',
    doubanIntro: 'Alex Hormozi 讲如何把解决方案包装成「好到用户觉得不买就是傻」的 offer。',
    reasonBlocks:
      '第7章拆解「年入百万的收入组合流」，Hormozi 这两本（$100M Offers 和 $100M Leads）就是教你怎么把「解决方案」包装成别人抢着买的东西。' +
      '\n\n' +
      '他最核心的一句话：让你的 offer 好到用户觉得「不买就是傻」。' +
      '\n\n' +
      '和第3章的「引导磁铁」、第5章的「价值公式」可以直接串起来读。',
    reason: '',
  },
  {
    title: '《Case Study: Anatomy of a $10M Online Education Business》',
    author: 'Olly Richards',
    cover: '/images/booklist/case-study-10m.png',
    doubanIntro: 'Olly Richards 对自己语言教育生意从0到1000万美元的完整拆解：数字、决策与复盘。',
    reasonBlocks:
      '第7章讲「从解决自身问题开始打包成产品」，这本书就是一个完整的案例拆解：一门教语言的在线教育生意，是怎么从0做到 1000 万美元的。' +
      '\n\n' +
      '不是鸡汤，是逐层的数字、决策和复盘。' +
      '\n\n' +
      '想认真做数字产品的人，看别人怎么走通过一遍，比自己瞎摸索省十年。',
    reason: '',
  },
  {
    title: '《$100M Leads: How to Get Strangers To Want To Buy Your Stuff》',
    author: 'Alex Hormozi',
    cover: '/images/booklist/100m-leads.jpg',
    doubanIntro: 'Alex Hormozi 讲「怎么让陌生人主动想买你的东西」，与引导磁铁、获客打法直接呼应。',
    reasonBlocks:
      '第3章讲「引导磁铁（Lead Magnet）」怎么帮你低成本获客，这本书（和上面的 $100M Offers 是姐妹篇）专门讲「怎么让陌生人主动想买你的东西」。' +
      '\n\n' +
      '它和第3章的自动化序列、关键词回复那套打法直接呼应——先拿到注意力，再谈成交。' +
      '\n\n' +
      '想搞懂「流量从哪来」，这本是绕不开的。',
    reason: '',
  },
];

// ② 推荐网站 / 博客（2026-10-19：来自桌面《网站.xlsx》，放在「我的推荐」页书单下方）
// why 为 2026-10-19 起草的推荐语，可随时改；改完刷新页面即可生效
export const siteRecs: SiteRec[] = [
  {
    name: 'Sam Altman',
    url: 'https://blog.samaltman.com/',
    why: '文章不多，但几乎每篇都值得反复读。既谈怎么把一件事做成，也谈技术正把世界带去哪里。',
  },
  {
    name: 'Dan Koe',
    url: 'https://thedankoe.com/',
    why: '一个人把写作、产品和生意串成一件事的样板。想靠内容养活自己，这条路上绕不开他。',
  },
  {
    name: 'Paul Graham',
    url: 'https://paulgraham.com/articles.html',
    why: '把一件事想清楚，再写清楚。英文随笔的标杆，谈写作和创业的人几乎都在引用他。',
  },
  {
    name: '李笑来',
    url: 'https://lixiaolai.com/',
    why: '中文互联网里少见的长期主义者，博客、开源书籍都在他自己这个站上。',
  },
  {
    name: 'Justin Welsh',
    url: 'https://justinwelsh.me/essays',
    why: '一个人、一台电脑做成一门生意的完整打法，内容就是渠道。',
  },
  {
    name: "Seth's Blog",
    url: 'https://seths.blog/archive/',
    why: '每天一篇，常常只有一段。看上十年，你会换一种方式理解营销。',
  },
  {
    name: 'David Perell',
    url: 'https://perell.com/',
    why: '关于写作这件事本身：把文章当作品，而不是当产出。',
  },
  {
    name: '雪豹',
    url: 'https://lochhead.com/',
    why: '定位与品类设计的一线视角，商业播客与文章都在这里。',
  },
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com/news',
    why: '科技与创业世界的实时脉搏，值得每天扫一眼标题。',
  },
  {
    name: "Lenny's Newsletter",
    url: 'https://www.lennysnewsletter.com/p/start-here',
    why: '产品与增长的一手复盘，细节来自真正在做的人。',
  },
  {
    name: 'Tim Ferriss Show · 逐字稿',
    url: 'https://tim.blog/2018/09/20/all-transcripts-from-the-tim-ferriss-show/',
    why: '几百场长访谈的全文逐字稿，适合精读，不适合快翻。',
  },
  {
    name: 'Ribbonfarm',
    url: 'https://ribbonfarm.com/',
    why: '长文思辨，互联网思想界的深水区，读完要花点力气。',
  },
  {
    name: 'Zapier · Lead Magnet 指南',
    url: 'https://zapier.com/blog/lead-magnet/',
    why: '《闭环》第2章顺手推的「引导磁铁」入门文章。',
  },
  {
    name: 'Paul Graham · 创业点子误区',
    url: 'https://paulgraham.com/startupideas.html',
    why: '《闭环》第4章引用的 PG 经典文：怎么想创业点子。',
  },
  {
    name: 'Derek Sivers · 怎么提请求',
    url: 'https://sive.rs/asking',
    why: '《闭环》第4章引用的西弗斯短文：怎么向人提请求。',
  },
  {
    name: 'James Clear',
    url: 'https://jamesclear.com/',
    why: '《闭环》第6章引用「原子习惯」作者产品矩阵的出处。',
  },
];

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

// 注：⑤素材下载（PDF + 壁纸）已于 2026-10-19 按用户要求彻底下线，数据与文件一并移除，之后不再上线。
// 相关静态文件 public/resources/（5 个 PDF + 4 张壁纸）也一并删除。
