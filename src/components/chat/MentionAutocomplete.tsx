import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface MentionUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface MentionAutocompleteProps {
  suggestions: MentionUser[];
  isLoading: boolean;
  isActive: boolean;
  selectedIndex: number;
  onSelect: (user: MentionUser) => void;
}

const MentionAutocomplete = ({ 
  suggestions, 
  isLoading, 
  isActive, 
  selectedIndex,
  onSelect 
}: MentionAutocompleteProps) => {
  if (!isActive) return null;

  if (isLoading) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg shadow-lg p-2 z-50">
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 max-h-48 overflow-y-auto">
      {suggestions.map((user, index) => (
        <button
          key={user.user_id}
          type="button"
          onClick={() => onSelect(user)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
            index === selectedIndex 
              ? 'bg-primary/10 text-primary' 
              : 'hover:bg-muted'
          }`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-accent text-white">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">@{user.username}</span>
        </button>
      ))}
    </div>
  );
};

export default MentionAutocomplete;
