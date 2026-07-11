import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
    ACTIVE: {
        dot: 'bg-emerald-500',
        cls: 'bg-emerald-500/10 text-emerald-700 ring-emerald-400/30 dark:text-emerald-300 dark:bg-emerald-500/15',
    },
    NEAR_EXPIRY: {
        dot: 'bg-amber-500',
        cls: 'bg-amber-500/10 text-amber-700 ring-amber-400/30 dark:text-amber-300 dark:bg-amber-500/15',
        pulse: true,
    },
    EXPIRED: {
        dot: 'bg-rose-500',
        cls: 'bg-rose-500/10 text-rose-700 ring-rose-400/30 dark:text-rose-300 dark:bg-rose-500/15',
    },
    QUARANTINED: {
        dot: 'bg-purple-600',
        cls: 'bg-purple-500/10 text-purple-700 ring-purple-400/30 dark:text-purple-300 dark:bg-purple-500/15',
    }
};

function formatStatus(status) {
    return status
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BatchExpiryBadge({ status, showDot = true, className }) {
    const key = String(status ?? '').toUpperCase();
    const config = STATUS_CONFIG[key];
    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ring-1 ring-inset whitespace-nowrap tracking-wide', config?.cls ?? 'bg-muted text-muted-foreground ring-border', className)}>
            {showDot && (
                <span className={cn('inline-block size-[5px] shrink-0 rounded-full', config?.dot ?? 'bg-muted-foreground', config?.pulse && 'animate-pulse')} />
            )}
            {formatStatus(status ?? 'Unknown')}
        </span>
    );
}
