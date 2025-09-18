export type Topic = { slug: string; title: string; order?: number | null };

export type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  body1?: string | null;
  body2?: string | null;
  source1?: string | null;
  source2?: string | null;

  // новые поля
  topicId?: number | null;
  topicSlug?: string | null;
  topicTitle?: string | null;
};

export type SubmissionStatus = 'new' | 'approved' | 'rejected';

export type SubmissionCreate = {
  question: string;
  topic?: string | null; // slug из topics или null
};

export type SubmissionCreateResult = {
  id: number;
  status: SubmissionStatus;
  created_at: string;
};

export type RootStackParamList = {
  Home: undefined;
  Article: { item: Article };
};
