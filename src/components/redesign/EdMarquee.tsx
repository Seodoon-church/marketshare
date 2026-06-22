'use client';

interface EdMarqueeProps {
  items: string[];
  className?: string;
}

export function EdMarquee({ items, className = '' }: EdMarqueeProps) {
  const doubled = [...items, ...items];

  return (
    <div className={`overflow-hidden border-t border-b border-[#E3DACA] py-[14px] ${className}`}>
      <div
        className="flex w-max gap-12 pl-12"
        style={{ animation: 'msMarquee 24s linear infinite' }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="font-mono text-[13px] font-medium text-[#A89B86] tracking-[.04em] whitespace-nowrap">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
