import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import type { Studio } from '../db/types.js';

export interface StudioSocialLinksProps {
  studio?: Partial<Studio> | null;
  facebook?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
  variant?: 'badges' | 'compact-icons' | 'large-buttons' | 'card' | 'bar';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
  stopClickPropagation?: boolean;
}

export function formatUrl(url?: string, type?: 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'website'): string {
  if (!url || !url.trim()) return '';
  let clean = url.trim();

  // If already full http(s) URL
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }

  // Handle handles like @username
  if (clean.startsWith('@')) {
    const handle = clean.slice(1);
    if (type === 'instagram') return `https://instagram.com/${handle}`;
    if (type === 'tiktok') return `https://tiktok.com/@${handle}`;
    if (type === 'twitter') return `https://x.com/${handle}`;
    if (type === 'facebook') return `https://facebook.com/${handle}`;
    if (type === 'youtube') return `https://youtube.com/@${handle}`;
  }

  // Handle bare domain like "studiolumiere.ph" or "facebook.com/lumiere"
  return `https://${clean}`;
}

export const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
  </svg>
);

export const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

export const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
  </svg>
);

export const TwitterIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const StudioSocialLinks: React.FC<StudioSocialLinksProps> = ({
  studio,
  facebook: customFacebook,
  website: customWebsite,
  instagram: customInstagram,
  tiktok: customTiktok,
  youtube: customYoutube,
  twitter: customTwitter,
  variant = 'badges',
  size = 'sm',
  showLabels = true,
  className = '',
  stopClickPropagation = true
}) => {
  const fb = customFacebook || studio?.facebook || studio?.socialLinks?.facebook;
  const web = customWebsite || studio?.website || studio?.socialLinks?.website;
  const ig = customInstagram || studio?.instagram || studio?.socialLinks?.instagram;
  const tt = customTiktok || studio?.tiktok || studio?.socialLinks?.tiktok;
  const yt = customYoutube || studio?.youtube || studio?.socialLinks?.youtube;
  const tw = customTwitter || studio?.twitter || studio?.socialLinks?.twitter;

  const links = [
    {
      id: 'facebook',
      name: 'Facebook Page',
      label: 'Facebook',
      value: fb,
      url: formatUrl(fb, 'facebook'),
      icon: FacebookIcon,
      bgColor: 'bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white border-[#1877F2]/25 hover:border-[#1877F2]',
      solidColor: 'bg-[#1877F2] text-white hover:bg-[#166fe5]',
      cardBorder: 'border-blue-200 hover:border-[#1877F2] bg-blue-50/50',
      badgeClass: 'text-[#1877F2] bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      id: 'website',
      name: 'Official Website',
      label: 'Website',
      value: web,
      url: formatUrl(web, 'website'),
      icon: Globe,
      bgColor: 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-300 hover:border-emerald-600',
      solidColor: 'bg-emerald-600 text-white hover:bg-emerald-700',
      cardBorder: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/50',
      badgeClass: 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      label: 'Instagram',
      value: ig,
      url: formatUrl(ig, 'instagram'),
      icon: InstagramIcon,
      bgColor: 'bg-pink-50 hover:bg-gradient-to-r hover:from-purple-600 hover:via-pink-600 hover:to-amber-500 text-pink-700 hover:text-white border-pink-200 hover:border-pink-600',
      solidColor: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white hover:opacity-90',
      cardBorder: 'border-pink-200 hover:border-pink-500 bg-pink-50/50',
      badgeClass: 'text-pink-700 bg-pink-50 hover:bg-pink-100 border-pink-200'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      label: 'TikTok',
      value: tt,
      url: formatUrl(tt, 'tiktok'),
      icon: TikTokIcon,
      bgColor: 'bg-stone-100 hover:bg-stone-900 text-stone-900 hover:text-white border-stone-300 hover:border-stone-900',
      solidColor: 'bg-stone-900 text-white hover:bg-black',
      cardBorder: 'border-stone-300 hover:border-stone-800 bg-stone-50/60',
      badgeClass: 'text-stone-900 bg-stone-100 hover:bg-stone-200 border-stone-300'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      label: 'YouTube',
      value: yt,
      url: formatUrl(yt, 'youtube'),
      icon: YouTubeIcon,
      bgColor: 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-200 hover:border-rose-600',
      solidColor: 'bg-rose-600 text-white hover:bg-rose-700',
      cardBorder: 'border-rose-200 hover:border-rose-500 bg-rose-50/50',
      badgeClass: 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      label: 'X (Twitter)',
      value: tw,
      url: formatUrl(tw, 'twitter'),
      icon: TwitterIcon,
      bgColor: 'bg-stone-100 hover:bg-stone-900 text-stone-900 hover:text-white border-stone-200',
      solidColor: 'bg-stone-900 text-white hover:bg-black',
      cardBorder: 'border-stone-200 hover:border-stone-800 bg-stone-50/50',
      badgeClass: 'text-stone-800 bg-stone-100 hover:bg-stone-200 border-stone-300'
    }
  ].filter(item => Boolean(item.value && item.value.trim()));

  if (links.length === 0) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (stopClickPropagation) {
      e.stopPropagation();
    }
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const pillTextSizes = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-[11px] px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-1.5',
    lg: 'text-sm px-4 py-2 gap-2'
  };

  // 1. Compact Icons Mode
  if (variant === 'compact-icons') {
    return (
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`} onClick={handleClick}>
        {links.map(item => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Visit ${item.name}: ${item.value}`}
              className={`p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-center ${item.bgColor} shadow-2xs hover:scale-105`}
            >
              <Icon className={iconSizes[size]} />
            </a>
          );
        })}
      </div>
    );
  }

  // 2. Large Buttons Mode
  if (variant === 'large-buttons') {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`} onClick={handleClick}>
        {links.map(item => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center font-bold rounded-xl border shadow-xs transition-all duration-200 hover:-translate-y-0.5 ${item.bgColor} ${pillTextSizes[size]}`}
            >
              <Icon className={iconSizes[size]} />
              <span>{showLabels ? item.label : item.name}</span>
              <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
            </a>
          );
        })}
      </div>
    );
  }

  // 3. Card Bar Mode (Great for Studio profile top banners and modal footers)
  if (variant === 'bar') {
    return (
      <div
        className={`bg-stone-50 border border-stone-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${className}`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 text-stone-700">
          <Globe className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-xs font-bold">Studio Online Presence & Socials:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {links.map(item => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 font-bold rounded-lg border px-2.5 py-1 text-xs transition-all shadow-2xs hover:scale-102 ${item.bgColor}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Default Interactive Badges Mode
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`} onClick={handleClick}>
      {links.map(item => {
        const Icon = item.icon;
        return (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open official ${item.name} (${item.url})`}
            className={`inline-flex items-center font-semibold rounded-lg border transition-all duration-200 hover:scale-102 shadow-2xs ${item.bgColor} ${pillTextSizes[size]}`}
          >
            <Icon className={iconSizes[size]} />
            {showLabels && <span>{item.label}</span>}
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>
        );
      })}
    </div>
  );
};
