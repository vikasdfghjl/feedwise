import React from 'react';
import { useFeed } from '@/hooks/useFeed';
import { ArticleCard } from './ArticleCard';
import { Button } from '@/components/ui/button';
import { TimeFilterOption } from '@/context/FeedContext';
import { Calendar } from 'lucide-react';
import { ViewType } from '@/pages/Dashboard';

interface ArticleListProps {
  viewType: ViewType;
}

export const ArticleList: React.FC<ArticleListProps> = ({ viewType }) => {
  const { 
    filteredArticles, 
    selectedFeed, 
    selectedTag, 
    searchQuery,
    timeFilter,
    setTimeFilter,
    isSavedView
  } = useFeed();

  const getTitle = () => {
    if (isSavedView) {
      return 'Saved Articles';
    }
    if (searchQuery) {
      return `Search results for "${searchQuery}"`;
    }
    if (selectedFeed) {
      return selectedFeed.title;
    }
    if (selectedTag) {
      return `#${selectedTag.name}`;
    }
    return 'All Articles';
  };

  const handleTimeFilterChange = (filter: TimeFilterOption) => {
    setTimeFilter(filter);
  };

  // Render articles based on view type
  const renderArticles = () => {
    if (filteredArticles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h2 className="text-xl font-semibold mb-2">No articles found</h2>
          <p className="text-muted-foreground mb-4">
            {isSavedView
              ? "You haven't saved any articles yet. Click the bookmark icon on articles to save them."
              : searchQuery
              ? "Try adjusting your search query"
              : selectedFeed
              ? "This feed doesn't have any articles yet"
              : selectedTag
              ? "No articles with this tag"
              : timeFilter !== 'all'
              ? `No articles in the selected time period`
              : "Start by adding some RSS feeds"}
          </p>
        </div>
      );
    }

    switch (viewType) {
      case 'card':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        );

      case 'list':
        return (
          <div className="flex flex-col space-y-4">
            {filteredArticles.map((article) => (
              <div key={article._id} className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex flex-col">
                  {article.imageUrl && (
                    <div className="mb-4 h-[200px]">
                      <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover rounded-md" />
                    </div>
                  )}
                  <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    {new Date(article.publishDate).toLocaleDateString()} • {article.feedTitle}
                  </p>
                  <p className="line-clamp-3 text-gray-600">{article.description}</p>
                </a>
              </div>
            ))}
          </div>
        );

      case 'compact':
        return (
          <div className="flex flex-col space-y-2">
            {filteredArticles.map((article) => (
              <div key={article._id} className="flex items-center p-2 border rounded-md hover:bg-gray-50 transition-colors">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                  {article.imageUrl && (
                    <div className="mr-4 h-12 w-12 flex-shrink-0">
                      <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover rounded-md" />
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <h3 className="font-medium text-sm truncate">{article.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(article.publishDate).toLocaleDateString()} • {article.feedTitle}
                    </p>
                  </div>
                </a>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{getTitle()}</h1>
        </div>

        {/* Time filter options */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
          <div className="flex space-x-1">
            <Button 
              variant={timeFilter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleTimeFilterChange('all')}
            >
              All Time
            </Button>
            <Button 
              variant={timeFilter === '24h' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleTimeFilterChange('24h')}
            >
              Last 24h
            </Button>
            <Button 
              variant={timeFilter === '7d' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleTimeFilterChange('7d')}
            >
              Last 7 Days
            </Button>
            <Button 
              variant={timeFilter === '30d' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleTimeFilterChange('30d')}
            >
              Last 30 Days
            </Button>
          </div>
        </div>
      </div>

      {renderArticles()}
    </div>
  );
};
