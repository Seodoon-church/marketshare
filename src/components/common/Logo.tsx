'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'default' | 'white';
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { icon: 'h-8 w-8', text: 'text-lg', dot: 3, stroke: 2.2 },
  md: { icon: 'h-9 w-9', text: 'text-xl', dot: 3.5, stroke: 2.5 },
  lg: { icon: 'h-12 w-12', text: 'text-2xl', dot: 4, stroke: 3 },
};

function LogoIcon({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="logoAccent" x1="200" y1="100" x2="350" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#logoBg)" />
      <path
        d="M152 190 L256 120 L360 190"
        stroke="white"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M140 380 L140 200 L256 300 L372 200 L372 380"
        stroke="url(#logoAccent)"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="140" cy="380" r="18" fill="white" />
      <circle cx="372" cy="380" r="18" fill="white" />
      <circle cx="256" cy="300" r="14" fill="white" opacity="0.7" />
    </svg>
  );
}

export function Logo({
  size = 'md',
  showText = true,
  variant = 'default',
  href = '/',
  className = '',
}: LogoProps) {
  const s = sizeMap[size];
  const textColor = variant === 'white' ? 'text-white' : 'text-gray-900';
  const shareColor = variant === 'white' ? 'text-white/70' : 'text-primary';

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon className={`${s.icon} flex-shrink-0`} />
      {showText && (
        <span className={`${s.text} font-bold tracking-tight ${textColor}`}>
          Market<span className={shareColor}>Share</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="flex items-center gap-2 no-underline">
        {content}
      </a>
    );
  }

  return content;
}

export { LogoIcon };
