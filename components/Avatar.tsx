import React from 'react';
import { Sex } from '../types';
import { avatarBg, avatarEmoji } from '../constants';

interface AvatarProps {
  sex: Sex;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'w-8 h-8 text-lg rounded-xl',
  md: 'w-12 h-12 text-2xl rounded-2xl',
  lg: 'w-20 h-20 text-5xl rounded-3xl',
};

const Avatar: React.FC<AvatarProps> = ({ sex, size = 'md' }) => (
  <div className={`${SIZES[size]} ${avatarBg(sex)} flex items-center justify-center shrink-0`}>
    <span>{avatarEmoji(sex)}</span>
  </div>
);

export default Avatar;
