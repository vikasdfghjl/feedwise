import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { useFeed } from '@/hooks/useFeed';
import { Spinner } from '@/components/ui/spinner';

interface TagInputProps {
  availableTags?: string[];
  selectedTags?: string[];
  onChange?: (tags: string[]) => void;
  inForm?: boolean; // Prop to indicate if component is used inside a form
  showTags?: boolean; // New prop to control tag list display
}

export const TagInput: React.FC<TagInputProps> = ({ 
  availableTags, 
  selectedTags = [], 
  onChange,
  inForm = false,
  showTags = true // Default to showing tags
}) => {
  const { tags, addTag, removeTag, loading } = useFeed();
  const [newTag, setNewTag] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    const trimmedTag = newTag.trim();
    
    if (trimmedTag) {
      // If used with onChange prop (form/dialog mode)
      if (onChange) {
        const tagExists = selectedTags.includes(trimmedTag);
        if (!tagExists) {
          onChange([...selectedTags, trimmedTag]);
        }
      } 
      // If used standalone with useFeed hook
      else {
        // Check if tag already exists
        const tagExists = tags.some(
          (tag) => tag.name.toLowerCase() === trimmedTag.toLowerCase()
        );
        
        if (!tagExists) {
          // Generate a random color
          const colors = [
            '#3b82f6', '#10b981', '#6366f1', '#f59e0b', 
            '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'
          ];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          
          addTag(trimmedTag, randomColor);
        }
      }
      
      // Clear input after adding
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (onChange) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      const tagToRemove = tags.find(t => t.name === tag);
      if (tagToRemove) {
        removeTag(tagToRemove._id);
      }
    }
  };

  // Determine which tags to display
  const displayTags = onChange ? 
    selectedTags.map(name => ({ _id: name, name, color: '#3b82f6' })) : 
    tags;

  // Handle key press events - add tag on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      handleAddTag();
    }
  };

  return (
    <div className="space-y-4">
      {inForm ? (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new tag..."
            className="flex-1"
            type="text"
            autoComplete="off"
          />
          <Button 
            type="button" 
            onClick={(e) => handleAddTag(e)} 
            disabled={loading || !newTag.trim()}
          >
            {loading ? (
              <Spinner size="sm" color="currentColor" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </div>
      ) : (
        <form onSubmit={(e) => handleAddTag(e)} className="flex gap-2">
          <Input
            ref={inputRef}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new tag..."
            className="flex-1"
            type="text"
            autoComplete="off"
          />
          <Button 
            type="submit" 
            disabled={loading || !newTag.trim()}
          >
            {loading ? (
              <Spinner size="sm" color="currentColor" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </form>
      )}
      
      {/* Only render the tags list if showTags prop is true */}
      {showTags && (
        <div className="flex flex-wrap gap-2">
          {displayTags.map((tag) => (
            <div
              key={typeof tag === 'string' ? tag : tag._id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
              style={{ 
                backgroundColor: `${typeof tag === 'string' ? '#3b82f6' : tag.color}20`, 
                color: typeof tag === 'string' ? '#3b82f6' : tag.color 
              }}
            >
              #{typeof tag === 'string' ? tag : tag.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-transparent hover:text-destructive"
                onClick={() => handleRemoveTag(typeof tag === 'string' ? tag : tag.name)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
