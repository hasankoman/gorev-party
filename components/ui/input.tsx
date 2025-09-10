import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    const baseStyles =
      "w-full p-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors";
    const normalStyles = "border-gray-300 focus:ring-button";
    const errorStyles = "border-red-500 bg-red-50 focus:ring-red-500";

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseStyles} ${
            error ? errorStyles : normalStyles
          } ${className}`}
          {...props}
        />
        {error && <p className="text-red-300 text-sm mt-1">{error}</p>}
        {helperText && !error && (
          <p className="text-white/60 text-sm mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

