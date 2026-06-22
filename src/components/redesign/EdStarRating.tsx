interface EdStarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function EdStarRating({ rating, maxStars = 5, size = 'sm', className = '' }: EdStarRatingProps) {
  const fontSize = size === 'sm' ? 'text-[12px]' : 'text-[16px]';

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: maxStars }, (_, i) => (
        <span key={i} className={`${fontSize} ${i < Math.round(rating) ? 'text-brass' : 'text-hairline'}`}>
          ★
        </span>
      ))}
      <span className={`font-mono ${size === 'sm' ? 'text-[11px]' : 'text-[13px]'} text-ink-light ml-1`}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}
