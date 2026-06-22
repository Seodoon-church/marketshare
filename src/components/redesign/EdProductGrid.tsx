interface EdProductGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function EdProductGrid({ children, columns = 2, className = '' }: EdProductGridProps) {
  const colClass = {
    2: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${colClass} gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  );
}
