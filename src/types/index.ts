export interface PostWithAuthor {
  id: string;
  content: string;
  images: string[];
  category: string;
  isAnonymous: boolean;
  authorId: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  isPinned: boolean;
  isHidden: boolean;
  viewCount: number;
  reportCount: number;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    comments: number;
    likes: number;
  };
  isLiked?: boolean;
}

export interface CommentWithAuthor {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  postId: string;
  parentId: string | null;
  replies: CommentWithAuthor[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
