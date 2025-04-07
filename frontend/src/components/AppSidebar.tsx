import React, { useState } from 'react';
import { Plus, Rss, Tag, Bookmark, Settings, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeed } from '@/hooks/useFeed';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { AddFeedDialog } from './AddFeedDialog';
import { TagManagement } from './TagManagement';

export const AppSidebar = () => {
  const { 
    feeds, 
    tags, 
    selectedFeed, 
    selectedTag,
    selectFeed, 
    selectTag,
    searchQuery,
    setSearchQuery,
    refreshFeed,
    loading
  } = useFeed();
  const { state, toggleSidebar } = useSidebar();
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [filterText, setFilterText] = useState('');

  const filteredFeeds = feeds.filter(feed => 
    feed.title.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleRefreshFeed = async (feedId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await refreshFeed(feedId);
  };

  const handleSavedArticles = () => {
    selectFeed(null);
    selectTag(null);
    setSearchQuery('saved:true');
  };

  return (
    <>
      <Sidebar className="border-r shadow-sm">
        <SidebarHeader className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Rss className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">FeedWise</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="focus:outline-none"
            aria-label={state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {state === 'expanded' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </SidebarHeader>
        
        <SidebarContent>
          <div className="px-4 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="text-sm font-semibold">My Feeds</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowAddFeed(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="px-4 mb-2">
            <Input
              placeholder="Filter..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          
          <ScrollArea className="h-[calc(100vh-280px)]">
            <SidebarGroup>
              <SidebarGroupContent>
                {filteredFeeds.map((feed) => (
                  <div
                    key={feed._id}
                    className={`flex items-center gap-2 w-full p-2 rounded-md text-left text-sm ${
                      selectedFeed?._id === feed._id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <button
                      onClick={() => selectFeed(feed)}
                      className="flex items-center gap-2 w-full"
                    >
                      {feed.favicon ? (
                        <img 
                          src={feed.favicon} 
                          alt={feed.title} 
                          className="h-4 w-4 object-contain" 
                        />
                      ) : (
                        <Rss className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="truncate">{feed.title}</span>
                      {feed.unreadCount ? (
                        <Badge variant="secondary" className="ml-auto">
                          {feed.unreadCount}
                        </Badge>
                      ) : null}
                    </button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-auto"
                      onClick={(e) => handleRefreshFeed(feed._id, e)}
                      disabled={loading}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="px-4 py-2 flex justify-between items-center">
                <span>Tags</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => setShowTagManagement(true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {filteredTags.map((tag) => (
                  <button
                    key={tag._id}
                    onClick={() => selectTag(tag)}
                    className={`flex items-center gap-2 w-full p-2 rounded-md text-left text-sm ${
                      selectedTag?._id === tag._id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="truncate">#{tag.name}</span>
                  </button>
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>
        
        <SidebarFooter className="border-t p-4">
          <div className="flex justify-around">
            <Button 
              variant="ghost" 
              size="icon" 
              title="Saved Articles" 
              onClick={handleSavedArticles}
            >
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              title="Manage Tags"
              onClick={() => setShowTagManagement(true)}
            >
              <Tag className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      
      {/* Expand button that appears when sidebar is collapsed */}
      {state === 'collapsed' && (
        <div className="absolute left-2 top-4 z-50">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleSidebar} 
            className="rounded-full h-8 w-8 shadow-md border border-border bg-background"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <AddFeedDialog open={showAddFeed} onOpenChange={setShowAddFeed} />
      <TagManagement open={showTagManagement} onOpenChange={setShowTagManagement} />
    </>
  );
};
