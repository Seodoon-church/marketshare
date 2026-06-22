interface EdBadgeProps {
  variant?: 'best' | 'new' | 'live' | 'discount' | 'default';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  best: 'bg-ink text-paper',
  new: 'bg-jade text-white',
  live: 'bg-sale-red text-white',
  discount: 'bg-sale-red text-white',
  default: 'bg-cream text-ink border border-hairline',
};

export function EdBadge({ variant = 'default', children, className = '' }: EdBadgeProps) {
  return (
    <span className={`inline-flex items-center font-mono text-[10px] font-semibold tracking-[.06em] py-[3px] px-[7px] rounded-none leading-none ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
