'use client';
export const dynamic = 'force-dynamic';

import { Fragment, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  Package,
  PackageCheck,
  Plus,
  Search,
  Ship,
  ShoppingCart,
  Trash2,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import SlideOverForm from '@/components/ui/SlideOverForm';
import { SheetFooter } from '@/components/ui/sheet';
import api from '@/lib/api';
import { exportWmsWorkbook } from '@/lib/exportExcel';
import { usePaginatedItems } from '@/lib/hooks/usePaginatedItems';
import TablePagination from '@/components/TablePagination';
import { toast } from 'sonner';

// ─── Constants ──────────────────────────────────────────────────────────────
const COURIERS = ['Blue Dart', 'Delhivery', 'DTDC', 'FedEx', 'Ekart', 'Shadowfax', 'Xpressbees', 'Other'];
const STATUS_FLOW = ['OPEN', 'RESERVED', 'PICKED', 'PACKED', 'SHIPPED', 'CANCELLED'];

const orderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  lines: z.array(z.object({
    skuCode: z.string().min(1, 'SKU code is required'),
    quantity: z.coerce.number().int().min(1, 'Minimum 1'),
  })).min(1, 'At least one order line is required'),
});

const shipSchema = z.object({
  orderId: z.coerce.number().int().positive('Order is required'),
  awbNumber: z.string().min(1, 'AWB number is required'),
  courierName: z.string().min(1, 'Courier is required'),
});

// ─── Status step indicator ───────────────────────────────────────────────────
const STEPS = ['OPEN', 'RESERVED', 'PICKED', 'PACKED', 'SHIPPED'];

function OrderFlowStep({ status }) {
  const idx = STEPS.indexOf((status ?? 'OPEN').toUpperCase());
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div
            className={`size-2 rounded-full transition-colors ${
              i < idx ? 'bg-emerald-500' : i === idx ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
          {i < STEPS.length - 1 && (
            <div className={`h-px w-4 ${i < idx ? 'bg-emerald-500/60' : 'bg-muted-foreground/20'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Pick tasks sub-row ──────────────────────────────────────────────────────
function PickTasksRow({ orderId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['order-pick-tasks', orderId],
    queryFn: () => api.get(`/orders/${orderId}/pick-tasks`).then((r) => r.data ?? []),
    enabled: Boolean(orderId),
    staleTime: 30_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 px-4 py-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }
  if (!data?.length) {
    return (
      <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
        <Package className="size-4 opacity-40" />
        No pick tasks generated yet for this order.
      </div>
    );
  }
  return (
    <div className="bg-muted/20 border-t border-border/40">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-8 text-xs">#</TableHead>
              <TableHead className="text-xs">SKU</TableHead>
              <TableHead className="text-xs">Bin</TableHead>
              <TableHead className="text-xs">Qty</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((task, i) => (
              <TableRow key={task.id} className="hover:bg-muted/30">
                <TableCell className="pl-8 text-xs text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-mono text-xs font-medium">{task.skuCode ?? task.skuId ?? '—'}</TableCell>
                <TableCell className="font-mono text-xs text-primary">{task.binBarcode ?? '—'}</TableCell>
                <TableCell className="font-semibold text-sm">{task.quantity ?? 1}</TableCell>
                <TableCell><StatusBadge status={task.state ?? 'PENDING'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Export helper ───────────────────────────────────────────────────────────
async function exportOrdersExcel(orders) {
  await exportWmsWorkbook({
    fileName: `outbound_orders_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
    sheetName: 'Outbound Orders',
    title: 'WMS Outbound Orders Export',
    columns: [
      { header: 'Order ID',    key: 'id',           width: 12,  align: 'right' },
      { header: 'Customer',    key: 'customerName', width: 26 },
      { header: 'Status',      key: 'status',       width: 14,  align: 'center' },
      { header: 'Created At',  key: 'createdAt',    width: 20,  align: 'center' },
    ],
    rows: orders.map((o) => ({
      id:           o.id,
      customerName: o.customerName ?? '',
      status:       o.status ?? o.state ?? '',
      createdAt:    o.createdAt ? format(new Date(o.createdAt), 'dd MMM yyyy') : '',
    })),
  });
  toast.success('Orders exported to Excel');
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function OutboundPage() {
  const queryClient = useQueryClient();

  // UI state
  const [createOpen, setCreateOpen]   = useState(false);
  const [shipOpen, setShipOpen]       = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [expandedId, setExpandedId]   = useState(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCourier, setSelectedCourier] = useState('');
  const [shipSuccess, setShipSuccess] = useState(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: orders, isLoading } = useQuery({
    queryKey: ['outbound-orders'],
    queryFn: () => api.get('/orders').then((r) => r.data ?? []),
    staleTime: 20_000,
    refetchInterval: 30_000,
    retry: false,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const { register: regOrder, control, handleSubmit: handleOrder, reset: resetOrder,
          formState: { errors: orderErrors } } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: { customerName: '', lines: [{ skuCode: '', quantity: 1 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const { register: regShip, handleSubmit: handleShip, reset: resetShip,
          setValue: setShipValue, formState: { errors: shipErrors } } = useForm({
    resolver: zodResolver(shipSchema),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/orders', payload).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`Order created — pick tasks ready`);
      queryClient.invalidateQueries({ queryKey: ['outbound-orders'] });
      setCreateOpen(false);
      resetOrder();
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create order'),
  });

  const shipMutation = useMutation({
    mutationFn: (payload) => api.post('/shipping/confirm', payload).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`Shipment confirmed — AWB ${data.awbNumber}`);
      setShipSuccess(data);
      queryClient.invalidateQueries({ queryKey: ['outbound-orders'] });
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to confirm shipment'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.patch(`/orders/${id}/cancel`),
    onSuccess: () => {
      toast.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['outbound-orders'] });
      setCancelTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to cancel'),
  });

  // ── Derived data ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const all = orders ?? [];
    const byStatus = (s) => all.filter((o) => (o.status ?? o.state ?? '').toUpperCase() === s).length;
    return {
      total:    all.length,
      open:     byStatus('OPEN') + byStatus('RESERVED'),
      packed:   byStatus('PACKED'),
      shipped:  byStatus('SHIPPED'),
    };
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders ?? [];
    if (statusFilter !== 'ALL') {
      list = list.filter((o) => (o.status ?? o.state ?? '').toUpperCase() === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          String(o.customerName ?? '').toLowerCase().includes(q) ||
          String(o.id ?? '').includes(q) ||
          String(o.soNumber ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, statusFilter, search]);

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visibleOrders,
  } = usePaginatedItems(filtered, { resetDeps: [search, statusFilter] });

  const packedOrders = useMemo(
    () => (orders ?? []).filter((o) => (o.status ?? o.state ?? '').toUpperCase() === 'PACKED'),
    [orders],
  );

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Outbound"
        description="Manage sales orders from creation through picking, packing, and dispatch."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportOrdersExcel(orders ?? [])} disabled={!orders?.length}>
              <Download className="size-3.5 mr-1.5" /> Export Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShipSuccess(null);
                resetShip();
                setSelectedCourier('');
                setShipOpen(true);
              }}
            >
              <Ship className="size-3.5 mr-1.5" /> Confirm Shipment
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5 mr-1.5" /> Create Order
            </Button>
          </div>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Orders"    value={stats.total}   icon={ShoppingCart}  kpiVariant="blue"  accentClass="text-blue-500"    iconBg="bg-blue-500/10" />
        <StatCard title="In Progress"     value={stats.open}    icon={ArrowRight}    kpiVariant="amber" accentClass="text-amber-500"   iconBg="bg-amber-500/10" />
        <StatCard title="Ready to Ship"   value={stats.packed}  icon={PackageCheck}  kpiVariant="violet" accentClass="text-violet-500" iconBg="bg-violet-500/10" />
        <StatCard title="Shipped Today"   value={stats.shipped} icon={Truck}         kpiVariant="green" accentClass="text-emerald-500" iconBg="bg-emerald-500/10" />
      </div>

      {/* Orders Table */}
      <Card className="glass-card overflow-hidden rounded-[2rem]">
        <CardHeader className="border-b border-border/60 py-3 px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="size-4 text-primary" />
              Sales Orders
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* Status filter pills */}
              <div className="flex flex-wrap gap-1">
                {['ALL', ...STATUS_FLOW].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      statusFilter === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-8 pl-8 pr-8 text-sm w-52"
                  placeholder="Search customer or order…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setSearch('')}
                  >
                    <X className="size-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flow</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : visibleOrders.length ? (
                visibleOrders.map((order) => {
                  const statusStr = (order.status ?? order.state ?? '').toUpperCase();
                  const isExpanded = expandedId === order.id;
                  const canCancel = !['SHIPPED', 'CANCELLED'].includes(statusStr);
                  const canShip   = statusStr === 'PACKED';

                  return (
                    <Fragment key={order.id}>
                      <TableRow
                        className="table-row-hover cursor-pointer"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <TableCell className="pl-4">
                          {isExpanded
                            ? <ChevronDown className="size-3.5 text-muted-foreground" />
                            : <ChevronRight className="size-3.5 text-muted-foreground" />}
                        </TableCell>
                        <TableCell className="font-bold text-primary">#{order.id}</TableCell>
                        <TableCell className="font-medium">{order.customerName ?? '—'}</TableCell>
                        <TableCell>
                          <StatusBadge status={statusStr || 'OPEN'} />
                        </TableCell>
                        <TableCell>
                          <OrderFlowStep status={statusStr} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy') : '—'}
                        </TableCell>
                        <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {canShip && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-violet-500/40 text-violet-600 hover:bg-violet-500/10"
                                onClick={() => {
                                  setShipValue('orderId', order.id);
                                  setShipSuccess(null);
                                  setSelectedCourier('');
                                  setShipOpen(true);
                                }}
                              >
                                <Ship className="size-3 mr-1" /> Ship
                              </Button>
                            )}
                            {canCancel && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => setCancelTarget(order)}
                              >
                                <XCircle className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-transparent hover:bg-transparent">
                          <TableCell colSpan={7} className="p-0">
                            <PickTasksRow orderId={order.id} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    <ShoppingCart className="mx-auto mb-3 size-8 opacity-30" />
                    {search || statusFilter !== 'ALL'
                      ? 'No orders match the current filter.'
                      : 'No outbound orders yet.'}
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
        </CardContent>
      </Card>

      {/* ── Create Order Side Sheet ──────────────────────────────────────────── */}
      <SlideOverForm
        open={createOpen}
        onOpenChange={(v) => { setCreateOpen(v); if (!v) resetOrder(); }}
        title="Create Sales Order"
        description="Add customer details and SKU lines. Pick tasks are auto-generated."
      >
        <form onSubmit={handleOrder((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input id="customerName" placeholder="e.g. Acme Corp" {...regOrder('customerName')} />
            {orderErrors.customerName && (
              <p className="text-xs text-destructive">{orderErrors.customerName.message}</p>
            )}
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Order Lines</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => append({ skuCode: '', quantity: 1 })}>
                <Plus className="size-3.5 mr-1" /> Add Line
              </Button>
            </div>
            {fields.map((field, i) => (
              <div key={field.id} className="rounded-xl border border-border/60 p-3 space-y-2 relative">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">SKU Code</Label>
                    <Input placeholder="e.g. SKU-001" className="h-8 text-sm" {...regOrder(`lines.${i}.skuCode`)} />
                    {orderErrors.lines?.[i]?.skuCode && (
                      <p className="text-[10px] text-destructive">{orderErrors.lines[i].skuCode.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input type="number" min={1} className="h-8 text-sm" {...regOrder(`lines.${i}.quantity`)} />
                    {orderErrors.lines?.[i]?.quantity && (
                      <p className="text-[10px] text-destructive">{orderErrors.lines[i].quantity.message}</p>
                    )}
                  </div>
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); resetOrder(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? <><Loader2 className="size-3.5 mr-2 animate-spin" /> Creating…</>
                : <><Plus className="size-3.5 mr-1.5" /> Create Order</>}
            </Button>
          </SheetFooter>
        </form>
      </SlideOverForm>

      {/* ── Confirm Shipment Sheet ───────────────────────────────────────────── */}
      <SlideOverForm
        open={shipOpen}
        onOpenChange={(v) => {
          setShipOpen(v);
          if (!v) { resetShip(); setShipSuccess(null); setSelectedCourier(''); }
        }}
        title="Confirm Shipment"
        description="Enter the AWB number and courier to dispatch the packed order."
      >
        {shipSuccess ? (
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-lg">Shipment Confirmed!</p>
              <p className="text-muted-foreground text-sm mt-1">
                AWB: <span className="font-mono font-bold text-foreground">{shipSuccess.awbNumber}</span>
              </p>
              <p className="text-muted-foreground text-sm">
                Courier: <span className="font-medium text-foreground">{shipSuccess.courierName}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Button variant="outline" onClick={() => { setShipSuccess(null); resetShip(); setSelectedCourier(''); }}>
                Confirm Another Shipment
              </Button>
              <Button onClick={() => setShipOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleShip((d) => shipMutation.mutate(d))} className="space-y-4">
            {/* Quick select from packed orders */}
            {packedOrders.length > 0 && (
              <div className="space-y-1.5">
                <Label>Quick Select (Packed Orders)</Label>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto rounded-xl border border-border/60 p-2">
                  {packedOrders.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setShipValue('orderId', o.id)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left"
                    >
                      <span className="font-medium">#{o.id} — {o.customerName}</span>
                      <Ship className="size-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ship-orderId">Order ID</Label>
              <Input id="ship-orderId" type="number" placeholder="e.g. 42" {...regShip('orderId')} />
              {shipErrors.orderId && <p className="text-xs text-destructive">{shipErrors.orderId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ship-awb">AWB Number</Label>
              <Input id="ship-awb" placeholder="e.g. AWB-20260320-001" className="font-mono" {...regShip('awbNumber')} />
              {shipErrors.awbNumber && <p className="text-xs text-destructive">{shipErrors.awbNumber.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ship-courier">Courier</Label>
              <Select
                value={selectedCourier}
                onValueChange={(v) => { setSelectedCourier(v); setShipValue('courierName', v); }}
              >
                <SelectTrigger id="ship-courier">
                  <SelectValue placeholder="Select courier…" />
                </SelectTrigger>
                <SelectContent>
                  {COURIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {shipErrors.courierName && <p className="text-xs text-destructive">{shipErrors.courierName.message}</p>}
            </div>
            <SheetFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShipOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={shipMutation.isPending}>
                {shipMutation.isPending
                  ? <><Loader2 className="size-3.5 mr-2 animate-spin" /> Confirming…</>
                  : <><Check className="size-3.5 mr-1.5" /> Confirm Shipment</>}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SlideOverForm>

      {/* ── Cancel Confirmation Dialog ───────────────────────────────────────── */}
      <Dialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order #{cancelTarget?.id}?</DialogTitle>
            <DialogDescription>
              This will cancel the order for <strong>{cancelTarget?.customerName}</strong> and release reserved
              inventory. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep Order</Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelTarget.id)}
            >
              {cancelMutation.isPending && <Loader2 className="size-3.5 mr-2 animate-spin" />}
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
