import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useFeed } from '@/hooks/useFeed';
import { Rss, Plus } from 'lucide-react';
import { TagInput } from './TagInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AddFeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// List of suggested feeds by category
const suggestedFeeds = {
  Technology: [
    { title: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { title: 'Wired', url: 'https://www.wired.com/feed/rss' },
    { title: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { title: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
    { title: 'Hacker News', url: 'https://news.ycombinator.com/rss' }
  ],
  News: [
    { title: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
    { title: 'CNN', url: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
    { title: 'Reuters', url: 'https://www.reutersagency.com/feed/' },
    { title: 'The Guardian', url: 'https://www.theguardian.com/international/rss' },
    { title: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' }
  ],
  Science: [
    { title: 'Nature', url: 'https://www.nature.com/nature.rss' },
    { title: 'Science Magazine', url: 'https://www.science.org/rss/news_current.xml' },
    { title: 'Scientific American', url: 'https://rss.sciam.com/ScientificAmerican-Global' },
    { title: 'NASA', url: 'https://www.nasa.gov/feed/' },
    { title: 'New Scientist', url: 'https://www.newscientist.com/feed/home/?cmpid=RSS' }
  ],
  Finance: [
    { title: 'Bloomberg', url: 'https://www.bloomberg.com/feed' },
    { title: 'Financial Times', url: 'https://www.ft.com/rss/home/uk' },
    { title: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
    { title: 'The Economist', url: 'https://www.economist.com/finance-and-economics/rss.xml' },
    { title: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' }
  ],
  Politics: [
    { title: 'Politico', url: 'https://www.politico.com/rss/politicopicks.xml' },
    { title: 'The Hill', url: 'https://thehill.com/news/feed/' },
    { title: 'Washington Post - Politics', url: 'https://feeds.washingtonpost.com/rss/politics' },
    { title: 'FiveThirtyEight', url: 'https://fivethirtyeight.com/politics/feed/' },
    { title: 'BBC Politics', url: 'https://feeds.bbci.co.uk/news/politics/rss.xml' }
  ]
};

export const AddFeedDialog: React.FC<AddFeedDialogProps> = ({ open, onOpenChange }) => {
  const { addFeed, categories, tags, loading, selectFeed } = useFeed();
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!url.trim()) {
      setError('Please enter a valid RSS feed URL');
      return;
    }
    
    // Simple URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('URL must start with http:// or https://');
      return;
    }
    
    try {
      const newFeed = await addFeed({
        url,
        category: category || 'Uncategorized',
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
      
      // Reset form
      setUrl('');
      setCategory('');
      setSelectedTags([]);
      onOpenChange(false);
      
      // Select the newly added feed to display its content immediately
      if (newFeed) {
        selectFeed(newFeed);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to add feed');
    }
  };

  const handleClose = () => {
    // Reset form when dialog is closed
    setUrl('');
    setCategory('');
    setSelectedTags([]);
    setError(null);
    setActiveTab('manual');
    setSelectedCategory(null);
    onOpenChange(false);
  };

  const handleSuggestedFeedSelect = (suggestedUrl: string, suggestedTitle: string) => {
    setUrl(suggestedUrl);
    // Switch to manual tab to let user confirm or modify details
    setActiveTab('manual');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" />
            Add New RSS Feed
          </DialogTitle>
          <DialogDescription>
            Add an RSS feed to your collection manually or choose from our suggestions.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="suggested">Suggested Feeds</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="url">RSS Feed URL</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/feed.xml"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Tags (Optional)</Label>
                  <TagInput 
                    availableTags={tags.map(tag => tag.name)} 
                    selectedTags={selectedTags}
                    onChange={setSelectedTags}
                    inForm={true}
                  />
                </div>
                
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Feed'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="suggested">
            <div className="py-2">
              <div className="grid gap-2 mb-4">
                <Label>Select Category</Label>
                <Select value={selectedCategory || ''} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category for suggestions" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(suggestedFeeds).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedCategory && (
                <div className="grid gap-3 max-h-[300px] overflow-y-auto pb-2">
                  {suggestedFeeds[selectedCategory as keyof typeof suggestedFeeds].map((feed, index) => (
                    <Card key={index} className="hover:bg-secondary/40 transition-colors">
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">{feed.title}</CardTitle>
                        <CardDescription className="text-xs truncate">{feed.url}</CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-0 pb-3">
                        <Button 
                          size="sm" 
                          onClick={() => handleSuggestedFeedSelect(feed.url, feed.title)}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Select This Feed
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>Can't find what you're looking for? Switch to manual entry to add a custom feed URL.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
