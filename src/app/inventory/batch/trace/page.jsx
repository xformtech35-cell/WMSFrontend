'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import BatchExpiryBadge from '@/components/shared/BatchExpiryBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { format } from 'date-fns';
import { ArrowLeft, History, Truck, MapPin } from 'lucide-react';
import Link from 'next/link';

// Helper component to fetch and display user name
function UserName({ userId }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.get(`/users/${userId}`).then(r => r.data),
    enabled: !!userId,
    staleTime: Infinity, // User data is static, cache forever
  });
  return user?.fullName || user?.username || `User ${userId}`;
}

function BatchTraceContent() {
  const searchParams = useSearchParams();
  const batchNumber = searchParams.get('batchNumber') || '';

  const { data: traceData = {}, isLoading } = useQuery({
    queryKey: ['batchTrace', batchNumber],
    queryFn: () => {
      if (!batchNumber) return Promise.resolve({});
      return api.get(`/batches/trace/${batchNumber}`).then((r) => r.data ?? {});
    },
    enabled: !!batchNumber,
  });

  const batches = traceData.batches ?? [];
  const logs = traceData.movementLogs ?? [];

  const firstBatch = batches[0];
  const totalInStock = batches.reduce((sum, b) => sum + (b.quantity ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/inventory/expiry-watchlist">
          <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg">
            <ArrowLeft className="size-4 mr-1.5" /> Watchlist
          </Button>
        </Link>
        <PageHeader
          title={`Batch Trace: ${batchNumber || 'N/A'}`}
          description="View inventory status, current location breakdown, and recall tracking timeline."
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading trace data...</div>
      ) : !batchNumber ? (
        <div className="text-center py-12 text-slate-400">No batch number provided in query.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Panel: Details Card */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Batch Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col gap-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400">SKU Code</span>
                  <span className="text-xs font-bold text-slate-800">{firstBatch?.sku?.skuCode ?? 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400">SKU Name</span>
                  <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px] text-right">
                    {firstBatch?.sku?.description ?? 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Total in Stock</span>
                  <span className="text-xs font-extrabold text-indigo-600">{totalInStock} units</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Expiry Date</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {firstBatch?.expiryDate ? format(new Date(firstBatch.expiryDate), 'dd MMM yyyy') : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Manufacture Date</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {firstBatch?.manufactureDate ? format(new Date(firstBatch.manufactureDate), 'dd MMM yyyy') : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-slate-400">Status</span>
                  <BatchExpiryBadge status={firstBatch?.status} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Location Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Bin</TableHead>
                      <TableHead className="text-right pr-5">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4 text-slate-400 pl-5">
                          No stock in warehouse.
                        </TableCell>
                      </TableRow>
                    ) : (
                      batches.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-mono text-xs font-semibold text-slate-600 pl-5">
                            {b.bin?.barcode ?? 'RECV_DOCK'}
                          </TableCell>
                          <TableCell className="text-right font-extrabold pr-5">{b.quantity}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Recall Tracking Timeline */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center gap-2">
                <History className="size-4 text-slate-400" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Recall Tracking & Audit History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative pl-6 border-l-2 border-dashed border-slate-200 space-y-6">
                  {logs.length === 0 ? (
                    <div className="text-slate-400 text-xs py-4">No movement history logs recorded for this batch.</div>
                  ) : (
                    logs.map((log) => {
                      const isShipment = log.toState === 'SHIPPED';
                      return (
                        <div key={log.id} className="relative">
                          <span className={`absolute -left-[33px] top-0 size-5.5 rounded-full flex items-center justify-center border border-white shadow-sm text-white text-[10px] ${
                            isShipment ? 'bg-rose-500' : 'bg-indigo-500'
                          }`}>
                            {isShipment ? <Truck className="size-2.5" /> : <MapPin className="size-2.5" />}
                          </span>
                          <div>
                            <div className="flex items-center justify-between gap-4">
                              <h4 className="text-xs font-bold text-slate-800 leading-none">
                                {log.action.replace(/_/g, ' ')}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                              Serial No: <code className="bg-slate-50 border border-slate-100 px-1 rounded font-mono text-[10px] text-slate-600">{log.serialNo}</code>
                              {log.binBarcode && (
                                <> | Location: <span className="font-bold text-slate-600">{log.binBarcode}</span></>
                              )}
                                {log.userId && (
                                  <> | By: <span className="font-medium"><UserName userId={log.userId} /></span></>
                                )}
                              {log.fromState && (
                                <> | State change: <code className="text-amber-600 font-bold">{log.fromState}</code> ➔ <code className="text-emerald-600 font-bold">{log.toState}</code></>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BatchTracePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading trace page...</div>}>
      <BatchTraceContent />
    </Suspense>
  );
}
