'use client';


import { cn } from '@/lib/utils/cn';
import { formatKRW } from '@/lib/utils/format';
import type { CartItem } from '@/types';
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number, options: Record<string, string>) => void;
  onRemove: (productId: string, options: Record<string, string>) => void;
  className?: string;
}

export function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  className,
}: CartItemCardProps) {
  const displayPrice = item.salePrice ?? item.price;
  const hasDiscount = item.salePrice !== null && item.salePrice < item.price;
  const lineTotal = displayPrice * item.quantity;

  return (
    <div className={cn('flex gap-4 p-5', className)}>
      {/* Product Image */}
      <a href={`/products/${item.productId}`} className="flex-shrink-0">
        <div className="h-24 w-24 overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 sm:h-28 sm:w-28">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingBagIcon className="h-8 w-8 text-gray-300" />
            </div>
          )}
        </div>
      </a>

      {/* Product Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <a
            href={`/products/${item.productId}`}
            className="text-sm font-medium text-gray-900 transition-colors hover:text-primary sm:text-base"
          >
            {item.name}
          </a>

          {/* Selected Options */}
          {Object.keys(item.options).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {Object.entries(item.options).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="mt-2 flex items-center gap-2">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatKRW(item.price)}
              </span>
            )}
            <span className="text-sm font-bold text-gray-900 sm:text-base">
              {formatKRW(displayPrice)}
            </span>
          </div>
        </div>

        {/* Quantity & Remove */}
        <div className="mt-3 flex items-center justify-between">
          {/* Quantity Selector */}
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
            <button
              onClick={() =>
                onUpdateQuantity(item.productId, item.quantity - 1, item.options)
              }
              className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
              disabled={item.quantity <= 1}
            >
              <MinusIcon className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min={1}
              max={item.stock}
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) {
                  onUpdateQuantity(item.productId, val, item.options);
                }
              }}
              className="h-8 w-10 border-x border-gray-200 bg-white text-center text-sm font-medium text-gray-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              onClick={() =>
                onUpdateQuantity(item.productId, item.quantity + 1, item.options)
              }
              className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
              disabled={item.quantity >= item.stock}
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Line Total & Remove */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-900">
              {formatKRW(lineTotal)}
            </span>
            <button
              onClick={() => onRemove(item.productId, item.options)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title="삭제"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
