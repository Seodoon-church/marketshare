interface EdChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function EdChip({ children, selected, onClick, className = '' }: EdChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center font-mono text-[12px] tracking-[.04em] py-[6px] px-3 border rounded-none transition-colors cursor-pointer ${
        selected
          ? 'bg-ink text-paper border-ink'
          : 'bg-transparent text-ink border-hairline hover:border-ink'
      } ${className}`}
    >
      {children}
    </button>
  );
}
