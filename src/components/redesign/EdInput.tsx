import { forwardRef } from 'react';

interface EdInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const EdInput = forwardRef<HTMLInputElement, EdInputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="block font-mono text-[11px] tracking-[.1em] text-ink-light mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className="w-full bg-transparent border-0 border-b border-hairline text-ink text-[15px] py-2.5 px-0 placeholder:text-ink-light/50 focus:border-b-2 focus:border-ink focus:outline-none transition-colors"
          {...props}
        />
      </div>
    );
  }
);

EdInput.displayName = 'EdInput';
