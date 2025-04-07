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
import { Rss } from 'lucide-react';
import { TagInput } from './TagInput';

interface AddFeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddFeedDialog: React.FC<AddFeedDialogProps> = ({ open, onOpenChange }) => {
  const { addFeed, categories, tags, loading, selectFeed } = useFeed();
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" />
            Add New RSS Feed
          </DialogTitle>
          <DialogDescription>
            Enter the URL of the RSS feed you want to add to your collection.
          </DialogDescription>
        </DialogHeader>
        
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
      </DialogContent>
    </Dialog>
  );
};
