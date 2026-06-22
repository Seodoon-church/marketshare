interface EdLabelProps {
  children: React.ReactNode;
  className?: string;
  uppercase?: boolean;
}

export function EdLabel({ children, className = '', uppercase = true }: EdLabelProps) {
  return (
    <span className={`font-mono text-[11px] md:text-[13px] tracking-[.14em] text-ink-light ${uppercase ? 'uppercase' : ''} ${className}`}>
      {children}
    </span>
  );
}
