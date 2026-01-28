import { useState } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MessageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  resultCount: number;
  currentIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const MessageSearch = ({
  isOpen,
  onClose,
  onSearch,
  resultCount,
  currentIndex,
  onNavigate,
}: MessageSearchProps) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClose = () => {
    setQuery('');
    onSearch('');
    onClose();
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-card border-b border-border animate-fade-in">
      <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <Input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Rechercher dans les messages..."
        className="flex-1 h-8 bg-secondary border-none"
        autoFocus
      />
      {query && resultCount > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {currentIndex + 1}/{resultCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onNavigate('prev')}
            disabled={resultCount === 0}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onNavigate('next')}
            disabled={resultCount === 0}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={handleClose}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default MessageSearch;
