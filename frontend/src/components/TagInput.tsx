import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { useFeed } from '@/hooks/useFeed';

interface TagInputProps {
  availableTags?: string[];
  selectedTags?: string[];
  onChange?: (tags: string[]) => void;
  inForm?: boolean; // New prop to indicate if component is used inside a form
}

export const TagInput: React.FC<TagInputProps> = ({ 
  availableTags, 
  selectedTags = [], 
  onChange,
  inForm = false
}) => {
  const { tags, addTag, removeTag } = useFeed();
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (newTag.trim()) {
      // If used in dialog with onChange prop
      if (onChange) {
        const tagExists = selectedTags.includes(newTag.trim());
        if (!tagExists) {
          onChange([...selectedTags, newTag.trim()]);
          setNewTag('');
        }
      } 
      // If used standalone with useFeed hook
      else {
        // Check if tag already exists
        const tagExists = tags.some(
          (tag) => tag.name.toLowerCase() === newTag.trim().toLowerCase()
        );
        
        if (!tagExists) {
          // Generate a random color
          const colors = [
            '#3b82f6', '#10b981', '#6366f1', '#f59e0b', 
            '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'
          ];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          
          addTag(newTag.trim(), randomColor);
          setNewTag('');
        }
      }
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

  // Use a conditional to render either a form or a div based on the inForm prop
  const InputContainer = inForm ? 
    // When inside a form, use a div instead
    ({ children }: { children: React.ReactNode }) => (
      <div className="flex gap-2">{children}</div>
    ) : 
    // When not inside another form, use a form element
    ({ children }: { children: React.ReactNode }) => (
      <form onSubmit={handleAddTag} className="flex gap-2">{children}</form>
    );

  return (
    <div className="space-y-4">
      <InputContainer>
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add a new tag..."
          className="flex-1"
        />
        {inForm ? (
          // When inside a form, use a button with type="button" to avoid form submission
          <Button 
            type="button" 
            onClick={() => handleAddTag()} 
            disabled={!newTag.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        ) : (
          // When not inside a form, use a submit button
          <Button type="submit" disabled={!newTag.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        )}
      </InputContainer>
      
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
    </div>
  );
};
