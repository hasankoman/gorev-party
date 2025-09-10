import { type ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
}: ButtonProps) {
  const baseStyles =
    "font-bold rounded-lg shadow-md hover:scale-105 transition-transform focus:outline-none focus:ring-2";

  const variants = {
    primary:
      "bg-gradient-to-br from-button to-button-dark text-white focus:ring-button",
    secondary:
      "bg-gradient-to-br from-primary to-primary-dark text-white focus:ring-primary",
    accent:
      "bg-gradient-to-br from-accent-orange to-accent-orange-dark text-white focus:ring-accent-orange",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed hover:scale-100"
    : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

