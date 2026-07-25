// 팰월드 게임 UI 스타일 범용 뱃지 컴포넌트
import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "accent" | "partner" | "passive" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
}) => {
  return (
    <span
      className={`pal-badge pal-badge--${variant} pal-badge--${size} ${className}`}
    >
      {children}
    </span>
  );
};
