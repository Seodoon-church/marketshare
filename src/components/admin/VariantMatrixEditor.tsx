'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/Input';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VariantRow {
  sku: string;
  options: Record<string, string>;
  price: number;
  stock: number;
}

export interface VariantMatrixEditorProps {
  options: { name: string; values: string[] }[];
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Cartesian product of option values */
function cartesian(
  opts: { name: string; values: string[] }[]
): Record<string, string>[] {
  const filtered = opts.filter((o) => o.name && o.values.length > 0);
  if (filtered.length === 0) return [];

  return filtered.reduce<Record<string, string>[]>(
    (acc, opt) => {
      if (acc.length === 0) {
        return opt.values.map((v) => ({ [opt.name]: v }));
      }
      const result: Record<string, string>[] = [];
      for (const existing of acc) {
        for (const v of opt.values) {
          result.push({ ...existing, [opt.name]: v });
        }
      }
      return result;
    },
    []
  );
}

/** Build a key from an options record for matching */
function optionsKey(opts: Record<string, string>): string {
  return Object.entries(opts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function VariantMatrixEditor({
  options,
  variants,
  onChange,
}: VariantMatrixEditorProps) {
  // "Apply all" row values
  const [applyAllPrice, setApplyAllPrice] = useState('');
  const [applyAllStock, setApplyAllStock] = useState('');
  const [applyAllSku, setApplyAllSku] = useState('');

  // Generate cartesian product from options
  const combinations = useMemo(() => cartesian(options), [options]);

  // Option names for table headers
  const optionNames = useMemo(
    () => options.filter((o) => o.name && o.values.length > 0).map((o) => o.name),
    [options]
  );

  // Build existing variant lookup
  const existingMap = useMemo(() => {
    const map = new Map<string, VariantRow>();
    for (const v of variants) {
      map.set(optionsKey(v.options), v);
    }
    return map;
  }, [variants]);

  // When options change, regenerate matrix preserving existing data
  useEffect(() => {
    if (combinations.length === 0) {
      if (variants.length > 0) {
        onChange([]);
      }
      return;
    }

    const newVariants: VariantRow[] = combinations.map((combo) => {
      const key = optionsKey(combo);
      const existing = existingMap.get(key);
      if (existing) {
        return { ...existing, options: combo };
      }
      return {
        sku: '',
        options: combo,
        price: 0,
        stock: 0,
      };
    });

    // Only update if actually different
    const currentKeys = variants.map((v) => optionsKey(v.options)).join(',');
    const newKeys = newVariants.map((v) => optionsKey(v.options)).join(',');
    if (currentKeys !== newKeys) {
      onChange(newVariants);
    }
  }, [combinations]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateVariant = useCallback(
    (index: number, field: keyof VariantRow, value: string | number) => {
      const updated = [...variants];
      updated[index] = { ...updated[index], [field]: value };
      onChange(updated);
    },
    [variants, onChange]
  );

  const handleApplyAll = () => {
    if (!applyAllPrice && !applyAllStock && !applyAllSku) return;

    const updated = variants.map((v) => ({
      ...v,
      ...(applyAllPrice ? { price: Number(applyAllPrice) } : {}),
      ...(applyAllStock ? { stock: Number(applyAllStock) } : {}),
      ...(applyAllSku ? { sku: applyAllSku } : {}),
    }));
    onChange(updated);
  };

  if (optionNames.length === 0 || combinations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
        <p className="text-sm text-gray-400">
          옵션을 추가하면 조합별 가격/재고를 설정할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        총 {combinations.length}개 조합
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {optionNames.map((name) => (
                <th
                  key={name}
                  className="px-3 py-2.5 text-left font-medium text-gray-500"
                >
                  {name}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right font-medium text-gray-500 w-32">
                가격
              </th>
              <th className="px-3 py-2.5 text-right font-medium text-gray-500 w-28">
                재고
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-gray-500 w-36">
                SKU
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {/* Apply All Row */}
            <tr className="bg-primary/5">
              {optionNames.map((name) => (
                <td
                  key={`apply-${name}`}
                  className="px-3 py-2 text-xs font-medium text-primary"
                >
                  {name === optionNames[0] ? '동일 적용' : ''}
                </td>
              ))}
              <td className="px-3 py-2">
                <input
                  type="number"
                  placeholder="가격"
                  value={applyAllPrice}
                  onChange={(e) => setApplyAllPrice(e.target.value)}
                  className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-sm text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  placeholder="재고"
                  value={applyAllStock}
                  onChange={(e) => setApplyAllStock(e.target.value)}
                  className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-sm text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="SKU"
                    value={applyAllSku}
                    onChange={(e) => setApplyAllSku(e.target.value)}
                    className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={handleApplyAll}
                    className="h-8 flex-shrink-0 rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary-dark transition-colors"
                  >
                    적용
                  </button>
                </div>
              </td>
            </tr>

            {/* Variant Rows */}
            {variants.map((variant, idx) => (
              <tr key={optionsKey(variant.options)} className="hover:bg-gray-50/50">
                {optionNames.map((name) => (
                  <td key={name} className="px-3 py-2 text-gray-700">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                      {variant.options[name]}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={variant.price || ''}
                    onChange={(e) =>
                      updateVariant(idx, 'price', Number(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-sm text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={variant.stock || ''}
                    onChange={(e) =>
                      updateVariant(idx, 'stock', Number(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-sm text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) =>
                      updateVariant(idx, 'sku', e.target.value)
                    }
                    placeholder="SKU"
                    className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
