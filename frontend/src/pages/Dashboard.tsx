
import React, { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { ArticleList } from '@/components/ArticleList';
import { TagManagement } from '@/components/TagManagement';
import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [showTagManagement, setShowTagManagement] = useState(false);

  return (
    <MainLayout>
      <div className="mb-4 flex justify-end">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setShowTagManagement(true)}
        >
          <Tag className="h-4 w-4" />
          Manage Tags
        </Button>
      </div>
      
      <ArticleList />
      
      <TagManagement
        open={showTagManagement}
        onOpenChange={setShowTagManagement}
      />
    </MainLayout>
  );
};

export default Dashboard;
