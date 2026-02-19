/**
 * Avatar Component
 */

import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  className?: string;
  showStatus?: boolean;
  status?: 'online' | 'offline';
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  src,
  className = '',
  showStatus = false,
  status = 'online',
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-primary-100 text-primary-600 font-semibold flex items-center justify-center`}
        >
          {getInitials(name)}
        </div>
      )}
      
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizes[size]} rounded-full border-2 border-white ${
            status === 'online' ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
};

export default Avatar;