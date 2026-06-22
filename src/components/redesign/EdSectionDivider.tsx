interface EdSectionDividerProps {
  label?: string;
  className?: string;
}

export function EdSectionDivider({ label, className = '' }: EdSectionDividerProps) {
  return (
    <div className={`flex items-center gap-3 py-2 ${className}`}>
      <div className="flex-1 border-t border-hairline" />
      {label && (
        <span className="font-mono text-[10px] tracking-[.14em] text-ink-light uppercase">{label}</span>
      )}
      <div className="flex-1 border-t border-hairline" />
    </div>
  );
}
