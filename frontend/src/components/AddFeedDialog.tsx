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
import { Rss, Plus, ExternalLink } from 'lucide-react';
import { TagInput } from './TagInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddFeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Expanded list of suggested feeds by category
const suggestedFeeds = {
  Technology: [
    { title: 'TechCrunch', url: 'https://techcrunch.com/feed/', description: 'Technology industry news, analysis, and startups coverage' },
    { title: 'Wired', url: 'https://www.wired.com/feed/rss', description: 'Latest on technology, science, business, and culture' },
    { title: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', description: 'Covering the intersection of technology, science, art, and culture' },
    { title: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', description: 'Tech news, reviews, and analysis' },
    { title: 'Hacker News', url: 'https://news.ycombinator.com/rss', description: 'Social news website focusing on computer science and entrepreneurship' },
    { title: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', description: 'Technology news and innovations from MIT' },
    { title: 'CNET', url: 'https://www.cnet.com/rss/all/', description: 'Tech product reviews, news, prices and more' },
    { title: 'Slashdot', url: 'http://rss.slashdot.org/Slashdot/slashdotMain', description: 'News for nerds, stuff that matters' },
    { title: 'Engadget', url: 'https://www.engadget.com/rss.xml', description: 'Multilingual technology blog with daily coverage' },
    { title: 'ReadWrite', url: 'https://readwrite.com/feed/', description: 'Web technology trends and news' }
  ],
  News: [
    { title: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', description: 'Latest news from the BBC' },
    { title: 'CNN', url: 'http://rss.cnn.com/rss/cnn_topstories.rss', description: 'Breaking news, US, world, weather, entertainment & video news' },
    { title: 'Reuters', url: 'https://www.reutersagency.com/feed/', description: 'Business, financial, national and international news' },
    { title: 'The Guardian', url: 'https://www.theguardian.com/international/rss', description: 'Latest international news, sport and comment' },
    { title: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', description: 'National Public Radio: News & Analysis, World, US, Music & Arts' },
    { title: 'Associated Press', url: 'https://feeds.feedburner.com/associatedpress', description: 'Breaking news and journalism' },
    { title: 'The New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', description: 'Breaking news, world news & multimedia' },
    { title: 'Washington Post', url: 'https://feeds.washingtonpost.com/rss/world', description: 'Breaking news and analysis on politics' },
    { title: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', description: 'News, analysis from the Middle East & worldwide' },
    { title: 'ABC News', url: 'https://abcnews.go.com/abcnews/topstories', description: 'Latest headlines and video news clips' }
  ],
  Science: [
    { title: 'Nature', url: 'https://www.nature.com/nature.rss', description: 'International weekly journal of science' },
    { title: 'Science Magazine', url: 'https://www.science.org/rss/news_current.xml', description: 'Leading outlet for scientific news, commentary, and research' },
    { title: 'Scientific American', url: 'https://rss.sciam.com/ScientificAmerican-Global', description: 'Expert coverage of science and technology' },
    { title: 'NASA', url: 'https://www.nasa.gov/feed/', description: 'Latest news from America\'s space agency' },
    { title: 'New Scientist', url: 'https://www.newscientist.com/feed/home/?cmpid=RSS', description: 'Weekly science and technology magazine' },
    { title: 'PLOS Biology', url: 'https://journals.plos.org/plosbiology/feed/atom', description: 'Open-access journal with peer-reviewed research' },
    { title: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml', description: 'Breaking news about the latest scientific discoveries' },
    { title: 'Smithsonian Magazine', url: 'https://www.smithsonianmag.com/rss/latest_articles/', description: 'Covers science, history, art, popular culture and innovation' },
    { title: 'National Geographic', url: 'https://www.nationalgeographic.com/pages/article/rss', description: 'Exploration and adventure across science, geography, history and culture' },
    { title: 'Physics World', url: 'https://physicsworld.com/feed/', description: 'News on physics research, education, and industry' }
  ],
  Finance: [
    { title: 'Bloomberg', url: 'https://www.bloomberg.com/feed', description: 'Business and financial market news' },
    { title: 'Financial Times', url: 'https://www.ft.com/rss/home/uk', description: 'World business, finance, economic, and political news' },
    { title: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', description: 'Stock market, business, and financial news' },
    { title: 'The Economist', url: 'https://www.economist.com/finance-and-economics/rss.xml', description: 'Finance and economic analysis and insight' },
    { title: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', description: 'Financial news, data and commentary' },
    { title: 'Forbes', url: 'https://www.forbes.com/business/feed/', description: 'Business, investing, technology, entrepreneurship, leadership, and lifestyle' },
    { title: 'Wall Street Journal', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', description: 'Breaking news and features on business and global economy' },
    { title: 'MarketWatch', url: 'https://www.marketwatch.com/rss/topstories', description: 'Stock market news and financial insight' },
    { title: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml', description: 'Stock market analysis, investment strategies, and income investing ideas' },
    { title: 'Barron\'s', url: 'https://www.barrons.com/feed/rssheadlines', description: 'Financial investment news, stock market updates and economic insight' }
  ],
  Politics: [
    { title: 'Politico', url: 'https://www.politico.com/rss/politicopicks.xml', description: 'Politics, policy, and political news coverage' },
    { title: 'The Hill', url: 'https://thehill.com/news/feed/', description: 'Political news from Capitol Hill' },
    { title: 'Washington Post - Politics', url: 'https://feeds.washingtonpost.com/rss/politics', description: 'Latest political news and analysis' },
    { title: 'FiveThirtyEight', url: 'https://fivethirtyeight.com/politics/feed/', description: 'Data-driven political analysis' },
    { title: 'BBC Politics', url: 'https://feeds.bbci.co.uk/news/politics/rss.xml', description: 'Political news from the BBC' },
    { title: 'NPR Politics', url: 'https://feeds.npr.org/1014/rss.xml', description: 'Breaking news and analysis on U.S. politics' },
    { title: 'Axios', url: 'https://api.axios.com/feed/', description: 'Breaking news and insights on politics and policy' },
    { title: 'RealClearPolitics', url: 'https://feeds.feedburner.com/realclearpolitics/qlMj', description: 'Political news, opinion, and polls' },
    { title: 'Vox Politics', url: 'https://www.vox.com/rss/politics/index.xml', description: 'Explanatory journalism covering politics and policy' },
    { title: 'The Atlantic Politics', url: 'https://feeds.feedburner.com/AtlanticPoliticsChannel', description: 'Analysis of politics, policy, and culture' }
  ],
  Entertainment: [
    { title: 'Variety', url: 'https://variety.com/feed/', description: 'Entertainment industry news and analysis' },
    { title: 'Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed/', description: 'Film, TV, and entertainment news' },
    { title: 'Entertainment Weekly', url: 'https://ew.com/feed/', description: 'TV, movies, music, books, and pop culture' },
    { title: 'Billboard', url: 'https://www.billboard.com/feed/', description: 'Music news, reviews, and charts' },
    { title: 'Rolling Stone', url: 'https://www.rollingstone.com/feed/', description: 'Music, film, TV and political news coverage' },
    { title: 'Deadline', url: 'https://deadline.com/feed/', description: 'Breaking news about the entertainment industry' },
    { title: 'Screen Rant', url: 'https://screenrant.com/feed/', description: 'Movie and TV news, reviews and interviews' },
    { title: 'A.V. Club', url: 'https://www.avclub.com/rss', description: 'Pop culture obsessives writing for pop culture obsessives' },
    { title: 'IGN', url: 'https://feeds.feedburner.com/ign/all', description: 'Video game news, reviews, and guides' },
    { title: 'Polygon', url: 'https://www.polygon.com/rss/index.xml', description: 'Gaming news, reviews, and features' }
  ],
  Sports: [
    { title: 'ESPN', url: 'https://www.espn.com/espn/rss/news', description: 'Sports news, scores, and highlights' },
    { title: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', description: 'Sports news and coverage from around the world' },
    { title: 'Sports Illustrated', url: 'https://www.si.com/rss/si_topstories.rss', description: 'Breaking sports news, analysis and highlights' },
    { title: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines/', description: 'Latest sports news and scores' },
    { title: 'The Athletic', url: 'https://theathletic.com/feeds/rss/', description: 'In-depth sports coverage and analysis' },
    { title: 'Yahoo Sports', url: 'https://sports.yahoo.com/rss/', description: 'Sports news, opinion, scores, and standings' },
    { title: 'Bleacher Report', url: 'https://bleacherreport.com/feed', description: 'Sports culture, news and entertainment' },
    { title: 'SB Nation', url: 'https://www.sbnation.com/rss/current', description: 'Breaking sports news and fan engagement' },
    { title: 'Deadspin', url: 'https://deadspin.com/rss', description: 'Sports news without access, favor, or discretion' },
    { title: 'The Ringer', url: 'https://www.theringer.com/rss/index.xml', description: 'Sports and pop culture analysis' }
  ],
  Food: [
    { title: 'Serious Eats', url: 'https://www.seriouseats.com/feed/all', description: 'Food science, techniques, recipes and reviews' },
    { title: 'Food52', url: 'https://food52.com/feeds/daily_feed', description: 'Home cooking, recipes, and kitchen tips' },
    { title: 'Bon Appétit', url: 'https://www.bonappetit.com/feed/rss', description: 'Food culture and cooking' },
    { title: 'Epicurious', url: 'https://www.epicurious.com/feed/rss', description: 'Recipes, cooking techniques, and food trends' },
    { title: 'Eater', url: 'https://www.eater.com/rss/index.xml', description: 'Food news and dining guides' },
    { title: 'The Kitchn', url: 'https://www.thekitchn.com/main.rss', description: 'Daily food magazine with recipes and cooking advice' },
    { title: 'Saveur', url: 'https://www.saveur.com/feed/', description: 'Authentic recipes from around the world' },
    { title: 'Simply Recipes', url: 'https://www.simplyrecipes.com/feed/', description: 'Family-tested recipes and cooking resources' },
    { title: 'Smitten Kitchen', url: 'https://smittenkitchen.com/feed/', description: 'Recipes from a tiny kitchen in New York City' },
    { title: 'Taste Cooking', url: 'https://www.tastecooking.com/feed/', description: 'Cooking narratives and recipes for curious cooks' }
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
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" />
            Add New RSS Feed
          </DialogTitle>
          <DialogDescription>
            Add an RSS feed to your collection manually or choose from our suggested feeds.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="suggested">Suggested Feeds</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="flex-grow">
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
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner size="sm" color="currentColor" />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add Feed'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="suggested" className="flex-grow">
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
              <ScrollArea className="h-[400px] overflow-y-auto rounded-md border p-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2">
                  {suggestedFeeds[selectedCategory as keyof typeof suggestedFeeds].map((feed, index) => (
                    <Card key={index} className="hover:bg-secondary/40 transition-colors h-full flex flex-col">
                      <CardHeader className="py-3 flex-grow">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Rss className="h-4 w-4 text-primary" />
                          {feed.title}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {feed.description}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex flex-col gap-2 pt-0 pb-3">
                        <div className="w-full text-xs text-muted-foreground truncate">
                          {feed.url}
                        </div>
                        <div className="flex w-full gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSuggestedFeedSelect(feed.url, feed.title)}
                            className="flex-1"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Feed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="px-2"
                            onClick={() => window.open(feed.url, '_blank')}
                            title="Open feed URL in new tab"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {!selectedCategory && (
              <div className="p-8 text-center text-muted-foreground">
                <Rss className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Please select a category from the dropdown to see suggested feeds.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
