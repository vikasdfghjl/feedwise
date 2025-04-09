import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, ExternalLink, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Article } from '@/types';
import { useFeed } from '@/hooks/useFeed';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const { markAsRead, toggleSaved, getFeedById } = useFeed();
  const feed = article.feedId ? getFeedById(article.feedId) : undefined;
  const { toast } = useToast();
  
  // State for summary dialog and loading
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [articleSummary, setArticleSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  const handleClick = () => {
    markAsRead(article._id);
    window.open(article.url, '_blank');
  };
  
  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaved(article._id);
  };
  
  const handleSummarize = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the article from opening
    
    // Show loading state
    setIsLoadingSummary(true);
    setSummaryDialogOpen(true);
    
    try {
      // Get the AI summary
      const response = await api.getArticleSummary(article._id);
      setArticleSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching article summary:', error);
      toast({
        title: "Summary Error",
        description: "Failed to generate article summary. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  return (
    <>
      <Card 
        className={`article-card cursor-pointer ${
          article.isRead ? 'opacity-70' : ''
        }`}
        onClick={handleClick}
      >
        {article.imageUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-t-md">
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </div>
        )}
        
        <CardContent className={`${article.imageUrl ? 'pt-4' : 'pt-5'} pb-2`}>
          <div className="flex items-center gap-2 mb-2">
            {article.feedFavicon ? (
              <img 
                src={article.feedFavicon} 
                alt={article.feedTitle} 
                className="h-4 w-4 object-contain" 
              />
            ) : null}
            <span className="text-xs text-muted-foreground">
              {article.feedTitle || feed?.title}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(article.publishDate), { addSuffix: true })}
            </span>
          </div>
          
          <h3 className={`font-semibold mb-2 ${article.isRead ? '' : 'text-primary'}`}>
            {article.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.description}
          </p>
          
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {article.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="tag px-2 py-0 text-xs font-normal"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-0 pb-4">
          <div>
            {article.relevanceScore !== undefined && article.relevanceScore > 0.8 && (
              <Badge variant="outline" className="bg-accent/10 text-accent-foreground text-xs">
                AI Recommended
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={handleSaveToggle}
              title="Save Article"
            >
              {article.isSaved ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            
            {/* Summarize button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={handleSummarize}
              title="AI Summary"
            >
              <FileText className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={handleClick}
              title="Open Article"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Summary Dialog */}
      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>AI Summary</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isLoadingSummary ? (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-center text-sm text-muted-foreground">
                  Generating summary with AI...
                </p>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                <div className="whitespace-pre-line">
                  {articleSummary}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
