import React from 'react';

interface SkeletonCardProps {
  variant?: 'card' | 'list';
  showInfo?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  variant = 'card',
  showInfo = true 
}) => {
  if (variant === 'list') {
    return (
      <div className="flex gap-3 p-2 animate-pulse">
        <div className="w-24 h-16 bg-zinc-800 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-3/4" />
          <div className="h-3 bg-zinc-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[2/3] bg-zinc-800 rounded-xl overflow-hidden animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 animate-shimmer" />
      
      {showInfo && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <div className="space-y-2">
            <div className="h-4 bg-zinc-700 rounded w-3/4" />
            <div className="h-3 bg-zinc-700 rounded w-1/2" />
          </div>
        </div>
      )}
    </div>
  );
};

interface SkeletonGridProps {
  count?: number;
  columns?: number;
  variant?: 'card' | 'list';
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ 
  count = 8,
  columns = 4,
  variant = 'card'
}) => {
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[columns] || 'grid-cols-4';

  if (variant === 'list') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} variant="list" showInfo={false} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${gridColsClass}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant="card" showInfo={true} />
      ))}
    </div>
  );
};

interface SkeletonGridContainerProps {
  isLoading: boolean;
  count?: number;
  columns?: number;
  children: React.ReactNode;
  skeletonCount?: number;
}

export const SkeletonGridContainer: React.FC<SkeletonGridContainerProps> = ({
  isLoading,
  count = 8,
  columns = 4,
  children,
  skeletonCount
}) => {
  const displayCount = skeletonCount || count;

  if (isLoading) {
    return (
      <SkeletonGrid count={displayCount} columns={columns} variant="card" />
    );
  }

  return (
    <>{children}</>
  );
};

export default SkeletonGrid;
