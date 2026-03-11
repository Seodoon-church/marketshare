'use client';

import React, { useRef, useEffect, useState } from 'react';

type AnimationVariant = 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleUp' | 'fadeOnly';

interface AnimateOnScrollProps {
  children: React.ReactNode;
  variant?: AnimationVariant;
  delay?: number;       // ms
  duration?: number;    // ms
  threshold?: number;   // 0~1
  className?: string;
  once?: boolean;       // 한 번만 실행 (기본 true)
  as?: React.ElementType;
}

const variantStyles: Record<AnimationVariant, { initial: React.CSSProperties; animate: React.CSSProperties }> = {
  fadeIn: {
    initial: { opacity: 0, transform: 'translateY(24px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
  },
  slideUp: {
    initial: { opacity: 0, transform: 'translateY(40px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
  },
  slideDown: {
    initial: { opacity: 0, transform: 'translateY(-40px)' },
    animate: { opacity: 1, transform: 'translateY(0)' },
  },
  slideLeft: {
    initial: { opacity: 0, transform: 'translateX(40px)' },
    animate: { opacity: 1, transform: 'translateX(0)' },
  },
  slideRight: {
    initial: { opacity: 0, transform: 'translateX(-40px)' },
    animate: { opacity: 1, transform: 'translateX(0)' },
  },
  scaleUp: {
    initial: { opacity: 0, transform: 'scale(0.92)' },
    animate: { opacity: 1, transform: 'scale(1)' },
  },
  fadeOnly: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
};

export function AnimateOnScroll({
  children,
  variant = 'fadeIn',
  delay = 0,
  duration = 600,
  threshold = 0.15,
  className = '',
  once = true,
  as: Component = 'div',
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const { initial, animate } = variantStyles[variant];

  return (
    <Component
      ref={ref}
      className={className}
      style={{
        ...(isVisible ? animate : initial),
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </Component>
  );
}

/** 숫자 카운트업 애니메이션 훅 */
export function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;

    let startTime: number;
    let raf: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * end));

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);

  return { count, ref };
}
