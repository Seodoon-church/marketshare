interface EdHeadingProps {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

const sizes = {
  1: 'text-[36px] md:text-[64px] leading-[1.12]',
  2: 'text-[26px] md:text-[30px] leading-[1.2]',
  3: 'text-[20px] md:text-[24px] leading-[1.3]',
  4: 'text-[17px] md:text-[20px] leading-[1.35]',
} as const;

export function EdHeading({ level = 2, children, className = '' }: EdHeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag className={`font-serif font-bold tracking-tight text-ink m-0 ${sizes[level]} ${className}`}>
      {children}
    </Tag>
  );
}
