import { Skeleton } from '@/components/ui/skeleton';

const MessagesSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {/* Message from other user */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-48 rounded-2xl" />
        </div>
      </div>

      {/* Own message */}
      <div className="flex justify-end">
        <Skeleton className="h-12 w-40 rounded-2xl" />
      </div>

      {/* Message from other user */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-56 rounded-2xl" />
        </div>
      </div>

      {/* Own message */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32 rounded-2xl" />
      </div>

      {/* Message from other user */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-14 w-44 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export default MessagesSkeleton;
