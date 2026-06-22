'use client';

import { EdButton } from './EdButton';
import { EdPrice } from './EdPrice';

interface EdBuyBarProps {
  price: number;
  originalPrice?: number;
  onBuy?: () => void;
  onCart?: () => void;
  disabled?: boolean;
}

export function EdBuyBar({ price, originalPrice, onBuy, onCart, disabled }: EdBuyBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-paper border-t border-ink md:hidden">
      <div className="flex items-center gap-3 px-[18px] py-3">
        <EdPrice price={price} originalPrice={originalPrice} size="md" className="flex-1" />
        {onCart && (
          <EdButton variant="outline" size="sm" onClick={onCart} disabled={disabled}>
            장바구니
          </EdButton>
        )}
        <EdButton variant="ink" size="md" onClick={onBuy} disabled={disabled}>
          바로 구매
        </EdButton>
      </div>
    </div>
  );
}
