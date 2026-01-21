'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'admin'
    | 'coordinator'
    | 'member'
    | 'purple'
    | 'active'
    | 'inactive'
    | 'success'
    | 'warning'
    | 'error';
  className?: string;
  dot?: boolean;
}

export default function Badge({
  children,
  variant = 'purple',
  className = '',
  dot = false,
}: BadgeProps) {
  const variantClasses: Record<string, string> = {
    admin: 'admin-badge-admin',
    coordinator: 'admin-badge-coordinator',
    member: 'admin-badge-member',
    purple: 'admin-badge-purple',
    active: 'admin-badge-active',
    inactive: 'admin-badge-inactive',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-600',
  };

  return (
    <span className={`admin-badge ${variantClasses[variant]} ${className}`}>
      {dot && (
        <span
          className={`w-2 h-2 rounded-full ${variant === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}
        />
      )}
      {children}
    </span>
  );
}

// Role badge helper
export function RoleBadge({ role }: { role: 'admin' | 'coordinator' | 'member' }) {
  return <Badge variant={role}>{role}</Badge>;
}
