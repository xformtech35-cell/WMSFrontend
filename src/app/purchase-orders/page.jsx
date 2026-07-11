'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Download, Loader2, Package, Search, X, ClipboardList, Info, Sparkles } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import SlideOverForm from '@/components/ui/SlideOverForm';
import { usePaginatedItems } from '@/lib/hooks/usePaginatedItems';
import TablePagination from '@/components/TablePagination';
import api from '@/lib/api';
import { exportWmsWorkbook } from '@/lib/exportExcel';
import { toast } from 'sonner';
import PermissionGate from '@/components/PermissionGate';
import { P } from '@/lib/permissions';

const normalizePoStatus = (status) => {
  const raw = String(status ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (!raw) return '';
  if (raw === 'OPEN' || raw === 'NEW') return 'PENDING';
  if (raw.includes('PARTIAL')) return 'PARTIAL';
  if (raw === 'RECEIVED') return 'RECEIVED';
  if (raw === 'PENDING') return 'PENDING';
  return raw;
};

async function exportPOs(pos) {
  await exportWmsWorkbook({
    fileName: `purchase_orders_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
    sheetName: 'Purchase Orders',
    title: 'WMS Purchase Orders Export',
    columns: [
      { header: 'PO Number', key: 'poNumber', width: 16 },
      { header: 'Supplier', key: 'supplier', width: 24 },
      { header: 'Status', key: 'status', width: 14, align: 'center' },
      { header: 'Line Count', key: 'lineCount', width: 14, align: 'right' },
      { header: 'Date', key: 'date', width: 18, align: 'center' },
    ],
    rows: pos.map((p) => ({
      poNumber: p.poNumber,
      supplier: p.supplier ?? '',
      status: p.status ?? '',
      lineCount: p.lineCount ?? p.lines?.length ?? 0,
      date: p.expectedArrivalDate || p.createdAt ? format(new Date(p.expectedArrivalDate || p.createdAt), 'dd MMM yyyy') : '',
    })),
  });
  toast.success('Purchase orders exported to Excel');
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPoId, setSelectedPoId] = useState('');

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => api.get('/purchase-orders').then((r) => r.data ?? []),
    staleTime: 30_000,
    retry: false,
  });

  const { data: selectedPO, isLoading: selectedPoLoading } = useQuery({
    queryKey: ['purchaseOrderDetail', selectedPoId],
    queryFn: () => api.get(`/purchase-orders/${selectedPoId}`).then((r) => r.data),
    enabled: open && !!selectedPoId,
    staleTime: 30_000,
    retry: false,
  });

  const filteredPOs = useMemo(() => {
    let list = purchaseOrders ?? [];
    if (statusFilter !== 'ALL') {
      list = list.filter((p) => normalizePoStatus(p.status) === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => String(p.poNumber ?? '').toLowerCase().includes(q) || String(p.supplier ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [purchaseOrders, statusFilter, search]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visiblePOs,
  } = usePaginatedItems(filteredPOs, { resetDeps: [search, statusFilter] });

  const stats = useMemo(() => {
    const pos = purchaseOrders ?? [];
    return {
      total:    pos.length,
      pending:  pos.filter((p) => normalizePoStatus(p.status) === 'PENDING').length,
      received: pos.filter((p) => normalizePoStatus(p.status) === 'RECEIVED').length,
      partial:  pos.filter((p) => normalizePoStatus(p.status) === 'PARTIAL').length,
    };
  }, [purchaseOrders]);

  return (
    <PermissionGate permission={P.PURCHASE_VIEW} fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}>
      <div className="space-y-6">
        <PageHeader
          title="Purchase Orders"
          description="View and track supplier purchase orders."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5" onClick={() => router.push('/purchase-orders/replenishment')}>
                <Sparkles className="size-3.5" /> AI Replenishment
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportPOs(purchaseOrders ?? [])}>
                <Download className="size-3.5 mr-1.5" /> Export Excel
              </Button>
            </div>
          }
        />

        {/* Details SlideOver */}
        <SlideOverForm
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setSelectedPoId('');
            }
          }}
          title="Purchase Order Details"
          description={selectedPO ? `Purchase Order: ${selectedPO.poNumber}` : 'Loading...'}
        >
          {selectedPoLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Fetching details...</p>
            </div>
          ) : selectedPO ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/60 bg-muted/10 p-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">PO Number</Label>
                  <p className="font-mono font-semibold text-foreground mt-0.5">{selectedPO.poNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Supplier</Label>
                  <p className="font-semibold text-foreground mt-0.5">{selectedPO.supplier || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={normalizePoStatus(selectedPO.status)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Expected Arrival</Label>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedPO.expectedArrivalDate
                      ? format(new Date(selectedPO.expectedArrivalDate), 'dd MMM yyyy')
                      : '—'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Line Items</Label>
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="py-2">SKU Code</TableHead>
                        <TableHead className="py-2 text-right">Ordered Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.lines && selectedPO.lines.length > 0 ? (
                        selectedPO.lines.map((line) => (
                          <TableRow key={line.id} className="hover:bg-transparent">
                            <TableCell className="font-mono font-semibold py-2.5">{line.skuCode}</TableCell>
                            <TableCell className="text-right py-2.5 font-semibold">{line.orderedQuantity}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                            No lines defined.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setOpen(false)} className="w-full sm:w-auto">Close Details</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-destructive">Failed to load PO details.</p>
          )}
        </SlideOverForm>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard title="Total POs"     value={stats.total}    icon={Package} kpiVariant="blue"   accentClass="text-blue-500"   iconBg="bg-blue-500/10" />
          <StatCard title="Pending"       value={stats.pending}  icon={Package} kpiVariant="amber"  accentClass="text-amber-500"  iconBg="bg-amber-500/10" />
          <StatCard title="Received"      value={stats.received} icon={Package} kpiVariant="green"  accentClass="text-emerald-500" iconBg="bg-emerald-500/10" />
          <StatCard title="Partial"       value={stats.partial}  icon={Package} kpiVariant="rose"   accentClass="text-rose-500"   iconBg="bg-rose-500/10" />
        </div>

        {/* Filter bar + table */}
        <div className="glass-card overflow-hidden rounded-[2rem]">
          <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 h-8 text-sm w-full sm:max-w-64" placeholder="Search PO number, supplier…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-40 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['ALL', 'PENDING', 'PARTIAL', 'RECEIVED'].map((s) => (
                  <SelectItem key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || statusFilter !== 'ALL') && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setSearch(''); setStatusFilter('ALL'); }}>
                <X className="size-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : visiblePOs.length ? (
                visiblePOs.map((po) => (
                  <TableRow key={po.id} className="table-row-hover">
                    <TableCell className="font-bold font-mono text-primary">{po.poNumber}</TableCell>
                    <TableCell className="font-medium">{po.supplier || '—'}</TableCell>
                    <TableCell><StatusBadge status={normalizePoStatus(po.status)} /></TableCell>
                    <TableCell className="font-semibold">{po.lineCount ?? po.lines?.length ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {(po.expectedArrivalDate || po.createdAt)
                        ? format(new Date(po.expectedArrivalDate || po.createdAt), 'dd MMM yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                        setSelectedPoId(String(po.id));
                        setOpen(true);
                      }}>
                        <Info className="size-3 mr-1" /> View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                    <Package className="mx-auto mb-3 size-8 opacity-30" />
                    {search || statusFilter !== 'ALL' ? 'No POs match the current filter.' : 'No purchase orders available yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            onPrev={() => setPage((v) => Math.max(1, v - 1))}
            onNext={() => setPage((v) => Math.min(totalPages, v + 1))}
            onFirst={() => setPage(1)}
            onLast={() => setPage(totalPages)}
          />
        </div>
      </div>
    </PermissionGate>
  );
}
