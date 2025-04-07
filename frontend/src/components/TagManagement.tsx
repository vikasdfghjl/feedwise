
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { TagInput } from './TagInput';
import { Tag } from 'lucide-react';

interface TagManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TagManagement: React.FC<TagManagementProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Manage Tags
          </DialogTitle>
          <DialogDescription>
            Create and manage tags to organize your content more effectively.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <TagInput />
        </div>
      </DialogContent>
    </Dialog>
  );
};
