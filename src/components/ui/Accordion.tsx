'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface AccordionItemData {
  title: string;
  content: ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItemData[];
  className?: string;
  allowMultiple?: boolean;
}

export interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  AccordionItem                                                     */
/* ------------------------------------------------------------------ */

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  isOpen: controlledOpen,
  onToggle,
  className,
}: AccordionItemProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(
    defaultOpen ? undefined : 0
  );

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (!contentRef.current) return;

    if (isOpen) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);
      // After transition, set to auto so content can resize naturally
      const timer = setTimeout(() => setHeight(undefined), 200);
      return () => clearTimeout(timer);
    } else {
      // First set explicit height, then collapse
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHeight(0);
        });
      });
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  return (
    <div
      className={cn(
        'border-b border-gray-100 last:border-b-0',
        className
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
      >
        <span>{title}</span>
        <ChevronDownIcon
          className={cn(
            'h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        ref={contentRef}
        style={{
          height: height !== undefined ? `${height}px` : 'auto',
        }}
        className={cn(
          'overflow-hidden transition-[height] duration-200 ease-in-out'
        )}
        role="region"
      >
        <div className="px-4 pb-4 text-sm text-gray-600">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Accordion (group)                                                 */
/* ------------------------------------------------------------------ */

export function Accordion({
  items,
  className,
  allowMultiple = true,
}: AccordionProps) {
  const [openIndices, setOpenIndices] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    items.forEach((item, i) => {
      if (item.defaultOpen) initial.add(i);
    });
    return initial;
  });

  const handleToggle = (index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (!allowMultiple) next.clear();
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white shadow-sm',
        className
      )}
    >
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          title={item.title}
          isOpen={openIndices.has(i)}
          onToggle={() => handleToggle(i)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}
