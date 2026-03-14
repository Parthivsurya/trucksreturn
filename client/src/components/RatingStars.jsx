import { Star } from 'lucide-react';

export default function RatingStars({ rating = 0, size = 16, interactive = false, onChange, count = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={`transition-colors ${
            i < Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-600'
          } ${interactive ? 'cursor-pointer hover:text-amber-400' : ''}`}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  );
}
