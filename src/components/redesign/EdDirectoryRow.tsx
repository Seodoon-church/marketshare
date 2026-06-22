interface EdDirectoryRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function EdDirectoryRow({ label, value, className = '', onClick }: EdDirectoryRowProps) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`flex items-baseline w-full text-left py-[10px] border-b border-hairline ${onClick ? 'cursor-pointer hover:bg-cream/40 transition-colors' : ''} ${className}`}
    >
      <span className="font-mono text-[12px] tracking-[.06em] text-ink-light whitespace-nowrap">{label}</span>
      <span className="flex-1 mx-2 border-b border-dotted border-ink-light/30 self-end mb-[3px]" />
      <span className="font-mono text-[13px] font-medium text-ink whitespace-nowrap">{value}</span>
    </Wrapper>
  );
}
