'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function Card({ children, className = '', hover = true, glow = false }: CardProps) {
  const hoverClass = hover ? 'hover:shadow-lg hover:border-[rgba(109,64,212,0.2)]' : '';
  const glowClass = glow ? 'shadow-lg' : '';

  return (
    <div
      className={`admin-glass-card p-6 transition-all duration-200 ${hoverClass} ${glowClass} ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  iconColor?: string;
  trend?: { value: number; positive: boolean };
}

export function StatCard({
  icon,
  value,
  label,
  iconColor = 'text-primary-600',
  trend,
}: StatCardProps) {
  return (
    <Card className="admin-stats-card">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center bg-primary-50 ${iconColor}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
        {trend && (
          <div
            className={`text-sm font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </Card>
  );
}
