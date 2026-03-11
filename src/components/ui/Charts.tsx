'use client';

import { cn } from '@/lib/utils/cn';

// ============================================
// BarChart
// ============================================

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  showValues?: boolean;
  formatValue?: (v: number) => string;
  className?: string;
}

export function BarChart({
  data,
  height = 200,
  orientation = 'vertical',
  showValues = true,
  formatValue = (v) => v.toLocaleString(),
  className,
}: BarChartProps) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  if (orientation === 'horizontal') {
    return (
      <div className={cn('space-y-3', className)}>
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-right text-xs text-gray-500 truncate" title={item.label}>
              {item.label}
            </span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', item.color || 'bg-primary')}
                style={{ width: `${(item.value / maxVal) * 100}%` }}
              />
            </div>
            {showValues && (
              <span className="w-16 shrink-0 text-xs font-medium text-gray-700 text-right">
                {formatValue(item.value)}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-end gap-2', className)} style={{ height }}>
      {data.map((item, i) => {
        const pct = (item.value / maxVal) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
            {showValues && (
              <span className="text-[10px] font-medium text-gray-500">
                {formatValue(item.value)}
              </span>
            )}
            <div
              className={cn(
                'w-full max-w-[40px] rounded-t-md transition-all duration-700',
                item.color || 'bg-primary'
              )}
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            <span className="text-[10px] text-gray-400 truncate max-w-full" title={item.label}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// LineChart
// ============================================

interface LineChartData {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showDots?: boolean;
  formatValue?: (v: number) => string;
  className?: string;
}

export function LineChart({
  data,
  height = 200,
  color = '#6366f1',
  showGrid = true,
  showDots = true,
  formatValue = (v) => v.toLocaleString(),
  className,
}: LineChartProps) {
  if (data.length < 2) return null;

  const padding = { top: 20, right: 10, bottom: 30, left: 10 };
  const vw = 500;
  const vh = height;
  const chartW = vw - padding.left - padding.right;
  const chartH = vh - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
    ...d,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `M${points[0].x},${padding.top + chartH} ${points.map((p) => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${padding.top + chartH} Z`;

  const gridLines = showGrid ? [0.25, 0.5, 0.75, 1].map((pct) => ({
    y: padding.top + chartH - pct * chartH,
    label: formatValue(Math.round(minVal + pct * range)),
  })) : [];

  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full" style={{ height }}>
        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={padding.left} y1={g.y}
              x2={vw - padding.right} y2={g.y}
              stroke="#e5e7eb" strokeDasharray="4 4" strokeWidth={0.5}
            />
            <text x={padding.left + 2} y={g.y - 4} fontSize={9} fill="#9ca3af">
              {g.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={color} opacity={0.08} />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {showDots && points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="white" stroke={color} strokeWidth={2} />
            <title>{`${p.label}: ${formatValue(p.value)}`}</title>
          </g>
        ))}

        {/* X labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={vh - 5}
            textAnchor="middle"
            fontSize={10}
            fill="#6b7280"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ============================================
// DonutChart
// ============================================

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}

export function DonutChart({
  segments,
  size = 160,
  centerLabel,
  centerValue,
  className,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  let accumulated = 0;
  const stops = segments.map((s) => {
    const start = accumulated;
    const pct = (s.value / total) * 100;
    accumulated += pct;
    return `${s.color} ${start}% ${accumulated}%`;
  }).join(', ');

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <div
          className="w-full h-full rounded-full"
          style={{ background: `conic-gradient(${stops})` }}
        />
        <div
          className="absolute inset-0 m-auto rounded-full bg-white flex flex-col items-center justify-center"
          style={{ width: size * 0.6, height: size * 0.6 }}
        >
          {centerValue && (
            <span className="text-lg font-bold text-gray-900">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-[10px] text-gray-400">{centerLabel}</span>
          )}
        </div>
      </div>
      <div className="space-y-2 min-w-0">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-gray-600 truncate">{s.label}</span>
            <span className="ml-auto font-medium text-gray-900">
              {((s.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MiniStat - 미니 지표 카드
// ============================================

interface MiniStatProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function MiniStat({ label, value, change, icon, className }: MiniStatProps) {
  return (
    <div className={cn('rounded-xl border border-gray-100 bg-white p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className="mt-1 text-xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {change !== undefined && (
        <div className={cn('mt-1 text-xs font-medium', change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
