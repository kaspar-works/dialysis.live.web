import React from 'react';
import { CommunityProfile } from '../../services/community';
import HCPBadge from './HCPBadge';

interface DisplayNameBadgeProps {
  profile: Pick<CommunityProfile, 'displayName' | 'hcpVerified' | 'hcpBadgeType'>;
  showHCPBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  linkToProfile?: boolean;
  className?: string;
}

const DisplayNameBadge: React.FC<DisplayNameBadgeProps> = ({
  profile,
  showHCPBadge = true,
  size = 'md',
  linkToProfile = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`font-semibold text-slate-800 dark:text-white ${sizeClasses[size]}`}>
        {profile.displayName}
      </span>
      {showHCPBadge && profile.hcpVerified && profile.hcpBadgeType && (
        <HCPBadge badgeType={profile.hcpBadgeType} size={size === 'lg' ? 'md' : 'sm'} />
      )}
    </span>
  );

  if (linkToProfile) {
    return (
      <a
        href={`#/community/profile/${profile.displayName}`}
        className="hover:underline decoration-sky-500"
      >
        {content}
      </a>
    );
  }

  return content;
};

export default DisplayNameBadge;
