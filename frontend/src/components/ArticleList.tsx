import React from 'react';
import { useFeed } from '@/hooks/useFeed';
import { ArticleCard } from './ArticleCard';
import { Button } from '@/components/ui/button';
import { TimeFilterOption } from '@/context/FeedContext';
import { Calendar } from 'lucide-react';

export const ArticleList: React.FC = () => {
  const { 
    filteredArticles, 
    selectedFeed, 
    selectedTag, 
    searchQuery,
    timeFilter,
    setTimeFilter
  } = useFeed();

  const getTitle = () => {
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

      {filteredArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h2 className="text-xl font-semibold mb-2">No articles found</h2>
          <p className="text-muted-foreground mb-4">
            {searchQuery
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};
