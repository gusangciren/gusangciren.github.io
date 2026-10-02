/* ============================================================
   橱窗商品数据（页面 /shop 与 /tools 橱窗面板共用）
   交互：默认显示「面料特写（印花布）」，悬停后整图淡入换成「T 恤成品照」。
   手法：双层整图淡入（做法 A），不做抠图、不做印花叠加。
   ============================================================ */

export type ShopItem = {
  slug: string;
  name: string;
  color: string;
  price: string;
  tagline: string;
  /** 悬停前：面料特写（印花布） */
  fabric: string;
  /** 悬停后：T 恤成品照 */
  tee: string;
  /** 购买二维码（微信小店下单） */
  qr: string;
};

export const shopItems: ShopItem[] = [
  {
    slug: 'gourd',
    name: '山隱',
    color: '藏青',
    price: '¥ 59',
    tagline: '葫芦里装着看不清的答案',
    fabric: '/images/shop/design-gourd.jpg',
    tee: '/images/shop/tee-navy-gourd.png',
    qr: '/images/shop/qr-wechat-store.jpg',
  },
  {
    slug: 'heart-chair',
    name: '山里人',
    color: '黑',
    price: '¥ 59',
    tagline: '心里人，不请自来',
    fabric: '/images/shop/design-heart-chair.jpg',
    tee: '/images/shop/tee-black.jpg',
    qr: '/images/shop/qr-wechat-store.jpg',
  },
  {
    slug: 'world',
    name: '有点人情世故',
    color: '酒红',
    price: '¥ 59',
    tagline: '不世故，讲点故事人情',
    fabric: '/images/shop/design-world.jpg',
    tee: '/images/shop/tee-wine.jpg',
    qr: '/images/shop/qr-wechat-store.jpg',
  },
  {
    slug: 'evening',
    name: '晚风',
    color: '藏青',
    price: '¥ 59',
    tagline: '晚风里坐着一位老朋友',
    fabric: '/images/shop/design-evening.jpg',
    tee: '/images/shop/tee-navy.jpg',
    qr: '/images/shop/qr-wechat-store.jpg',
  },
];