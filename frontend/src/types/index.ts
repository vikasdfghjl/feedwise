export interface Feed {
  _id: string;
  title: string;
  url: string;
  favicon?: string;
  category: string;
  tags?: string[];
  lastUpdated: string | Date;
  unreadCount: number;
  hasNewContent?: boolean; // Added to track if feed has new content available
  userId: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Article {
  _id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  feedId: string;
  feedTitle: string;
  feedFavicon?: string;
  author?: string;
  publishDate: string | Date;
  tags?: string[];
  imageUrl?: string;
  isRead: boolean;
  isSaved: boolean;
  relevanceScore: number;
  matchedTagCount?: number; // Adding this property to track tag matches
  userId: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Tag {
  _id: string;
  name: string;
  color: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Category {
  _id: string;
  name: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  token?: string;
}

export interface AIRecommendation {
  type: 'feed' | 'article';
  id: string;
  reason: string;
  score: number;
}
