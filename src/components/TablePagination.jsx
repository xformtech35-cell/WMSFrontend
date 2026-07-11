import { Button } from '@/components/ui/button';

export default function TablePagination({
  page,
  totalPages,
  totalItems,
  startItem,
  endItem,
  onPrev,
  onNext,
  onFirst,
  onLast,
  className = '',
}) {
  if (totalItems === 0) return null;

  return (
    <div className={`flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-xs text-muted-foreground sm:text-sm">
        Showing <span className="font-medium text-foreground">{startItem}</span>-<span className="font-medium text-foreground">{endItem}</span>
        {' '}of <span className="font-medium text-foreground">{totalItems}</span> records
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onFirst} disabled={page <= 1}>First</Button>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onPrev} disabled={page <= 1}>Previous</Button>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
          Page <span className="text-foreground">{page}</span> / <span className="text-foreground">{totalPages}</span>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onNext} disabled={page >= totalPages}>Next</Button>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onLast} disabled={page >= totalPages}>Last</Button>
      </div>
    </div>
  );
}
