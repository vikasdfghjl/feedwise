import React, { useState, useEffect } from 'react';
import { FeedContext, FeedContextType, TimeFilterOption } from './FeedContext';
import { Article, Feed, Tag, Category } from '../types';
import { toast } from '../components/ui/use-toast';
import * as api from '../services/api';

// Define interface for article API parameters
interface ArticleParams {
  limit: number;
  page: number;
  feedId?: string;
  tag?: string;
  isSaved?: boolean;
  source?: string;
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

export const FeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('all');
  const [isSavedView, setIsSavedView] = useState<boolean>(false);
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories, tags, and feeds in parallel
        const [categoriesRes, tagsRes, feedsRes] = await Promise.all([
          api.getCategories(),
          api.getTags(),
          api.getFeeds()
        ]);
        
        setCategories(categoriesRes.data);
        setTags(tagsRes.data);
        setFeeds(feedsRes.data);
        
        // Fetch initial articles
        const articlesRes = await api.getArticles({ 
          limit: 50, 
          page: 1 
        });
        setArticles(articlesRes.data.articles);
        
        setLoading(false);
      } catch (err: unknown) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Calculate article relevance scores based on user tags
  const calculateRelevanceScores = (articlesToScore: Article[], userTags: Tag[]) => {
    return articlesToScore.map(article => {
      let relevanceScore = 0;
      // Base score from article tags matching user tags
      if (article.tags && userTags.length > 0) {
        userTags.forEach(userTag => {
          if (article.tags?.includes(userTag.name)) {
            relevanceScore += 0.25; // Increase score for each matching tag
          }
        });
      }
      
      // Recency bonus (newer articles get higher scores)
      const articleDate = new Date(article.publishDate);
      const now = new Date();
      const daysDifference = Math.floor((now.getTime() - articleDate.getTime()) / (1000 * 3600 * 24));
      if (daysDifference < 1) relevanceScore += 0.3;
      else if (daysDifference < 3) relevanceScore += 0.2;
      else if (daysDifference < 7) relevanceScore += 0.1;
      
      // If it's already been read, reduce the score
      if (article.isRead) relevanceScore -= 0.2;
      
      // If it's saved, boost the score slightly
      if (article.isSaved) relevanceScore += 0.1;
      
      return {
        ...article,
        relevanceScore: Math.min(Math.max(relevanceScore, 0), 1) // Clamp between 0 and 1
      };
    });
  };
  
  // Re-calculate relevance scores whenever articles or tags change
  useEffect(() => {
    if (articles.length > 0 && tags.length > 0) {
      setArticles(prev => calculateRelevanceScores(prev, tags));
    }
  }, [tags, articles]);
  
  // Fetch articles when selectedFeed, selectedTag, or searchQuery changes
  useEffect(() => {
    const fetchFilteredArticles = async () => {
      try {
        setLoading(true);
        
        // Special handling for saved:true search query - use dedicated endpoint
        if (searchQuery.toLowerCase().trim() === 'saved:true') {
          // Use the dedicated endpoint for saved articles
          const params = { 
            limit: 50, 
            page: 1,
            ...(selectedFeed ? { feedId: selectedFeed._id } : {}),
            ...(selectedTag ? { tag: selectedTag.name } : {})
          };
          
          const response = await api.getSavedArticles(params);
          setArticles(response.data.articles);
          setLoading(false);
          return;
        }
        
        // Build filter params for regular articles
        const params: ArticleParams = { limit: 50, page: 1 };
        if (selectedFeed) params.feedId = selectedFeed._id;
        if (selectedTag) params.tag = selectedTag.name;
        
        const response = await api.getArticles(params);
        setArticles(response.data.articles);
        
        setLoading(false);
      } catch (err: unknown) {
        const error = err as ApiError;
        console.error('Error fetching articles:', error);
        setError('Failed to fetch articles. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchFilteredArticles();
  }, [selectedFeed, selectedTag, searchQuery]);
  
  // Compute filtered articles based on selected feed, tag, search query
  const filteredArticles = React.useMemo(() => {
    let filtered = [...articles];
    
    // We don't need to filter by selectedFeed or selectedTag anymore
    // since we're fetching filtered articles from the API
    
    // Filter by search query (if it's not the special saved:true query)
    if (searchQuery && searchQuery.toLowerCase().trim() !== 'saved:true') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.description.toLowerCase().includes(query)
      );
    }
    
    // Sort by a combination of relevance score and recency
    filtered.sort((a, b) => {
      // If relevance score difference is significant, prioritize that
      const relevanceDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
      if (Math.abs(relevanceDiff) > 0.3) {
        return relevanceDiff;
      }
      // Otherwise fall back to sorting by date
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });
    
    return filtered;
  }, [articles, searchQuery]);

  const addFeed = async (feedData: { url: string, category: string, tags?: string[] }) => {
    try {
      setLoading(true);
      const response = await api.createFeed(feedData);
      
      // Add the new feed to state
      setFeeds(prev => [...prev, response.data]);
      
      // Fetch updated articles that include articles from the new feed
      const articlesRes = await api.getArticles({ limit: 50, page: 1 });
      setArticles(articlesRes.data.articles);
      
      setLoading(false);
      
      toast({
        title: "Feed added",
        description: `${response.data.title} has been added to your feeds`,
      });
      
      // Return the new feed
      return response.data;
    } catch (err: unknown) {
      const error = err as ApiError;
      setLoading(false);
      console.error('Error adding feed:', err);
      toast({
        title: "Error adding feed",
        description: error.response?.data?.message || "Failed to add feed",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeFeed = async (id: string) => {
    try {
      setLoading(true);
      await api.deleteFeed(id);
      
      // Remove feed from state
      setFeeds(prev => prev.filter(feed => feed._id !== id));
      
      // Remove associated articles from state
      setArticles(prev => prev.filter(article => article.feedId !== id));
      
      if (selectedFeed?._id === id) {
        setSelectedFeed(null);
      }
      
      setLoading(false);
      
      toast({
        title: "Feed removed",
        description: "The feed has been removed from your list",
      });
    } catch (err: unknown) {
      const error = err as ApiError;
      setLoading(false);
      console.error('Error removing feed:', err);
      toast({
        title: "Error removing feed",
        description: error.response?.data?.message || "Failed to remove feed",
        variant: "destructive",
      });
    }
  };

  const selectFeed = (feed: Feed | null) => {
    setSelectedFeed(feed);
    setSelectedTag(null); // Clear tag selection when selecting a feed
    
    // Clear saved view flag
    setIsSavedView(false);
    
    // Clear search query if it exists
    if (searchQuery) {
      setSearchQuery('');
    }
  };

  const selectTag = (tag: Tag | null) => {
    setSelectedTag(tag);
    setSelectedFeed(null); // Clear feed selection when selecting a tag
    
    // Clear saved view flag
    setIsSavedView(false);
    
    // Clear search query if it exists
    if (searchQuery) {
      setSearchQuery('');
    }
  };

  const markAsRead = async (articleId: string) => {
    try {
      await api.markArticleAsRead(articleId);
      
      // Update article in state
      setArticles(prev => 
        prev.map(article => 
          article._id === articleId 
            ? { ...article, isRead: true } 
            : article
        )
      );
      
      // Update unread count for the associated feed
      const article = articles.find(a => a._id === articleId);
      if (article && !article.isRead) {
        setFeeds(prev => 
          prev.map(feed => 
            feed._id === article.feedId 
              ? { ...feed, unreadCount: (feed.unreadCount > 0 ? feed.unreadCount - 1 : 0) } 
              : feed
          )
        );
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error('Error marking article as read:', err);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to mark article as read",
        variant: "destructive",
      });
    }
  };

  const toggleSaved = async (articleId: string) => {
    try {
      // Find the article in state
      const article = articles.find(a => a._id === articleId);
      if (!article) return;
      
      // Store the current saved state before toggling
      const wasArticleSaved = article.isSaved;
      
      // Optimistically update UI first
      setArticles(prev => 
        prev.map(article => 
          article._id === articleId 
            ? { ...article, isSaved: !article.isSaved } 
            : article
        )
      );
      
      // Make API call
      const response = await api.toggleSavedArticle(articleId);
      
      toast({
        title: wasArticleSaved ? "Article removed from saved" : "Article saved",
        description: wasArticleSaved 
          ? "The article has been removed from your saved items" 
          : "The article has been added to your saved items",
      });
      
      // If we're currently viewing saved articles and the article was unsaved,
      // we need to refresh the list
      if (searchQuery.toLowerCase().trim() === 'saved:true' && wasArticleSaved) {
        // Small delay to allow the animation to complete
        setTimeout(() => {
          const params: ArticleParams = { limit: 50, page: 1, isSaved: true };
          api.getArticles(params).then(response => {
            setArticles(response.data.articles);
          });
        }, 300);
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error('Error toggling saved status:', err);
      
      // Revert optimistic update in case of error
      setArticles(prev => 
        prev.map(article => 
          article._id === articleId 
            ? { ...article, isSaved: !article.isSaved } 
            : article
        )
      );
      
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update saved status",
        variant: "destructive",
      });
    }
  };

  const addTag = async (name: string, color = '#3b82f6') => {
    try {
      setLoading(true);
      const response = await api.createTag(name, color);
      
      // Add new tag to state
      setTags(prev => [...prev, response.data]);
      
      setLoading(false);
      
      toast({
        title: "Tag added",
        description: `Tag "${name}" has been created`,
      });
    } catch (err: unknown) {
      const error = err as ApiError;
      setLoading(false);
      console.error('Error adding tag:', error);
      toast({
        title: "Error adding tag",
        description: error.response?.data?.message || "Failed to add tag",
        variant: "destructive",
      });
    }
  };

  const removeTag = async (id: string) => {
    try {
      setLoading(true);
      await api.deleteTag(id);
      
      // Remove tag from state
      setTags(prev => prev.filter(tag => tag._id !== id));
      
      if (selectedTag?._id === id) {
        setSelectedTag(null);
      }
      
      setLoading(false);
      
      toast({
        title: "Tag removed",
        description: "The tag has been removed"
      });
    } catch (err: unknown) {
      const error = err as ApiError;
      setLoading(false);
      console.error('Error removing tag:', error);
      toast({
        title: "Error removing tag",
        description: error.response?.data?.message || "Failed to remove tag",
        variant: "destructive",
      });
    }
  };

  const getFeedById = (id: string) => {
    return feeds.find(feed => feed._id === id);
  };

  const refreshFeed = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.refreshFeed(id);
      
      // Update feed in state
      setFeeds(prev => 
        prev.map(feed => 
          feed._id === id 
            ? response.data.feed
            : feed
        )
      );
      
      // Fetch updated articles
      const articlesRes = await api.getArticles({ 
        limit: 50, 
        page: 1,
        ...(selectedFeed ? { feedId: selectedFeed._id } : {}),
        ...(selectedTag ? { tag: selectedTag.name } : {})
      });
      setArticles(articlesRes.data.articles);
      
      setLoading(false);
      
      toast({
        title: "Feed refreshed",
        description: "The feed has been refreshed with new articles"
      });
    } catch (err: unknown) {
      const error = err as ApiError;
      setLoading(false);
      console.error('Error refreshing feed:', error);
      toast({
        title: "Error refreshing feed",
        description: error.response?.data?.message || "Failed to refresh feed",
        variant: "destructive",
      });
    }
  };

  const checkForNewContent = async (id: string) => {
    try {
      const response = await api.checkFeedForNewContent(id);
      if (response.data.hasNewContent) {
        // Update feed in state to show it has new content
        setFeeds(prev => 
          prev.map(feed => 
            feed._id === id 
              ? { ...feed, hasNewContent: true }
              : feed
          )
        );
      }
      return response.data;
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error('Error checking for new content:', error);
      throw error;
    }
  };

  const clearNewContentFlag = (id: string) => {
    setFeeds(prev => 
      prev.map(feed => 
        feed._id === id 
          ? { ...feed, hasNewContent: false }
          : feed
      )
    );
  };

  const handleSavedArticles = () => {
    selectFeed(null);
    selectTag(null);
    
    // Instead of using a special search query, we should directly call the saved articles API
    const fetchSavedArticles = async () => {
      try {
        setLoading(true);
        const response = await api.getSavedArticles({ limit: 50, page: 1 });
        setArticles(response.data.articles);
        // Set a flag to indicate we're viewing saved articles
        setIsSavedView(true);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching saved articles:', err);
        setLoading(false);
      }
    };
    
    fetchSavedArticles();
  };

  return (
    <FeedContext.Provider
      value={{
        feeds,
        articles,
        tags,
        categories,
        filteredArticles,
        selectedFeed,
        selectedTag,
        searchQuery,
        timeFilter,
        loading,
        error,
        isSavedView,
        addFeed,
        removeFeed,
        selectFeed,
        selectTag,
        setSearchQuery,
        setTimeFilter,
        markAsRead,
        toggleSaved,
        addTag,
        removeTag,
        getFeedById,
        refreshFeed,
        checkForNewContent,
        clearNewContentFlag,
        handleSavedArticles
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};
