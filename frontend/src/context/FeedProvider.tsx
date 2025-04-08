import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
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
  const [shouldFetchArticles, setShouldFetchArticles] = useState<boolean>(true);
  const [isSavedView, setIsSavedView] = useState<boolean>(false);
  
  // Check if current route is a public route (login or signup)
  const isPublicRoute = location.pathname === '/login' || location.pathname === '/signup';
  
  // Fetch initial data only if we're not on a public route
  useEffect(() => {
    const fetchData = async () => {
      // Skip data fetching on login/signup pages
      if (isPublicRoute) return;
      
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
        // We've fetched data, so set shouldFetchArticles to false
        setShouldFetchArticles(false);
      } catch (err: unknown) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [location.pathname, isPublicRoute]);
  
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
  
  // Fetch articles when selectedFeed or selectedTag changes
  useEffect(() => {
    // Skip fetching on public routes
    if (isPublicRoute) return;
    
    // Only fetch from API if the shouldFetchArticles flag is true
    if (!shouldFetchArticles) {
      // Filter articles locally instead of fetching from the server
      setArticles(prevArticles => {
        // If no feed or tag is selected, show all articles (no filtering needed)
        if (!selectedFeed && !selectedTag) {
          return prevArticles;
        }
        
        // Filter based on selected feed or tag
        return prevArticles.filter(article => {
          // If a feed is selected, show only articles from that feed
          if (selectedFeed && article.feedId === selectedFeed._id) {
            return true;
          }
          
          // If a tag is selected, show only articles with that tag
          if (selectedTag && article.tags && article.tags.includes(selectedTag.name)) {
            return true;
          }
          
          return false;
        });
      });
      return;
    }
    
    const fetchFilteredArticles = async () => {
      try {
        setLoading(true);
        
        // Check if we should fetch saved articles (special case)
        const isFetchingSavedArticles = searchQuery.toLowerCase().trim() === 'saved:true';
        
        if (isFetchingSavedArticles) {
          // Use the dedicated saved articles endpoint
          const params = { 
            limit: 50, 
            page: 1,
            ...(selectedFeed ? { feedId: selectedFeed._id } : {}),
            ...(selectedTag ? { tag: selectedTag.name } : {})
          };
          
          const response = await api.getSavedArticles(params);
          setArticles(response.data.articles);
          setLoading(false);
          // After fetching, set shouldFetchArticles to false
          setShouldFetchArticles(false);
          return;
        }
        
        // Build filter params
        const params: {
          limit: number;
          page: number;
          feedId?: string;
          tag?: string;
        } = { limit: 50, page: 1 };
        if (selectedFeed) params.feedId = selectedFeed._id;
        if (selectedTag) params.tag = selectedTag.name;
        
        const response = await api.getArticles(params);
        setArticles(response.data.articles);
        
        setLoading(false);
        // After fetching, set shouldFetchArticles to false
        setShouldFetchArticles(false);
      } catch (err: unknown) {
        const error = err as ApiError;
        console.error('Error fetching articles:', error);
        setError('Failed to fetch articles. Please try again later.');
        setLoading(false);
      }
    };
    
    if (shouldFetchArticles) {
      fetchFilteredArticles();
    }
  }, [selectedFeed, selectedTag, searchQuery, isPublicRoute, shouldFetchArticles]);
  
  // Compute filtered articles based on selected feed, tag, search query, and time filter
  const filteredArticles = React.useMemo(() => {
    let filtered = [...articles];
    
    // We don't need to filter by selectedFeed or selectedTag anymore
    // since we're fetching filtered articles from the API
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.description.toLowerCase().includes(query)
      );
    }
    
    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (timeFilter) {
        case '24h':
          cutoffDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
      }
      
      filtered = filtered.filter(article => {
        const publishDate = new Date(article.publishDate);
        return publishDate >= cutoffDate;
      });
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
  }, [articles, searchQuery, timeFilter]);

  const addFeed = async (feedData: { url: string, category: string, tags?: string[] }) => {
    try {
      setLoading(true);
      const response = await api.createFeed(feedData);
      
      // Add the new feed to state
      setFeeds(prev => [...prev, response.data]);
      
      // We need to fetch from API because this is a new feed
      setShouldFetchArticles(true);
      
      // Fetch updated articles that include articles from the new feed
      const articlesParams: ArticleParams = { limit: 50, page: 1 };
      
      // If we're going to select this feed immediately, get its articles
      articlesParams.feedId = response.data._id;
      
      const articlesRes = await api.getArticles(articlesParams);
      setArticles(articlesRes.data.articles);
      
      // Reset the fetch flag after adding
      setShouldFetchArticles(false);
      
      setLoading(false);
      
      toast({
        title: "Feed added",
        description: `${response.data.title} has been added to your feeds`,
      });
      
      // Return the new feed so it can be selected
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
      throw err;
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
    // Clear the saved view flag when selecting a feed
    setIsSavedView(false);
    // Set shouldFetchArticles to true to force a fresh fetch from the API
    setShouldFetchArticles(true);
  };

  const selectTag = (tag: Tag | null) => {
    setSelectedTag(tag);
    setSelectedFeed(null); // Clear feed selection when selecting a tag
    // Clear the saved view flag when selecting a tag
    setIsSavedView(false);
    
    if (tag) {
      // Set a custom loading toast when selecting a tag
      toast({
        title: `Loading articles tagged with "${tag.name}"`,
        description: "Finding relevant content..."
      });
    }
    
    // Set shouldFetchArticles to true to force a fresh fetch from the API
    setShouldFetchArticles(true);
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
      await api.toggleSavedArticle(articleId);
      
      // If we're currently viewing saved articles and the article was unsaved,
      // we need to refresh the list to remove it from view
      if (isSavedView && wasArticleSaved) {
        try {
          const response = await api.getSavedArticles({ limit: 50, page: 1 });
          setArticles(response.data.articles);
        } catch (refreshErr) {
          console.error('Error refreshing saved articles:', refreshErr);
        }
      }
      
      toast({
        title: wasArticleSaved ? "Article removed from saved" : "Article saved",
        description: wasArticleSaved 
          ? "The article has been removed from your saved items" 
          : "The article has been added to your saved items",
      });
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
      
      // Show first loading toast - creating tag
      toast({
        title: "Tag added",
        description: `Tag "${name}" has been created`,
      });
      
      // Show scanning toast - tell user we're analyzing articles
      toast({
        title: "Scanning articles",
        description: `Analyzing articles for "${name}" content...`,
      });
      
      // Now scan articles for relevance to this tag
      try {
        const scanResponse = await api.scanArticlesForTag(name);
        
        // If articles were tagged, update articles in state with new tag assignments
        if (scanResponse.data.taggedArticles && scanResponse.data.taggedArticles.length > 0) {
          // Update articles in state that now have this tag
          setArticles(prev => 
            prev.map(article => {
              // Check if this article was tagged during scanning
              if (scanResponse.data.taggedArticles.includes(article._id)) {
                // Add the tag to this article if it doesn't already have it
                const updatedTags = article.tags || [];
                if (!updatedTags.includes(name.toLowerCase())) {
                  updatedTags.push(name.toLowerCase());
                }
                return { ...article, tags: updatedTags };
              }
              return article;
            })
          );
          
          // Show success toast with count of tagged articles
          toast({
            title: "Articles tagged",
            description: `Found ${scanResponse.data.taggedArticles.length} articles related to "${name}"`,
          });
        } else {
          // No articles found with matching content
          toast({
            title: "No matches found",
            description: `No articles found containing "${name}" content`,
          });
        }
      } catch (scanErr) {
        console.error('Error scanning articles for tag:', scanErr);
        toast({
          title: "Error analyzing articles",
          description: "Failed to scan articles for tag relevance",
          variant: "destructive",
        });
      }
      
      setLoading(false);
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
            ? { ...response.data.feed, hasNewContent: false } // Clear the hasNewContent flag after refresh
            : feed
        )
      );
      
      // Ensure we're showing the refreshed feed's content
      if (selectedFeed && selectedFeed._id === id) {
        // Directly update the selected feed in state
        setSelectedFeed({ ...response.data.feed, hasNewContent: false });
      }
      
      // Set shouldFetchArticles to true to force fetching from the API
      setShouldFetchArticles(true);
      
      // Fetch updated articles - if we're viewing this feed, get its articles specifically
      const articlesParams: ArticleParams = { 
        limit: 50, 
        page: 1
      };
      
      if (selectedFeed && selectedFeed._id === id) {
        articlesParams.feedId = id;
      } else if (selectedFeed) {
        articlesParams.feedId = selectedFeed._id;
      } else if (selectedTag) {
        articlesParams.tag = selectedTag.name;
      }
      
      const articlesRes = await api.getArticles(articlesParams);
      setArticles(articlesRes.data.articles);
      
      setLoading(false);
      // After fetching, set shouldFetchArticles back to false
      setShouldFetchArticles(false);
      
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

  // Check if a feed has new content available
  const checkForNewContent = useCallback(async (id: string) => {
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
        
        // Update selected feed if it's the one being checked
        if (selectedFeed && selectedFeed._id === id) {
          setSelectedFeed(prev => prev ? { ...prev, hasNewContent: true } : null);
        }
      }
    } catch (err) {
      console.error('Error checking for new content:', err);
      // Don't show error toast to avoid annoying the user for background operations
    }
  }, [selectedFeed]);

  // Clear the new content flag for a feed
  const clearNewContentFlag = useCallback((id: string) => {
    setFeeds(prev => 
      prev.map(feed => 
        feed._id === id 
          ? { ...feed, hasNewContent: false }
          : feed
      )
    );
    
    // Update selected feed if it's the one being cleared
    if (selectedFeed && selectedFeed._id === id) {
      setSelectedFeed(prev => prev ? { ...prev, hasNewContent: false } : null);
    }
  }, [selectedFeed]);

  // Handle viewing saved articles
  const handleSavedArticles = useCallback(() => {
    // Clear feed and tag selection
    setSelectedFeed(null);
    setSelectedTag(null);
    
    // Set isSavedView flag to true BEFORE fetching
    setIsSavedView(true);
    
    // Clear any existing search query
    setSearchQuery('');
    
    // We'll set loading state here before the async call
    setLoading(true);
    
    // Fetch saved articles
    const fetchSavedArticles = async () => {
      try {
        // Don't need to set loading again since we did it above
        const response = await api.getSavedArticles({ limit: 50, page: 1 });
        
        // Directly set the articles from the saved articles response
        // and THEN reset the shouldFetchArticles flag
        setArticles(response.data.articles);
        setShouldFetchArticles(false);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching saved articles:', err);
        setLoading(false);
        setShouldFetchArticles(false);
        setError('Failed to fetch saved articles. Please try again later.');
      }
    };
    
    // Execute the fetch function immediately
    fetchSavedArticles();
  }, []);

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