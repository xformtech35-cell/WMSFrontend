'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { toast } from 'sonner';
import { 
  ShieldCheck, ArrowLeft, Printer, Scan, CheckCircle, 
  RefreshCw, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function ManifestReconciliationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const dateParam = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  
  const [scanInput, setScanInput] = useState('');
  const [reconciledAwbs, setReconciledAwbs] = useState(new Set());
  const scanInputRef = useRef(null);

  // Fetch manifest shipments for this date
  const { data: shipments = [], isLoading, refetch } = useQuery({
    queryKey: ['manifest-shipments', dateParam],
    queryFn: () => api.get(`/shipping/manifest/${dateParam}`).then((r) => r.data ?? []),
  });

  useEffect(() => {
    // Auto-focus scanner input
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [shipments]);

  const handleScanSubmit = (e) => {
    e.preventDefault();
    const scanned = scanInput.trim();
    if (!scanned) return;

    const match = shipments.find(
      (s) => s.awbNumber === scanned || String(s.orderId) === scanned
    );

    if (match) {
      if (reconciledAwbs.has(match.awbNumber)) {
        toast.warning(`AWB ${match.awbNumber} was already reconciled`);
      } else {
        setReconciledAwbs((prev) => {
          const next = new Set(prev);
          next.add(match.awbNumber);
          return next;
        });
        toast.success(`Reconciled: Order #${match.orderId} (AWB ${match.awbNumber})`);
      }
    } else {
      toast.error(`No matching shipment found for scanned code: "${scanned}"`);
    }

    setScanInput('');
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  };

  const handleToggleReconciled = (awb) => {
    setReconciledAwbs((prev) => {
      const next = new Set(prev);
      if (next.has(awb)) {
        next.delete(awb);
      } else {
        next.add(awb);
      }
      return next;
    });
  };

  const handleReconcileAll = () => {
    setReconciledAwbs(new Set(shipments.map(s => s.awbNumber)));
    toast.success('All shipments marked as reconciled');
  };

  const handlePrint = () => {
    window.print();
  };

  const totalCount = shipments.length;
  const reconciledCount = reconciledAwbs.size;
  const remainingCount = totalCount - reconciledCount;
  const progressPercent = totalCount > 0 ? Math.round((reconciledCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 print:p-0 print:gap-4">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/shipping')}>
            <ArrowLeft className="size-4 mr-1" /> Back to Dispatch
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={totalCount === 0}>
            <Printer className="size-4 mr-1.5" /> Print Manifest Sheet
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            onClick={handleReconcileAll} 
            disabled={totalCount === 0 || remainingCount === 0}
          >
            Reconcile All
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border pb-4 print:pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="size-6 text-emerald-500 print:text-black" />
            Carrier Handover Manifest
          </h1>
          <p className="text-sm text-slate-500 mt-1 print:text-xs">
            Manifest Date: <span className="font-semibold text-slate-800 dark:text-slate-100">{dateParam}</span>
          </p>
        </div>
        <div className="text-right print:hidden">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Verification Status</span>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
            {reconciledCount} / {totalCount} Handed Over
          </div>
        </div>
      </div>

      {/* Progress & Quick Scan Bar (Hidden on print) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white md:col-span-2">
          <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center gap-2">
            <Scan className="size-4 text-primary" />
            <CardTitle className="text-sm font-bold text-slate-800">Intake / Handover Scan</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleScanSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <input
                  ref={scanInputRef}
                  type="text"
                  placeholder="Scan AWB barcode or type Order ID to confirm handover..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <Scan className="absolute left-3 top-2.5 size-4 text-slate-400" />
              </div>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                Submit Handover
              </Button>
            </form>
            <p className="text-[10px] text-slate-400 mt-2">
              Tip: Keep cursor inside this field to scan multiple AWB labels sequentially without manually clicking.
            </p>
          </CardContent>
        </Card>

        {/* Handover progress dial */}
        <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col justify-center p-6 text-center">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Reconciliation Progress</span>
          <div className="text-3xl font-extrabold text-slate-800">{progressPercent}%</div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-350" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {remainingCount} shipments remaining to handover to logistics drivers.
          </span>
        </Card>
      </div>

      {/* Manifest Sheet table */}
      <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden print:border-0 print:shadow-none">
        <CardHeader className="py-4 border-b border-slate-100 print:hidden flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-800">Shipments Manifest list</CardTitle>
          <button onClick={refetch} className="text-xs text-blue-600 hover:text-blue-500 flex items-center gap-1 font-semibold">
            <RefreshCw className="size-3" /> Refresh Sheet
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Loading manifest data...</div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-2">
              <AlertCircle className="size-10 text-slate-300" />
              <p>No shipments confirmed on this date.</p>
              <p className="text-xs text-slate-400">Book courier labels on the shipping dashboard to generate manifest lists.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-12 print:hidden"></TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Carrier / Courier</TableHead>
                  <TableHead>AWB Number</TableHead>
                  <TableHead>Dispatch Time</TableHead>
                  <TableHead>Manifest Verification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => {
                  const isReconciled = reconciledAwbs.has(shipment.awbNumber);
                  return (
                    <TableRow 
                      key={shipment.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isReconciled ? 'bg-emerald-50/20 dark:bg-emerald-950/5' : ''
                      }`}
                    >
                      <TableCell className="print:hidden">
                        <input
                          type="checkbox"
                          checked={isReconciled}
                          onChange={() => handleToggleReconciled(shipment.awbNumber)}
                          className="rounded border-slate-350 text-emerald-600 focus:ring-emerald-500 size-4 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-bold text-slate-700">SO #{shipment.orderId}</TableCell>
                      <TableCell className="font-semibold text-slate-800">{shipment.courierName}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{shipment.awbNumber}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {shipment.createdAt ? format(new Date(shipment.createdAt), 'HH:mm:ss') : '—'}
                      </TableCell>
                      <TableCell>
                        {isReconciled ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="size-3.5" /> Reconciled & Handed Over
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 italic">
                            Awaiting Driver Pickup
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
