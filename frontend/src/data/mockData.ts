
import { Article, Category, Feed, Tag } from "@/types";

export const mockCategories: Category[] = [
  { id: "1", name: "News" },
  { id: "2", name: "Technology" },
  { id: "3", name: "Business" },
  { id: "4", name: "Science" },
  { id: "5", name: "Health" }
];

export const mockFeeds: Feed[] = [
  {
    id: "1",
    title: "BBC News",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    favicon: "https://www.bbc.co.uk/favicon.ico",
    category: "News",
    tags: ["news", "world"],
    lastUpdated: "2023-04-06T08:30:00Z",
    unreadCount: 12
  },
  {
    id: "2",
    title: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    favicon: "https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png",
    category: "Technology",
    tags: ["tech", "startups"],
    lastUpdated: "2023-04-06T09:15:00Z",
    unreadCount: 8
  },
  {
    id: "3",
    title: "Wired",
    url: "https://www.wired.com/feed/rss",
    favicon: "https://www.wired.com/favicon.ico",
    category: "Technology",
    tags: ["tech", "gadgets"],
    lastUpdated: "2023-04-05T23:45:00Z",
    unreadCount: 5
  },
  {
    id: "4",
    title: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    favicon: "https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395367/favicon-16x16.0.png",
    category: "Technology",
    tags: ["tech", "reviews"],
    lastUpdated: "2023-04-06T07:30:00Z",
    unreadCount: 15
  },
  {
    id: "5",
    title: "Nature",
    url: "https://www.nature.com/nature.rss",
    favicon: "https://www.nature.com/favicon.ico",
    category: "Science",
    tags: ["science", "research"],
    lastUpdated: "2023-04-04T12:00:00Z",
    unreadCount: 3
  },
  {
    id: "6",
    title: "CNN",
    url: "http://rss.cnn.com/rss/cnn_topstories.rss",
    favicon: "https://www.cnn.com/favicon.ico",
    category: "News",
    tags: ["news", "us"],
    lastUpdated: "2023-04-06T10:00:00Z",
    unreadCount: 20
  }
];

export const mockTags: Tag[] = [
  { id: "1", name: "news", color: "#3b82f6" },
  { id: "2", name: "tech", color: "#10b981" },
  { id: "3", name: "world", color: "#6366f1" },
  { id: "4", name: "startups", color: "#f59e0b" },
  { id: "5", name: "gadgets", color: "#ef4444" },
  { id: "6", name: "reviews", color: "#8b5cf6" },
  { id: "7", name: "science", color: "#ec4899" },
  { id: "8", name: "research", color: "#14b8a6" },
  { id: "9", name: "us", color: "#f97316" },
];

export const mockArticles: Article[] = [
  {
    id: "a1",
    title: "AI assistants are transforming the way we research and consume content",
    description: "Artificial intelligence assistants are revolutionizing how people find, filter, and engage with information online.",
    url: "https://example.com/ai-assistants",
    feedId: "2",
    feedTitle: "TechCrunch",
    feedFavicon: "https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png",
    author: "Emily Chen",
    publishDate: "2023-04-06T07:30:00Z",
    tags: ["tech", "ai"],
    imageUrl: "https://images.unsplash.com/photo-1677442135135-5718d363c661?q=80&w=1932&auto=format&fit=crop",
    isRead: false,
    isSaved: true,
    relevanceScore: 0.92
  },
  {
    id: "a2",
    title: "Global climate agreement reached after marathon negotiations",
    description: "World leaders have agreed to ambitious new targets to reduce carbon emissions following two weeks of intense discussions.",
    url: "https://example.com/climate-agreement",
    feedId: "1",
    feedTitle: "BBC News",
    feedFavicon: "https://www.bbc.co.uk/favicon.ico",
    author: "James Wilson",
    publishDate: "2023-04-05T22:15:00Z",
    tags: ["news", "world", "climate"],
    imageUrl: "https://images.unsplash.com/photo-1569413978926-8d97a1dc7a61?q=80&w=2070&auto=format&fit=crop",
    isRead: false,
    isSaved: false,
    relevanceScore: 0.85
  },
  {
    id: "a3",
    title: "New study reveals benefits of intermittent fasting",
    description: "Researchers have found evidence suggesting that intermittent fasting may help improve metabolic health and extend lifespan.",
    url: "https://example.com/intermittent-fasting",
    feedId: "5",
    feedTitle: "Nature",
    feedFavicon: "https://www.nature.com/favicon.ico",
    author: "Dr. Sarah Johnson",
    publishDate: "2023-04-04T14:45:00Z",
    tags: ["science", "health", "research"],
    imageUrl: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?q=80&w=2070&auto=format&fit=crop",
    isRead: true,
    isSaved: true,
    relevanceScore: 0.78
  },
  {
    id: "a4",
    title: "Tech giant unveils revolutionary new smartphone design",
    description: "A major technology company has announced a groundbreaking smartphone that features a completely new form factor.",
    url: "https://example.com/new-smartphone",
    feedId: "4",
    feedTitle: "The Verge",
    feedFavicon: "https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395367/favicon-16x16.0.png",
    author: "Alex Rivera",
    publishDate: "2023-04-06T09:00:00Z",
    tags: ["tech", "gadgets", "reviews"],
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080&auto=format&fit=crop",
    isRead: false,
    isSaved: false,
    relevanceScore: 0.89
  },
  {
    id: "a5",
    title: "Breakthrough in nuclear fusion energy announced",
    description: "Scientists have achieved a significant milestone in nuclear fusion research, bringing clean, limitless energy closer to reality.",
    url: "https://example.com/fusion-breakthrough",
    feedId: "5",
    feedTitle: "Nature",
    feedFavicon: "https://www.nature.com/favicon.ico",
    author: "Prof. Robert Chang",
    publishDate: "2023-04-05T11:30:00Z",
    tags: ["science", "energy", "research"],
    imageUrl: "https://images.unsplash.com/photo-1624969862293-b749659a85f4?q=80&w=2070&auto=format&fit=crop",
    isRead: false,
    isSaved: true,
    relevanceScore: 0.95
  },
  {
    id: "a6",
    title: "Startup raises $50M to scale sustainable packaging solutions",
    description: "An innovative startup has secured substantial funding to expand its biodegradable packaging technology worldwide.",
    url: "https://example.com/sustainable-packaging",
    feedId: "2",
    feedTitle: "TechCrunch",
    feedFavicon: "https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png",
    author: "Michael Brown",
    publishDate: "2023-04-06T08:15:00Z",
    tags: ["tech", "startups", "sustainability"],
    imageUrl: "https://images.unsplash.com/photo-1605600659453-219844eda65e?q=80&w=2070&auto=format&fit=crop",
    isRead: true,
    isSaved: false,
    relevanceScore: 0.82
  },
  {
    id: "a7",
    title: "Global markets react to central bank interest rate decision",
    description: "Financial markets worldwide have responded to a major central bank's unexpected change in interest rate policy.",
    url: "https://example.com/market-reaction",
    feedId: "6",
    feedTitle: "CNN",
    feedFavicon: "https://www.cnn.com/favicon.ico",
    author: "Jennifer Kim",
    publishDate: "2023-04-06T06:45:00Z",
    tags: ["news", "finance", "economy"],
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop",
    isRead: false,
    isSaved: false,
    relevanceScore: 0.79
  },
  {
    id: "a8",
    title: "New wearable device monitors health biomarkers in real-time",
    description: "A breakthrough wearable technology can now track multiple health indicators continuously, providing early warning of potential issues.",
    url: "https://example.com/wearable-health",
    feedId: "3",
    feedTitle: "Wired",
    feedFavicon: "https://www.wired.com/favicon.ico",
    author: "Sophia Martinez",
    publishDate: "2023-04-05T16:20:00Z",
    tags: ["tech", "health", "gadgets"],
    imageUrl: "https://images.unsplash.com/photo-1486649961855-75838619c23e?q=80&w=2070&auto=format&fit=crop",
    isRead: false,
    isSaved: true,
    relevanceScore: 0.88
  }
];
