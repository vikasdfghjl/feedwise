import { createContext } from 'react';
import { Article, Feed, Tag, Category } from '../types';

// Define interface for article API parameters
interface ArticleParams {
  limit: number;
  page: number;
  feedId?: string;
  tags?: string[]; // Changed from tag to tags (array) to support multiple tags
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
  selectedTags: Tag[]; // Changed from selectedTag to selectedTags (array)
  searchQuery: string;
  timeFilter: TimeFilterOption;
  loading: boolean;
  error: string | null;
  isSavedView: boolean;
  addFeed: (feedData: { url: string, category: string, tags?: string[] }) => Promise<Feed>;
  removeFeed: (id: string) => Promise<void>;
  selectFeed: (feed: Feed | null) => void;
  selectTag: (tag: Tag) => void; // Changed to add a tag to selection
  deselectTag: (tagId: string) => void; // Added to remove a tag from selection
  clearTagSelection: () => void; // Added to clear all selected tags
  setSearchQuery: (query: string) => void;
  setTimeFilter: (filter: TimeFilterOption) => void;
  markAsRead: (articleId: string) => Promise<void>;
  toggleSaved: (articleId: string) => Promise<void>;
  addTag: (name: string, color?: string) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  getFeedById: (id: string) => Feed | undefined;
  refreshFeed: (id: string) => Promise<void>;
  checkForNewContent: (id: string) => Promise<void>;
  clearNewContentFlag: (id: string) => void;
  handleSavedArticles: () => void;
}

// Export the context so it can be imported by the useFeed hook
export const FeedContext = createContext<FeedContextType | undefined>(undefined);