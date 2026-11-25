import React, { useState } from 'react';
import { Sprout } from 'lucide-react';

interface CropImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export const CropImage: React.FC<CropImageProps> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sprout className="w-7 h-7 text-emerald-700 mb-1.5" />
        <span className="text-xs font-medium text-center line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
};
