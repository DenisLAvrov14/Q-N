export type Topic = {
  slug: string; // 'physics' | 'chemistry' | ...
  title: string; // 'Physics'
};

export type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body1: string;
  body2: string;
  topic: string;   // topic slug
  source1?: string;
  source2?: string;
};
