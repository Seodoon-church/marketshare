'use client';

interface EdPageShellProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  noBottomPadding?: boolean;
}

export function EdPageShell({ children, className = '', noPadding, noBottomPadding }: EdPageShellProps) {
  return (
    <main
      className={`min-h-screen bg-paper ${noPadding ? '' : 'px-[18px] md:px-10'} ${noBottomPadding ? '' : 'pb-24 md:pb-0'} ${className}`}
    >
      <div className="mx-auto max-w-[1280px]">
        {children}
      </div>
    </main>
  );
}
