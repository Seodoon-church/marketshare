'use client';

import { IconHome, IconShop, IconLive, IconMine } from './icons';

interface EdBottomTabBarProps {
  activeTab?: 'home' | 'shop' | 'live' | 'mine';
}

const tabs = [
  { id: 'home' as const, label: '홈', href: '/', Icon: IconHome },
  { id: 'shop' as const, label: '쇼핑', href: '/shop', Icon: IconShop },
  { id: 'live' as const, label: '라이브', href: '/live', Icon: IconLive },
  { id: 'mine' as const, label: '마이', href: '/mypage', Icon: IconMine },
];

export function EdBottomTabBar({ activeTab }: EdBottomTabBarProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper border-t border-ink">
      <div className="flex items-center justify-around h-[64px] px-2">
        {tabs.map(({ id, label, href, Icon }) => {
          const active = activeTab === id;
          return (
            <a
              key={id}
              href={href}
              className={`flex flex-col items-center gap-[3px] min-w-[56px] ${
                active ? 'text-jade' : 'text-ink-light'
              }`}
            >
              <Icon size={23} active={active} />
              <span className="font-mono text-[10px] font-medium tracking-[.04em]">{label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
