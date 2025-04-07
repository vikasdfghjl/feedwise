import { createContext } from 'react';
import { Article, Feed, Tag, Category } from '../types';

// Define interface for article API parameters
interface ArticleParams {
  limit: number;
  page: number;
  feedId?: string;
  tag?: string;
}

// Define error type
interface ApiError {
  response?: {
    data?: {
      message?: string;
    }
  };
  message: string;
}

// Define time filter options
export type TimeFilterOption = 'all' | '24h' | '7d' | '30d';

export interface FeedContextType {
  feeds: Feed[];
  articles: Article[];
  tags: Tag[];
  categories: Category[];
  filteredArticles: Article[];
  selectedFeed: Feed | null;
  selectedTag: Tag | null;
  searchQuery: string;
  timeFilter: TimeFilterOption; // Added time filter
  loading: boolean;
  error: string | null;
  addFeed: (feedData: { url: string, category: string, tags?: string[] }) => Promise<Feed>;
  removeFeed: (id: string) => Promise<void>;
  selectFeed: (feed: Feed | null) => void;
  selectTag: (tag: Tag | null) => void;
  setSearchQuery: (query: string) => void;
  setTimeFilter: (filter: TimeFilterOption) => void; // Added setter for time filter
  markAsRead: (articleId: string) => Promise<void>;
  toggleSaved: (articleId: string) => Promise<void>;
  addTag: (name: string, color?: string) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  getFeedById: (id: string) => Feed | undefined;
  refreshFeed: (id: string) => Promise<void>;
}

// Export the context so it can be imported by the useFeed hook
export const FeedContext = createContext<FeedContextType | undefined>(undefined);