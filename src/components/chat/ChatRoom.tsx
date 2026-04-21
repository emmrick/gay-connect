import { useState, useRef, useEffect, useCallback } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { useGroupReadReceipts } from '@/hooks/useGroupReadReceipts';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { useUnreadMentions } from '@/hooks/useUnreadMentions';
import { usePinnedMessages } from '@/hooks/usePinnedMessages';
import { usePolls } from '@/hooks/usePolls';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveConversation } from '@/hooks/useActiveConversation';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import PollMessage from './PollMessage';
import EphemeralMessageRow from './EphemeralMessageRow';
import SnapAutoViewer from './SnapAutoViewer';
import { usePendingGroupSnaps } from '@/hooks/usePendingGroupSnaps';
import TypingIndicator from './TypingIndicator';
import MessageReply from './MessageReply';
import MessageSearch from './MessageSearch';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import MediaGallerySheet from './MediaGallerySheet';
import PinnedMessagesBanner from './PinnedMessagesBanner';
import GroupSettingsDialog from './GroupSettingsDialog';
import VoiceRecorder from './VoiceRecorder';
import GroupChatHeader from './group/GroupChatHeader';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReplyMessage {
  id: string;
  content: string;
  senderName: string;
}

interface ChatRoomProps {
  roomId: string;
  regionCode: string;
  regionName: string;
  memberCount: number;
  isCustomGroup?: boolean;
  onBack: () => void;
  onStartPrivateChat: (userId: string) => void;
}

const ChatRoom = ({ roomId, regionCode, regionName, memberCount, isCustomGroup, onBack, onStartPrivateChat }: ChatRoomProps) => {
  const { user } = useAuth();
  useActiveConversation(null, roomId);
  
  const [showMembers, setShowMembers] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSnapViewer, setShowSnapViewer] = useState(false);
  const [snapMessageId, setSnapMessageId] = useState<string | null>(null);
  const [snapSenderName, setSnapSenderName] = useState('');
  const [snapSenderAvatar, setSnapSenderAvatar] = useState<string | null>(null);
  
  const hasOverlayOpen = showMembers || showMediaGallery || showSettings;
  useMobileNavigation({ onBack, enabled: !hasOverlayOpen });
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  
  const { messages, searchResults, isLoading, sendMessage } = useMessages(roomId, searchQuery);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(roomId);
  const { getReactionsForMessage, toggleReaction } = useMessageReactions(roomId);
  const { getReaders, markAsRead } = useGroupReadReceipts(roomId);
  const { markMentionsAsRead } = useUnreadMentions();
  const { createPoll, vote, lockPoll, getPollForMessage } = usePolls(roomId);
  const { pinnedMessages, pinMessage, unpinMessage, isMessagePinned } = usePinnedMessages(roomId);
  
  const { data: pendingGroupSnaps } = usePendingGroupSnaps();
  const groupSnap = pendingGroupSnaps?.get(roomId);
  
  useEffect(() => {
    if (groupSnap && !showSnapViewer) {
      setSnapMessageId(groupSnap.messageId);
      const senderMsg = messages.find(m => m.sender_id === groupSnap.senderId);
      setSnapSenderName(senderMsg?.senderUsername || 'Un membre');
      setSnapSenderAvatar(senderMsg?.senderAvatar || null);
      setShowSnapViewer(true);
    }
  }, [groupSnap?.messageId]);

  useEffect(() => {
    if (roomId) markMentionsAsRead(roomId);
  }, [roomId, markMentionsAsRead]);

  useEffect(() => {
    if (messages.length > 0 && user?.id) {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const otherMessages = messages.filter(m => m.sender_id !== user.id).map(m => m.id);
      if (otherMessages.length > 0) markAsRead(otherMessages);
    }
  }, [messages, user?.id, markAsRead]);

  // Re-mark when tab/app becomes visible again
  useEffect(() => {
    if (!user?.id) return;
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const otherMessages = messages.filter(m => m.sender_id !== user.id).map(m => m.id);
      if (otherMessages.length > 0) markAsRead(otherMessages);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [messages, user?.id, markAsRead]);
  
  const [replyTo, setReplyTo] = useState<ReplyMessage | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const navigate = useNavigate();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const initialScrollDone = useRef(false);
  const prevMsgCount = useRef(0);

  useEffect(() => {
    initialScrollDone.current = false;
    prevMsgCount.current = 0;
    isNearBottomRef.current = true;
  }, [roomId]);

  const scrollToBottom = useCallback((instant = false) => {
    const el = scrollRef.current;
    if (!el) return;
    if (instant) el.scrollTop = el.scrollHeight;
    else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && !initialScrollDone.current && !searchQuery) {
      initialScrollDone.current = true;
      requestAnimationFrame(() => scrollToBottom(true));
      prevMsgCount.current = messages.length;
    }
  }, [isLoading, messages.length, searchQuery, scrollToBottom]);

  useEffect(() => {
    if (messages.length > prevMsgCount.current && initialScrollDone.current && !searchQuery) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.sender_id === user?.id || isNearBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom(false));
      }
      prevMsgCount.current = messages.length;
    }
  }, [messages.length, messages, user?.id, searchQuery, scrollToBottom]);

  useEffect(() => {
    if (typingUsers.length > 0 && isNearBottomRef.current && !searchQuery) {
      requestAnimationFrame(() => scrollToBottom(false));
    }
  }, [typingUsers.length, searchQuery, scrollToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (isNearBottomRef.current && initialScrollDone.current) {
        requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight; });
      }
    });
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    else observer.observe(el);
    return () => observer.disconnect();
  }, [roomId]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      isNearBottomRef.current = nearBottom;
      setShowScrollButton(!nearBottom);
    }
  }, []);

  useEffect(() => {
    if (searchResults.length > 0 && searchQuery) {
      const messageId = searchResults[searchIndex];
      document.getElementById(`message-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchIndex, searchResults, searchQuery]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let prev = vv.height;
    const onResize = () => {
      if (vv.height < prev - 50) setTimeout(() => scrollToBottom(true), 50);
      prev = vv.height;
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, [scrollToBottom]);

  const handleInputFocus = useCallback(() => {}, []);

  const handleSendMessage = async (content: string) => {
    if (content.trim()) {
      sendMessage.mutate({ content, messageType: 'text', replyToId: replyTo?.id });
      setReplyTo(null);
      stopTyping();
    }
  };

  const handleCreatePoll = async (question: string, options: string[], isMultipleChoice: boolean) => {
    if (!user) return;
    const { data: msg } = await supabase
      .from('messages')
      .insert({ chat_room_id: roomId, sender_id: user.id, content: `📊 ${question}`, message_type: 'poll', is_private: false })
      .select().single();
    if (msg) await createPoll.mutateAsync({ question, options, isMultipleChoice, messageId: msg.id });
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    toggleReaction.mutate({ messageId, emoji });
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
      <GroupChatHeader
        roomId={roomId}
        regionCode={regionCode}
        regionName={regionName}
        memberCount={memberCount}
        isCustomGroup={isCustomGroup}
        typingUsers={typingUsers}
        showMembers={showMembers}
        setShowMembers={setShowMembers}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        onBack={onBack}
        onShowMediaGallery={() => setShowMediaGallery(true)}
        onShowSettings={() => setShowSettings(true)}
        onStartPrivateChat={onStartPrivateChat}
      />

      <PinnedMessagesBanner
        pinnedMessages={pinnedMessages}
        onScrollToMessage={(messageId) => {
          document.getElementById(`message-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {isCustomGroup && (
        <GroupSettingsDialog open={showSettings} onOpenChange={setShowSettings} roomId={roomId} currentName={regionName} onGroupDeleted={onBack} />
      )}

      <MediaGallerySheet roomId={roomId} regionCode={regionCode} isOpen={showMediaGallery} onClose={() => setShowMediaGallery(false)} />

      <MessageSearch
        isOpen={searchOpen}
        onClose={() => { setSearchOpen(false); setSearchQuery(''); setSearchIndex(0); }}
        onSearch={(query) => { setSearchQuery(query); setSearchIndex(0); }}
        resultCount={searchResults.length}
        currentIndex={searchIndex}
        onNavigate={(direction) => {
          if (searchResults.length === 0) return;
          setSearchIndex(prev => direction === 'next' ? (prev + 1) % searchResults.length : (prev - 1 + searchResults.length) % searchResults.length);
        }}
      />
      
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ overflowAnchor: 'none', contain: 'layout paint' }}
      >
        <div className="px-3 py-2">
          {/* Welcome */}
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-primary-foreground text-2xl mb-4 shadow-md">
              {isCustomGroup ? regionName.charAt(0).toUpperCase() : regionCode}
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">
              Bienvenue dans {isCustomGroup ? regionName : `le groupe ${regionCode}`}
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {regionName} • {memberCount} membres actifs
            </p>
          </div>

          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          
          {messages.map((message, index) => {
            const isEphemeral = message.message_type === 'image' || message.message_type === 'video';
            const isPoll = message.message_type === 'poll';
            const poll = isPoll ? getPollForMessage(message.id) : undefined;
            const isOwn = message.sender_id === user?.id;

            const nextMsg = messages[index + 1];
            const isLastInGroup = !nextMsg ||
              nextMsg.sender_id !== message.sender_id ||
              new Date(nextMsg.created_at).getTime() - new Date(message.created_at).getTime() > 120000;

            const isLastOwnMessage = isOwn && (() => {
              for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].sender_id === user?.id) return messages[i].id === message.id;
              }
              return false;
            })();

            if (isPoll && poll) {
              return (
                <div key={message.id} id={`message-${message.id}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-2' : 'mb-px'}`}>
                  <PollMessage poll={poll} isOwn={isOwn} onVote={(pollId, optionId) => vote.mutate({ pollId, optionId })} onLock={isOwn ? (pollId) => lockPoll.mutate(pollId) : undefined} />
                </div>
              );
            }

            const chatMsg = (
              <ChatMessage
                key={message.id}
                message={{
                  id: message.id,
                  content: message.content || '',
                  senderId: message.sender_id,
                  senderName: message.senderUsername || 'Anonyme',
                  senderAvatar: message.senderAvatar || undefined,
                  timestamp: new Date(message.created_at),
                  type: message.message_type as 'text' | 'image',
                  replyToMessage: message.replyToMessage,
                }}
                isOwn={isOwn}
                isLastInGroup={isLastInGroup}
                isLastOwnMessage={isLastOwnMessage}
                isHighlighted={searchResults.includes(message.id) && searchResults[searchIndex] === message.id}
                reactions={getReactionsForMessage(message.id)}
                readers={getReaders(message.id)}
                totalMembers={memberCount}
                chatRoomId={roomId}
                onReply={(msg) => setReplyTo(msg)}
                onAvatarClick={(userId) => navigate(`/profile/${userId}`)}
                onToggleReaction={handleToggleReaction}
              />
            );

            if (isEphemeral) {
              return (
                <EphemeralMessageRow key={message.id} messageId={message.id} senderId={message.sender_id}>
                  {chatMsg}
                </EphemeralMessageRow>
              );
            }

            return chatMsg;
          })}

          <TypingIndicator typingUsers={typingUsers} />
        </div>
      </div>

      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-24 right-4 rounded-full shadow-lg z-10 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => scrollToBottom(true)}
        >
          <ChevronDown className="w-5 h-5" />
        </Button>
      )}

      {replyTo && (
        <div className="flex-shrink-0">
          <MessageReply replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
        </div>
      )}

      {showVoiceRecorder && (
        <div className="flex-shrink-0 px-4 pb-2">
          <VoiceRecorder chatRoomId={roomId} isPrivate={false} onMessageSent={() => setShowVoiceRecorder(false)} />
        </div>
      )}

      <div className="flex-shrink-0">
        <ChatInput
          onSendMessage={handleSendMessage}
          chatRoomId={roomId}
          isPrivate={false}
          isSending={sendMessage.isPending}
          onTyping={(hasText) => startTyping(hasText)}
          onFocus={handleInputFocus}
          onVoiceToggle={() => setShowVoiceRecorder(!showVoiceRecorder)}
          showVoiceButton
          showPollButton
          onCreatePoll={handleCreatePoll}
        />
      </div>

      {showSnapViewer && snapMessageId && (
        <SnapAutoViewer messageId={snapMessageId} senderName={snapSenderName} senderAvatar={snapSenderAvatar} onClose={() => { setShowSnapViewer(false); setSnapMessageId(null); }} />
      )}
    </div>
  );
};

export default ChatRoom;
