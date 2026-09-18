import { cn } from '../lib/utils';

export function BrandMark({
  size = 'md',
  inverted = false,
  showProduct = true,
  product = 'Lecturer LMS',
  compact = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
  showProduct?: boolean;
  product?: string;
  /** Icon-only mark for collapsed sidebar */
  compact?: boolean;
}) {
  const mark =
    size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-11 w-11 text-base' : 'h-9 w-9 text-sm';
  const title =
    size === 'sm' ? 'text-[1.15rem]' : size === 'lg' ? 'text-[1.75rem]' : 'text-[1.35rem]';

  return (
    <div className={cn('flex items-center', compact ? 'justify-center' : 'gap-3')}>
      <div
        className={cn(
          'flex items-center justify-center rounded-[10px] font-semibold',
          mark,
          inverted ? 'bg-accent text-white' : 'bg-accent text-white',
        )}
        title={compact ? `SkillonX ${product}` : undefined}
      >
        S
      </div>
      {!compact ? (
        <div>
          <p
            className={cn(
              'font-display leading-none tracking-wide',
              title,
              inverted ? 'text-white' : 'text-ink',
            )}
          >
            SkillonX
          </p>
          {showProduct ? (
            <p
              className={cn(
                'mt-1 text-[11px] uppercase tracking-[0.18em]',
                inverted ? 'text-white/45' : 'text-ink-muted',
              )}
            >
              {product}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function RoleLabel({ role, roleLabel }: { role: string; roleLabel?: string }) {
  const label =
    roleLabel ||
    ({
      SUPER_ADMIN: 'Platform Administrator',
      COLLEGE_ADMIN: 'College Administrator',
      FACULTY: 'Faculty',
      ACCOUNTANT: 'Accountant',
      COE: 'Controller of Examinations',
      HOD: 'Head of Department',
      PRINCIPAL: 'Principal',
      IQAC_COORDINATOR: 'IQAC Coordinator',
      NBA_COORDINATOR: 'NBA Coordinator',
      LAB_ASSISTANT: 'Lab Assistant',
      MAINTENANCE_MANAGER: 'Maintenance Manager',
      FACILITIES_OFFICER: 'Facilities Officer',
      MAINTENANCE_STAFF: 'Maintenance Technician',
      IT_SUPPORT: 'IT Support',
    }[role] ??
      role);

  return <span className="text-xs text-ink-muted">{label}</span>;
}

export function isAdminRole(role?: string | null) {
  return role === 'SUPER_ADMIN' || role === 'COLLEGE_ADMIN';
}
