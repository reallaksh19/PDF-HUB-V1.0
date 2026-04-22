import React from 'react';
import { Search } from 'lucide-react';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';

const SearchPanelStub: React.FC = () => {
  return (
    <FeaturePlaceholder
      name="Search"
      description="Use the search-enabled patch from the previous bundle or wire your search panel here."
      icon={<Search />}
    />
  );
};

export default SearchPanelStub;
