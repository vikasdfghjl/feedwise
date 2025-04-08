import React, { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { ArticleList } from '@/components/ArticleList';
import { TagManagement } from '@/components/TagManagement';
import { Button } from '@/components/ui/button';
import { 
  Tag, 
  LayoutGrid, 
  List, 
  AlignJustify 
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export type ViewType = 'card' | 'list' | 'compact';

const Dashboard: React.FC = () => {
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('card');

  const getViewIcon = () => {
    switch(viewType) {
      case 'card': return <LayoutGrid className="h-4 w-4" />;
      case 'list': return <List className="h-4 w-4" />;
      case 'compact': return <AlignJustify className="h-4 w-4" />;
      default: return <LayoutGrid className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="mb-4 flex justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              {getViewIcon()}
              {viewType === 'card' ? 'Card View' : viewType === 'list' ? 'List View' : 'Compact View'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewType('card')}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Card View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewType('list')}>
              <List className="h-4 w-4 mr-2" />
              List View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewType('compact')}>
              <AlignJustify className="h-4 w-4 mr-2" />
              Compact View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setShowTagManagement(true)}
        >
          <Tag className="h-4 w-4" />
          Manage Tags
        </Button>
      </div>
      
      <ArticleList viewType={viewType} />
      
      <TagManagement
        open={showTagManagement}
        onOpenChange={setShowTagManagement}
      />
    </MainLayout>
  );
};

export default Dashboard;
