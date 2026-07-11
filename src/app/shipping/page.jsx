'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { usePaginatedItems } from '@/lib/hooks/usePaginatedItems';
import TablePagination from '@/components/TablePagination';
import { Ship, Search, Package, Check, Truck, Calendar, Hash, List, ArrowRight, ShieldCheck } from 'lucide-react';

const COURIERS = ['Blue Dart', 'Delhivery', 'DTDC', 'FedEx', 'Ekart', 'Shadowfax', 'Xpressbees', 'Other'];

const shipSchema = z.object({
  orderId: z.coerce.number().int().positive('Order ID is required'),
  awbNumber: z.string().min(1, 'AWB number is required'),
  courierName: z.string().min(1, 'Courier name is required'),
});

function ShipmentDetail({ result }) {
  const fields = [
    { icon: Hash,      label: 'Order ID',    value: result.orderId ?? result.salesOrderId },
    { icon: Ship,      label: 'AWB No.',     value: <span className="font-mono">{result.awbNumber}</span> },
    { icon: Truck,     label: 'Courier',     value: result.courierName },
    { icon: Check,     label: 'Status',      value: <StatusBadge status={result.status ?? 'SHIPPED'} /> },
    {
      icon: Calendar,
      label: 'Shipped At',
      value: result.shippedAt || result.createdAt ? new Date(result.shippedAt || result.createdAt).toLocaleString() : '—',
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden bg-slate-950/20">
      {fields.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3 px-4 py-3 text-sm border-b border-border/40 last:border-0">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground min-w-24">{label}</span>
          <span className="font-medium ml-auto text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ShippingPage() {
  const queryClient = useQueryClient();
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState('');
  
  // Carrier integration states
  const [ratesOrderId, setRatesOrderId] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: zodResolver(shipSchema) });

  // Packed orders ready to dispatch
  const { data: packedOrders, isLoading: packedLoading } = useQuery({
    queryKey: ['packed-orders'],
    queryFn: () => api.get('/orders').then((r) =>
      (r.data ?? []).filter((o) => (o.status ?? o.state ?? '').toUpperCase() === 'PACKED')
    ),
    staleTime: 15_000,
    refetchInterval: 15_000,
    retry: false,
  });

  // Fetch carrier rates comparison
  const { data: carrierRates = [], isLoading: ratesLoading } = useQuery({
    queryKey: ['carrier-rates', ratesOrderId],
    queryFn: () => api.get(`/carrier/rates?orderId=${ratesOrderId}`).then((r) => r.data ?? []),
    enabled: !!ratesOrderId,
  });

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems: visiblePackedOrders,
  } = usePaginatedItems(packedOrders ?? [], { resetDeps: [packedOrders?.length ?? 0] });

  // Confirm Manual Shipment Mutation
  const confirmMutation = useMutation({
    mutationFn: (data) => api.post('/shipping/confirm', data).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`Shipment confirmed — AWB ${data.awbNumber ?? ''}`);
      setConfirmed(data);
      setSelectedCourier('');
      reset();
      queryClient.invalidateQueries({ queryKey: ['packed-orders'] });
    },
    onError: () => toast.error('Failed to confirm shipment'),
  });

  // Automated Carrier Booking Mutation
  const bookCarrierMutation = useMutation({
    mutationFn: ({ orderId, carrierName }) => 
      api.post(`/carrier/generate-awb?orderId=${orderId}&carrierName=${carrierName}`).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`AWB Generated: ${data.awbNumber} via ${data.courierName}`);
      setConfirmed(data);
      setRatesOrderId(null);
      queryClient.invalidateQueries({ queryKey: ['packed-orders'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to book carrier');
    }
  });

  const lookupMutation = useMutation({
    mutationFn: (id) => api.get(`/shipping/${id}`).then((r) => r.data),
    onSuccess: (data) => setLookupResult(data),
    onError: () => {
      setLookupResult(null);
      toast.error('No shipment record found for that order');
    },
  });

  const handleLookup = (e) => {
    e.preventDefault();
    if (lookupId) lookupMutation.mutate(lookupId);
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Shipping & AWB Dispatch" description="Confirm dispatch, compare carrier rates, book automated shipments, and manage manifests." />
        <a 
          href={`/shipping/manifest?date=${todayStr}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-center"
        >
          <ShieldCheck className="size-4 text-emerald-500" /> Manifest Handover
        </a>
      </div>

      {/* Packed Orders Queue */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <List className="size-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Orders Ready to Dispatch</h2>
          <span className="ml-auto text-xs text-muted-foreground">{packedOrders?.length ?? 0} orders</span>
        </div>
        {packedLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (packedOrders?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <Check className="size-8 opacity-30" />
            <p className="text-sm">No packed orders waiting for dispatch</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto max-h-48 rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePackedOrders.map((order) => (
                    <TableRow key={order.id} className="table-row-hover">
                      <TableCell className="font-bold text-primary">#{order.id}</TableCell>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell><StatusBadge status={order.status ?? order.state} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                          setRatesOrderId(order.id);
                          setConfirmed(null);
                        }}>
                          <Truck className="size-3 mr-1 text-emerald-500" /> Compare Courier Rates
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                          setValue('orderId', order.id);
                          setConfirmed(null);
                          setRatesOrderId(null);
                        }}>
                          <Ship className="size-3 mr-1" /> Manual Dispatch
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Carrier Rates Comparison Workspace */}
        {ratesOrderId && (
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 border border-emerald-500/20 bg-slate-900/10">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-emerald-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Courier Rates for Order #{ratesOrderId}</h2>
              </div>
              <button onClick={() => setRatesOrderId(null)} className="text-xs text-slate-500 hover:text-slate-400">Cancel</button>
            </div>

            {ratesLoading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : carrierRates.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">No rates available for this shipment destination.</div>
            ) : (
              <div className="space-y-3">
                {carrierRates.map((rate, idx) => (
                  <div key={idx} className="flex items-center justify-between border border-border/50 bg-background/50 rounded-xl p-4 hover:border-emerald-500/30 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{rate.carrierName}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-semibold">{rate.serviceType}</span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-1">Estimated delivery: {rate.estimatedDays} days</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white">₹{rate.rate}</span>
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1"
                        onClick={() => bookCarrierMutation.mutate({ orderId: ratesOrderId, carrierName: rate.carrierName })}
                        disabled={bookCarrierMutation.isPending}
                      >
                        Book <ArrowRight className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confirm shipment */}
        {!ratesOrderId && (
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <Ship className="size-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Confirm Shipment Manual</h2>
            </div>

            {confirmed ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                  <Check className="size-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">Shipment Confirmed</p>
                  <p className="text-xs text-muted-foreground mt-1">AWB: {confirmed.awbNumber}</p>
                </div>
                <ShipmentDetail result={confirmed} />
                <Button variant="outline" onClick={() => setConfirmed(null)}>Confirm Another Shipment</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit((d) => confirmMutation.mutate(d))} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input id="orderId" type="number" {...register('orderId')} placeholder="e.g. 1042" />
                  {errors.orderId && <p className="text-xs text-destructive">{errors.orderId.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="awbNumber">AWB Number</Label>
                  <Input id="awbNumber" {...register('awbNumber')} placeholder="e.g. AWB-20260320-001" className="font-mono" />
                  {errors.awbNumber && <p className="text-xs text-destructive">{errors.awbNumber.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="courierName">Courier</Label>
                  <Select value={selectedCourier} onValueChange={(v) => { setSelectedCourier(v); setValue('courierName', v); }}>
                    <SelectTrigger id="courierName">
                      <SelectValue placeholder="Select courier…" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.courierName && <p className="text-xs text-destructive">{errors.courierName.message}</p>}
                </div>
                <Button type="submit" disabled={confirmMutation.isPending} className="w-full">
                  <Check className="size-4 mr-2" />
                  Confirm Shipment
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Lookup */}
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Look Up Shipment</h2>
          </div>

          <form onSubmit={handleLookup} className="flex gap-2">
            <Input type="number" placeholder="Order ID" value={lookupId} onChange={(e) => setLookupId(e.target.value)} className="flex-1" />
            <Button type="submit" variant="outline" disabled={lookupMutation.isPending || !lookupId}>
              <Search className="size-4" />
            </Button>
          </form>

          {lookupResult ? (
            <div className="flex flex-col gap-4">
              <ShipmentDetail result={lookupResult} />
              {lookupResult.status === 'SHIPPED' && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Timeline</p>
                  <ol className="relative border-l border-border/60 ml-2 space-y-3">
                    {[
                      { label: 'Order Created', time: null },
                      { label: 'Picked & Packed', time: null },
                      { label: 'Dispatched', time: lookupResult.createdAt ? new Date(lookupResult.createdAt).toLocaleString() : null },
                    ].map(({ label, time }, i) => (
                      <li key={i} className="pl-4 relative">
                        <span className={`absolute -left-1.5 top-1 size-3 rounded-full border-2 ${i <= 2 ? 'bg-emerald-500 border-emerald-500' : 'bg-background border-border'}`} />
                        <p className="text-xs font-medium">{label}</p>
                        {time && <p className="text-xs text-muted-foreground">{time}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Package className="size-10 opacity-30" />
              <p className="text-sm">Enter an order ID to look up its shipment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
