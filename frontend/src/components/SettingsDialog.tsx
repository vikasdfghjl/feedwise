import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Rss, Tag, X, AlertCircle } from 'lucide-react';
import { useFeed } from '@/hooks/useFeed';
import { cn } from '@/lib/utils';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const { feeds, tags, removeFeed, removeTag } = useFeed();
  const [filterText, setFilterText] = useState('');
  const [deletingFeedId, setDeletingFeedId] = useState<string | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  const filteredFeeds = feeds.filter(feed => 
    feed.title.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleRemoveFeed = (feedId: string) => {
    removeFeed(feedId);
    setDeletingFeedId(null);
  };

  const handleRemoveTag = (tagId: string) => {
    removeTag(tagId);
    setDeletingTagId(null);
  };

  const toggleDeleteFeed = (feedId: string | null) => {
    setDeletingFeedId(feedId);
    // Reset tag deletion if active
    if (feedId !== null) {
      setDeletingTagId(null);
    }
  };

  const toggleDeleteTag = (tagId: string | null) => {
    setDeletingTagId(tagId);
    // Reset feed deletion if active
    if (tagId !== null) {
      setDeletingFeedId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>
            Manage your RSS feeds and tags
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Input
            placeholder="Filter..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="mb-4"
          />
          
          <Tabs defaultValue="feeds" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="feeds" className="flex items-center gap-2">
                <Rss className="h-4 w-4" />
                RSS Feeds
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="feeds">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {filteredFeeds.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No feeds found</p>
                  ) : (
                    filteredFeeds.map((feed) => (
                      <div 
                        key={feed._id}
                        className="relative overflow-hidden rounded-md border"
                      >
                        <div className="flex items-center justify-between gap-2 p-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {feed.favicon ? (
                              <img 
                                src={feed.favicon} 
                                alt={feed.title} 
                                className="h-5 w-5 object-contain" 
                              />
                            ) : (
                              <Rss className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="truncate">
                              <p className="font-medium truncate">{feed.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{feed.url}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 z-10"
                            onClick={() => toggleDeleteFeed(feed._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Delete confirmation slide-in panel */}
                        <div 
                          className={cn(
                            "absolute top-0 right-0 bottom-0 w-1/2 flex flex-col justify-center bg-destructive text-destructive-foreground p-3 transition-transform duration-200 ease-in-out",
                            deletingFeedId === feed._id ? "translate-x-0" : "translate-x-full"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5" />
                            <p className="font-medium text-sm">Delete?</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleDeleteFeed(null)}
                              className="h-7 px-2 bg-destructive/20 hover:bg-destructive/30 border-0"
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRemoveFeed(feed._id)}
                              className="h-7 px-2 text-destructive-foreground bg-destructive border-destructive-foreground/20 hover:bg-destructive/80"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="tags">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {filteredTags.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No tags found</p>
                  ) : (
                    filteredTags.map((tag) => (
                      <div 
                        key={tag._id}
                        className="relative overflow-hidden rounded-md border"
                      >
                        <div className="flex items-center justify-between gap-2 p-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-4 w-4 rounded-full" 
                              style={{ backgroundColor: tag.color }}
                            />
                            <p className="font-medium">#{tag.name}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 z-10"
                            onClick={() => toggleDeleteTag(tag._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Delete confirmation slide-in panel */}
                        <div 
                          className={cn(
                            "absolute top-0 right-0 bottom-0 w-1/2 flex flex-col justify-center bg-destructive text-destructive-foreground p-3 transition-transform duration-200 ease-in-out",
                            deletingTagId === tag._id ? "translate-x-0" : "translate-x-full"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5" />
                            <p className="font-medium text-sm">Delete?</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleDeleteTag(null)}
                              className="h-7 px-2 bg-destructive/20 hover:bg-destructive/30 border-0"
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRemoveTag(tag._id)}
                              className="h-7 px-2 text-destructive-foreground bg-destructive border-destructive-foreground/20 hover:bg-destructive/80"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};