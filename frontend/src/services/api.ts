import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    // Handle unauthorized errors (token expired)
    if (response && response.status === 401) {
      console.log('401 Unauthorized response detected:', response.config.url);
      localStorage.removeItem('token');
      
      // Prevent redirect loop by checking current location
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ===== Auth API =====
export const loginUser = (email: string, password: string) => 
  api.post('/users/login', { email, password });

export const registerUser = (name: string, email: string, password: string) => 
  api.post('/users/register', { name, email, password });

export const getUserProfile = () => 
  api.get('/users/profile');

// ===== Categories API =====
export const getCategories = () => 
  api.get('/categories');

export const createCategory = (name: string) => 
  api.post('/categories', { name });

// ===== Tags API =====
export const getTags = () => 
  api.get('/tags');

export const createTag = (name: string, color: string) => 
  api.post('/tags', { name, color });

export const updateTag = (id: string, data: { name?: string, color?: string }) => 
  api.put(`/tags/${id}`, data);

export const deleteTag = (id: string) => 
  api.delete(`/tags/${id}`);

// ===== Feeds API =====
export const getFeeds = () => 
  api.get('/feeds');

export const getFeedById = (id: string) => 
  api.get(`/feeds/${id}`);

export const createFeed = (feedData: { url: string, category: string, tags?: string[] }) => 
  api.post('/feeds', feedData);

export const updateFeed = (id: string, data: { title?: string, category?: string, tags?: string[] }) => 
  api.put(`/feeds/${id}`, data);

export const deleteFeed = (id: string) => 
  api.delete(`/feeds/${id}`);

export const refreshFeed = (id: string) => 
  api.post(`/feeds/${id}/refresh`);

export const checkFeedForNewContent = (id: string) =>
  api.get(`/feeds/${id}/check-new-content`);

// ===== Articles API =====
export const getArticles = (params?: { 
  page?: number, 
  limit?: number, 
  feedId?: string, 
  tag?: string, 
  isRead?: boolean, 
  isSaved?: boolean,
  source?: string
}) => api.get('/articles', { params });

export const getSavedArticles = (params?: { 
  page?: number, 
  limit?: number, 
  feedId?: string, 
  tag?: string, 
  isRead?: boolean
}) => api.get('/articles/saved', { params });

export const getArticleById = (id: string) => 
  api.get(`/articles/${id}`);

export const markArticleAsRead = (id: string) => 
  api.put(`/articles/${id}/read`);

export const markArticleAsUnread = (id: string) => 
  api.put(`/articles/${id}/unread`);

export const toggleSavedArticle = (id: string) => 
  api.put(`/articles/${id}/save`);

export const updateArticleTags = (id: string, tags: string[]) => 
  api.put(`/articles/${id}/tags`, { tags });

export default api;