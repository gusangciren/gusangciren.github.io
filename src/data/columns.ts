// 专栏数据：UAC 周刊 + 写作并变现（像企业家一样写作）
// 后续新增/替换链接时，只需修改本文件，不需要改页面结构。
// 标题保持微信公众号原文原样（命名规则 A，不做清洗）。
// issues 为倒序（最新在前）；groups 内部按正序，方便按顺序读。

export interface ColumnIssue {
  issue: number;
  title: string;
  url: string;
}

export interface FeaturedIssue {
  issue: number;
  value: string;
}

export interface ColumnGroup {
  name: string;
  issues: number[];
}

export interface Column {
  id: string;
  name: string;
  claim: string;
  description: string;
  albumUrl?: string;
  issueCount: number;
  featured: FeaturedIssue[];
  groups: ColumnGroup[];
  issues: ColumnIssue[];
}

export const columns: Column[] = [
  {
    id: 'uac-weekly',
    name: 'UAC 周刊',
    claim: "每周一篇，把写作、商业和认知里真正有用的东西讲透。不追热点，只写能放三年的东西。",
    description: '颠覆大众固有认知，推送不被算法喜爱的文章。',
    albumUrl: "https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzkyOTE4MDcyOA==&action=getalbum&album_id=3931407159660855300&scene=126#wechat_redirect",
    issueCount: 57,
    featured: [
      { issue: 21, value: "重新定义写作的目标：不为表达，为结果" },
      { issue: 12, value: "把你的技能变成可以重复卖的东西" },
      { issue: 6, value: "从随手记录到体系化创作的台阶" },
    ],
    groups: [
      { name: "写作", issues: [1, 2, 4, 6, 9, 10, 19, 21, 44, 48, 55] },
      { name: "David Perell 写作课", issues: [27, 28, 29, 30, 31, 33, 34, 37, 39, 41] },
      { name: "变现 · 生意 · 营销", issues: [7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 47, 49] },
      { name: "认知 · 财富", issues: [3, 5, 20, 22, 23, 24, 25, 26, 32, 35, 36, 40, 42, 50, 52, 53, 54, 56, 57] },
      { name: "创业 · 效率", issues: [38, 43, 45, 46, 51] },
    ],
    issues: [
      { issue: 57, title: "我们正在耗尽资源吗？（世界观）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497860&idx=1&sn=ba4e07db396436585606e94fc291dae5&chksm=c20fc5d3f5784cc5eac0ee0e1b99b96d7462bd70e3000db35d181d3b04e70a30e30eb00a281b#rd" },
      { issue: 56, title: "关于睡眠你需要知道的几件事。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497835&idx=1&sn=07ee71b001fae1a0c7b6d1109112fabc&chksm=c20fc53cf5784c2ad53252c08ff441069e3e82bff96c122d2b3bd1f658bab858fce247cb1a73#rd" },
      { issue: 55, title: "如何通过策展内容来增长受众。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497811&idx=1&sn=0be78d1155ba8b710be503d0025bf4d5&chksm=c20fc504f5784c1241642337b2ec77c1c65b1f2172752016d53326c457cad8664fe9393418dd#rd" },
      { issue: 54, title: "进化学能解释一切。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497791&idx=1&sn=774427fb269c627a5af7783efa32365f&chksm=c20fc568f5784c7e3ac9cf1c4119043630b132028de4596c9f949c19b76a93acbee4f5ddd582#rd" },
      { issue: 53, title: "不要出售时间。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497778&idx=1&sn=640c28762e80afd30175df57ed9f90f2&chksm=c20fc565f5784c73ba16bac2e6701c974a0ad59a2cd8c938461f11b35e793e5a1a2d28ee9391#rd" },
      { issue: 52, title: "地理\"大发现\"。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497746&idx=1&sn=d99f4a1e74d3e957fc62a65d16174cc6&chksm=c20fc545f5784c53cbbdcd666c3ee0ab4eb27e6582b7bf983994d75a3516087df7312c5a0fbf#rd" },
      { issue: 51, title: "用11分钟整理你的知识库：PARA系统。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497528&idx=1&sn=6e936edbc5124b2a58d923c01c3b171c&chksm=c20fca6ff57843790840c1f95a6c84aec4c55006f6dae1535d2d989430f37131e2912076b29f#rd" },
      { issue: 50, title: "《你和你的研究：推荐给任何有抱负的人。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497412&idx=1&sn=a6869e5aaa7752f5e0f58a6ec3ef82b2&chksm=c20fcb93f578428522d993072b0797531f3b037ecd4b151945f56d667657cf85d4e9a81aaf58#rd" },
      { issue: 49, title: "我的小生意成功的原因。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497383&idx=1&sn=2f0726d60ac55574cfdb434dcf72e9f5&chksm=c20fcbf0f57842e6d043e9a7f4c1014f5e276cbd585f753955e309d9deadb47148be22bd6a8a#rd" },
      { issue: 48, title: "《如果你的标题不符合这5个\"认知阶梯\"，它注定会被无视。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497129&idx=1&sn=eec0f52aa89fe7d6819d0c6eba1bbbad&chksm=c20fc8fef57841e80925ea2015184f9e4b89c9dc314ff7d98eba1804bb9c2d198c08e1d316bc#rd" },
      { issue: 47, title: "自-出版完全指南。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496764&idx=1&sn=0028ec541f880b48a3168ac7938e6367&chksm=c20fc96bf578407d3ecb5b0fd02f0b1797e619a8a078505d00d5caa368d252e22f225017d65f#rd" },
      { issue: 46, title: "创业点子：发现并重视一切身边的问题。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496735&idx=1&sn=bc03e73006b379279f3cfa401dff0933&chksm=c20fc948f578405eed2032a2c11c07d19d803bba4ceffd79dc22668b3b30a230dad6fd9b49f0#rd" },
      { issue: 45, title: "如何成为一个更高效的人？", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496723&idx=1&sn=7a2d73b2db970a00dca340930c75effa&chksm=c20fc944f5784052428a1c70b239fe0ffad35faf871b1deffa3d3fc4bcaa42cb121838e7881d#rd" },
      { issue: 44, title: "写作的第一性原理。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496675&idx=1&sn=f68279b30a298324023c3811212cbf64&chksm=c20fceb4f57847a2a78a13e49f87481340993d99cef816d41f7bc804baf2100b9641680104f5#rd" },
      { issue: 43, title: "创业，是一件「反直觉」的事情。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496649&idx=1&sn=bbd4c2f09d1952e83529244bfb244d54&chksm=c20fce9ef5784788720998eadba23fb312339108b536be3e6315f98eb3d0888b7b5e498271d5#rd" },
      { issue: 42, title: "如何在经济衰退期间赚大钱。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496619&idx=1&sn=33afff593a427b85b13e67255a2447f6&chksm=c20fcefcf57847ea10afa98b40f1d9c754f348525a7df653920ecc9c79e06aafc495b6b05e29#rd" },
      { issue: 41, title: "David perl的「50天写作课」（十）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496582&idx=1&sn=eba865b2a105c615d63f399ef1e7787f&chksm=c20fced1f57847c7837f8ca27173d81cf96dacbb0dce7d9b9885357dd65d47a7ca3eb7a45fad#rd" },
      { issue: 40, title: "2026年开始，就让「好运主动找你」吧！", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496536&idx=1&sn=0c8689b9add599321f0dba37a32ab66a&chksm=c20fce0ff578471942a025a9f253aef6dd7c618356b15118e198e28718980faaaa76b7efe55a#rd" },
      { issue: 39, title: "David perl的「50天写作课」（九）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496506&idx=1&sn=b238c07dee923bc7c52e54e415054246&chksm=c20fce6df578477b199582d04222ad17eec13da748fd0037b0dfb6d79c8e7060ab2ad5fe575a#rd" },
      { issue: 38, title: "做那些无法规模化的事。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496478&idx=1&sn=8db10f16900842928be292d654200cc5&chksm=c20fce49f578475f1d9ad3d73bc5dcef4bfed079504453ddcaa5aabb2476d8d598d92e470816#rd" },
      { issue: 37, title: "David perl的「50天写作课」（八）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496441&idx=1&sn=9793171ae152dff6d071a5efd7f199a0&chksm=c20fcfaef57846b8139b6cda9258158247c04b8fe302c3e006443d60cffc3b5a52dbada43903#rd" },
      { issue: 36, title: "如果你喜欢赚钱，那么你会喜欢这一篇文章。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496409&idx=1&sn=91f6870ea563582d2bd8a91910b7d144&chksm=c20fcf8ef5784698b6e58f8855a6a5ce2cf130f450121df6ef0d8cac9f71969544833681bef3#rd" },
      { issue: 35, title: "如何致富（不靠运气）。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496306&idx=1&sn=7d361bedbdb1fb877071580201822bf9&chksm=c20fcf25f5784633d149393dee3edcb08ce27b359c85b3b620346221f7cf99f92673e4ad18f5#rd" },
      { issue: 34, title: "David perl的「50天写作课」（七）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496290&idx=1&sn=bb30876cb4573472501b8979c7dcedc3&chksm=c20fcf35f5784623e449494f14ba27fa5ff39e6fe76f2cac748bc10fd9e1b748d10d1c639d1a#rd" },
      { issue: 33, title: "David perl的「50天写作课」（六）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496269&idx=1&sn=bb2994175aa548d1e3eab356f1ee2ade&chksm=c20fcf1af578460cee0a58ca6aeb7830fcdc889b1a38f5ee6142f6b586db9395dde6fefc9591#rd" },
      { issue: 32, title: "没有标题，重磅推荐。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496251&idx=1&sn=a2fb745c2dd2f9589773517c38035fd0&chksm=c20fcf6cf578467a438c95b0e61b995adb891bb159b1c9ebd05576c880c7750beadc9b4bb6d8#rd" },
      { issue: 31, title: "David perl的「50天写作课」（五）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496211&idx=1&sn=5b399aebe29188d62db83be6cdc63326&chksm=c20fcf44f5784652b894f2beb1504f8eb6d75971c304f3e9b701daa8dc62778f26cc60667da9#rd" },
      { issue: 30, title: "David perl的「50天写作课」（四）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496200&idx=1&sn=bc59c39bb840379bd8b1b4167827e18b&chksm=c20fcf5ff57846499cfdba68967cd887d719454d3657a6d6d82c2455eee096631c70e87dc742#rd" },
      { issue: 29, title: "David perl的「50天写作课」（三）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496164&idx=1&sn=f760a4a4531f63ffec9c7ea4c3f4ca55&chksm=c20fccb3f57845a54860f707b4cdefae02093e45664a4a19246c6090ecee08ab8783ecfa94a9#rd" },
      { issue: 28, title: "David perl的「50天写作课」（二）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496130&idx=1&sn=670c1fb164a7f0bf53cfcbc69ef4f4e7&chksm=c20fcc95f57845832ce0e2798827ff804fa0e128255966c1f89d70704255bb36832dd1c8f315#rd" },
      { issue: 27, title: "David perl的「50天写作课」（一）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496096&idx=1&sn=c33ff273783848ef5d6ffbd5e01505d3&chksm=c20fccf7f57845e1568c6e7b18622aaaff271215abc28843821c3b4f22d92d822e6ba6a28082#rd" },
      { issue: 26, title: "什么最重要？", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496092&idx=1&sn=1578b19945d16719bd3af0921aed5f97&chksm=c20fcccbf57845dd89ac84b9bbb18ad653ea6869b92377789846d94829671ca8099b6ebf989b#rd" },
      { issue: 25, title: "如何获得异常的成功。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496077&idx=1&sn=d2aace278bfbdfafb78d5e2cc654c506&chksm=c20fccdaf57845ccd874cc6b7feaa20f4d6c03837dc0e2193fa4796238e6773c394bdc5f963b#rd" },
      { issue: 24, title: "每个成年人都应该掌握的实用技能（下）。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496059&idx=1&sn=710866264c01ee51a7a8c8a338356044&chksm=c20fcc2cf578453afe9e41e776c0c7ed1024c94584e5da02abdf13822d0e15a40027ade1f4bb#rd" },
      { issue: 23, title: "每个成年人都应该掌握的实用技能（中）。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496043&idx=1&sn=7c69f9d1a97c42b5a7e417d63084c0c2&chksm=c20fcc3cf578452a192543bf92f9a51b5f855f29b89df5ae7919078e83670e6af69c383ecd20#rd" },
      { issue: 22, title: "每个成年人都应该掌握的实用技能（上）", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496020&idx=1&sn=8712af2c4f27f7f00e0ce758337a03cc&chksm=c20fcc03f578451577bfc827ea862af5d41059bbdc8ec947765b433e89c83d528decfc935f87#rd" },
      { issue: 21, title: "像企业家一样写作，不要学小说家。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496000&idx=1&sn=703b74ed01010c0b858557483bce5a9f&chksm=c20fcc17f57845015219e85abbf7a47638457398591b2ceaa0561b654505aa82ea0d8d2eb533#rd" },
      { issue: 20, title: "如果你在做一件人们不喜欢的事情，那就停下来。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495974&idx=1&sn=1c7c5c10c99fa5ab6ee241274f9d8f5e&chksm=c20fcc71f578456729de3430d7c1e37447f4fb95ef61af28c934821721805e925532675c086c#rd" },
      { issue: 19, title: "是「故事」塑造着我们的认知。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495931&idx=1&sn=3c8d889fa53bcc152267f832f7c9c035&chksm=c20fcdacf57844babf5a03d26614f81ee4a4d1413c26319983208bf7fd911a1abf1f762c8692#rd" },
      { issue: 18, title: "热爱与赚钱：Derek的方法。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495906&idx=1&sn=793282859ef5207108bfe93fd5944af7&chksm=c20fcdb5f57844a37c0034f07fd84af673273451bb71b279b893a8fb16b0850600e1924d699a#rd" },
      { issue: 17, title: "产品「预估价值」计算公式。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495883&idx=1&sn=6cd4ac9b1f19d59f1984e64c48f33657&chksm=c20fcd9cf578448a4f3d385d92e9c2b2e8d5be1c15554cd6d30ca78f1aa3d8f7ecb18195be0d#rd" },
      { issue: 16, title: "如何设计\"一人公司\"的产品体系？", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495861&idx=1&sn=cc2f1161fffcabcdbff64639c36287dc&chksm=c20fcde2f57844f4084e69d279fc4390212b20f798e049c9a7049d639f0c6d4a211342b8bae9#rd" },
      { issue: 15, title: "与爱尔兰麋鹿谈营销、谈内卷。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495812&idx=1&sn=7812614954573c0b74fdcf4d45aae53f&chksm=c20fcdd3f57844c5d0b6ff7972469b5ee4d8171f3f67d4f2e886f60e4fa5400f57a0ca8bafd2#rd" },
      { issue: 14, title: "\"花朵只不过是一株有广告费的野草。\"", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495791&idx=1&sn=a1b8e1eb06858494f5d7242267b14224&chksm=c20fcd38f578442e28f28ce0a73424ebf6c3e9b78865eccc4001b8adb0ce6fc7edcd6044f86e#rd" },
      { issue: 13, title: "广告是如何运作的？", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495773&idx=1&sn=081961502f2b5cb1c5f6a68b0d463cd4&chksm=c20fcd0af578441c3b4a01c07f3b10b7c515810b7c9d7ddb8994385dd3ce26d414e1604ae5b6#rd" },
      { issue: 12, title: "把自己产品化。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495742&idx=1&sn=5784865e5cb474654a8f927e885dd100&chksm=c20fcd69f578447f2ca0bef45f906bca82dea659aea0b4647e05fcd365cb5b2732144bec7203#rd" },
      { issue: 11, title: "用户购买的不是产品，不！是！产！品！", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495683&idx=1&sn=7fee3c3954e4acfbb76126738db521a1&chksm=c20fcd54f5784442e05dac6c3e27c89fcad49b39b40d325afff494f91fe165e5dfe24ec557dc#rd" },
      { issue: 10, title: "Learn/Working in public", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495638&idx=1&sn=395eacc46f182fe6408daffe099010ec&chksm=c20fd281f5785b97e7aab9c322376dea8c722a53fc264af2ee96a5d5715c9235e1efd2492e76#rd" },
      { issue: 9, title: "内容策展（Content Curation）的7步指南。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495622&idx=1&sn=df8829dbc85cd558e2afe41dd2006115&chksm=c20fd291f5785b87f24375da7fbee7c75c402cd02ee49b0581c5fb232e3ee44dbaa14d0e616a#rd" },
      { issue: 8, title: "追随者", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495603&idx=1&sn=17e25bf46111c87d4573fe72ebb0a592&chksm=c20fd2e4f5785bf287262343e55fe882b3abe6690111c7b7825fd204416d0786468c12822089#rd" },
      { issue: 7, title: "来，让用户为免费买单。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495476&idx=1&sn=171e8a77a561b7cf1ca7f78187f3078c&chksm=c20fd263f5785b75054e4ebb1d5b0ec7604ce4d0ac2e0e77518ad9aa7c51683c306908adac3c#rd" },
      { issue: 6, title: "《内容金字塔：创作者的成长路线图》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495511&idx=1&sn=a9b5f023b9006e1ee5f4538c4de3a87c&chksm=c20fd200f5785b160768c5ffc35877600df6212a08c1f78df946c7348dcdcfd2bf8207df7016#rd" },
      { issue: 5, title: "20分钟速成课：「经济学」。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495450&idx=1&sn=166d7c315bda76f338d756a9828604f5&chksm=c20fd24df5785b5ba4cb1d3e7572536889b7ab8219013650c1cfb6bdf3d0afcad83ea3db5b69#rd" },
      { issue: 4, title: "《当思想有了\"性\"》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495406&idx=1&sn=26ca976106e98de492989fcb67db8d02&chksm=c20fd3b9f5785aaf6ba3d6656b2e9c1231a84e5fc88f5075b2b56c49683eda41a4b97bdf1f98#rd" },
      { issue: 3, title: "金钱不等于财富。「90%的人严重忽略的知识」。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495388&idx=1&sn=10ecda6d709559d71b2ba3400184083f&chksm=c20fd38bf5785a9deddddba1bfcedc5e8e1180db87f7fe0a03dd927a691b015629f811dbd198#rd" },
      { issue: 2, title: "解决自身问题，帮助\"过去的自己\"。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495355&idx=1&sn=c59baf1c5333e95abfd1570279fc2492&chksm=c20fd3ecf5785afa8df03e4f089b752b82308ca2e1390384ffa9ae3c5dc16c21b0bc0cc847b3#rd" },
      { issue: 1, title: "UAC周刊：颠覆大众固有认知，推送不被算法喜爱的文章。", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247495333&idx=1&sn=e217fee8fb105c7e648b06114ae86ed9&chksm=c20fd3f2f5785ae4fa74c7d82a02f46f5466a9f774566d25b2f28fc53b7f7d8644b231c3bb99#rd" },
    ],
  },
  {
    id: 'write-like-entrepreneur',
    name: '写作并变现：像企业家一样写作',
    claim: "从一句话的记录，到写完一本书，再到靠它赚钱。把写作当成一门生意来做。",
    description: '从记录、写书到变现，用企业家思维做内容。',
    issueCount: 19,
    featured: [
      { issue: 1, value: "为什么高手都随手记录：把写作的启动成本降到最低" },
      { issue: 3, value: "一次一句话、250 字，攒够就能成文成书" },
      { issue: 17, value: "把写出来的东西变成收入的路径" },
    ],
    groups: [
      { name: "开始写", issues: [1, 3, 6, 7, 9, 14] },
      { name: "创造力与学习", issues: [5, 8, 10] },
      { name: "工具箱", issues: [2, 11, 12] },
      { name: "从阅读到写书", issues: [4, 15, 16, 18] },
      { name: "变现与定位", issues: [13, 17, 19] },
    ],
    issues: [
      { issue: 19, title: "《致富的秘密：打造别人想要的东西。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497771&idx=1&sn=4a708dc38aa72f8d4d6e7e3596a85feb&chksm=c20fc57cf5784c6a7b6672de247776da516714403828d99ca877ff9f275bbde013166a0c7b01#rd" },
      { issue: 18, title: "《主题阅读：面向输出最有效的输入。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497559&idx=1&sn=1a7bb17954ac737707ab20f38dcc1aeb&chksm=c20fca00f5784316d994778b3cb80e5990268996b794d31f508a1c927efde062106b4d6b46ee#rd" },
      { issue: 17, title: "《如何靠写书来赚钱：让自己产品化。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497499&idx=1&sn=435ed13a1284a6dfbe67a60661b5fb1d&chksm=c20fca4cf578435a7ca2834d1e133fc5d583062ea0f649abcbefad829352ff815dc19f600cb7#rd" },
      { issue: 16, title: "《从知识卡片到写书：我的写书指南。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497471&idx=1&sn=3f0c7ef4ae769e8ea260a819cded9498&chksm=c20fcba8f57842becfcfb20e9e28f5e6d0ded4f1730ac395eedf378f826569642bed64338671#rd" },
      { issue: 15, title: "《写书作为项目研究与推进。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497435&idx=1&sn=b44da54d034c25b7204d40e4810bd2ed&chksm=c20fcb8cf578429a04fa62157f738d21902455024dbd7c3c34c60b2a25b293ffd8739f637086#rd" },
      { issue: 14, title: "《我是天才：如果我常备12个问题。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497396&idx=1&sn=c4806b26ba83a87aa99151e89a3b4da1&chksm=c20fcbe3f57842f5f3256d5cbaec3c6513cdb56e95d8aea005c332320e575ec6541f8d8e778b#rd" },
      { issue: 13, title: "《成为专家：被忽略的作家身份。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497357&idx=1&sn=d4157189e64f3cfe3ebc953b6c26cdd3&chksm=c20fcbdaf57842cc9ae6891db9f48dd983b296f4409f3cc183c8f03e1fe1f061045f29f25a9f#rd" },
      { issue: 12, title: "《工具箱2：AI时代，写作就是编程。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497325&idx=1&sn=70422fcdd6d39676e34af2d5d30eaef5&chksm=c20fcb3af578422c7c4242db7b1cd8d7099ae11dd74832fe904d74038a1434f687ce50922552#rd" },
      { issue: 11, title: "《工具箱1：双拼音打。每天10分钟，7天重启你的创作系统。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497300&idx=1&sn=7f875c2531a8bf6d3bc3cbe0bac6ca5c&chksm=c20fcb03f57842156d11128fe8c5128b80f10007727a40e3055e781725d5ce49d5a5a0461f99#rd" },
      { issue: 10, title: "《知识的“涌现”：复杂系统的简单原则。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497278&idx=1&sn=c67eab78e0c0ff75a671372a18a9e815&chksm=c20fcb69f578427f10409c96559b66b6e3cae4df3559e2a79347aa6a0c825187fcfa47a84499#rd" },
      { issue: 9, title: "《出口成章：语音写作法。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497205&idx=1&sn=16dea09056a041883a7d762bcd200dca&chksm=c20fc8a2f57841b4d11929e2c8a4ca183f40e7f542f14a6777d49068768640a2ea6044da4dd4#rd" },
      { issue: 8, title: "《创造力的来源：专注模式与发散模式。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497190&idx=1&sn=daad2d31c48fb1b25c95508dae5e974b&chksm=c20fc8b1f57841a72a16d319764feaf67d0b9e4b72186cd7fb5f54f5453ffed5dc5a3d901518#rd" },
      { issue: 7, title: "《3个步骤：如何完成一个长篇文章？》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497180&idx=1&sn=f3b4602d3b596e1043d30e096479c05d&chksm=c20fc88bf578419ddcbde83222085c20295766a1018ca6eacabe02eff92cf5b54e2ab726580a#rd" },
      { issue: 6, title: "《注重数量而非质量》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497104&idx=1&sn=f130fd0e75ab6e8bd77a93005a496a65&chksm=c20fc8c7f57841d1ff3b3b18fcf4010513cdd176c0b66fe89851346cfa2e69945fc037ebfca1#rd" },
      { issue: 5, title: "《感性学习法：不喜欢看书，你该如何进步？》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497044&idx=1&sn=0d63e8600959e16d22af68eb0310517c&chksm=c20fc803f5784115f07c7d0856ed8adaf66d04a47f09be304aeca7cde338cf61c7c0c803b392#rd" },
      { issue: 4, title: "《边缘页的思考：边阅读边记录的3个关键好处。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247497022&idx=1&sn=93356610d1b7b01577c7d456d49e3625&chksm=c20fc869f578417fedc5c736baa0bfae4e251ff504ae87a0f5728d96df9cee44a297d451b133#rd" },
      { issue: 3, title: "《250字：每次一句话，你就能写文章/书。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496916&idx=1&sn=2cd25b3201741eb006f78b7028033ad5&chksm=c20fc983f57840958af20c2abb0b7afa9e9daa42ba7eacfeb4336ca5929c9e811c65838d3771#rd" },
      { issue: 2, title: "《写作软件推荐：像聊天一样记笔记。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496872&idx=1&sn=6df16d0984f914cacd5715861e5bff0c&chksm=c20fc9fff57840e9ae4bf3509e64faf530496defb5546287b20c235133451525794404acccb1#rd" },
      { issue: 1, title: "《高产的秘密：就用手机记录。》", url: "https://mp.weixin.qq.com/s?__biz=MzkyOTE4MDcyOA==&mid=2247496812&idx=1&sn=60521b10df1ee51445b87af96ff0f30b&chksm=c20fc93bf578402dded5accc6baf345fce55441e50d495fb800666dca1fa990417c170d26d4c#rd" },
    ],
  },
];
