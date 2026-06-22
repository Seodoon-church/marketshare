interface EdButtonProps {
  variant?: 'ink' | 'outline' | 'brass' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

const variantStyles = {
  ink: 'bg-ink text-paper border-ink hover:bg-ink/90',
  outline: 'bg-transparent text-ink border-ink hover:bg-ink hover:text-paper',
  brass: 'bg-brass text-white border-brass hover:bg-brass/90',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-ink/5',
};

const sizeStyles = {
  sm: 'text-[13px] py-2 px-4',
  md: 'text-[14px] py-[11px] px-5',
  lg: 'text-[15px] py-4 px-7',
};

export function EdButton({
  variant = 'ink',
  size = 'md',
  href,
  onClick,
  children,
  className = '',
  disabled,
  type = 'button',
  fullWidth,
}: EdButtonProps) {
  const base = `inline-flex items-center justify-center font-bold border-[1.5px] rounded-none transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`;

  if (href && !disabled) {
    return (
      <a href={href} className={base}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {children}
    </button>
  );
}
