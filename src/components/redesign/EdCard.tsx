interface EdCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'cream' | 'ink';
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-paper border border-ink',
  cream: 'bg-cream border border-hairline',
  ink: 'bg-ink text-paper border border-ink',
};

export function EdCard({ children, variant = 'default', className = '', onClick }: EdCardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`rounded-none p-4 md:p-5 ${variantStyles[variant]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}
