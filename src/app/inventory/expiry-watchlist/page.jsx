'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import BatchExpiryBadge from '@/components/shared/BatchExpiryBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { AlertTriangle, ShieldAlert, CheckCircle, Search, RefreshCw, Layers3, Activity } from 'lucide-react';
import Link from 'next/link';

export default function ExpiryWatchlistPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: batches = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['expiryWatchlist'],
    queryFn: () => api.get('/batches/expiry-watchlist').then((r) => r.data ?? []),
    staleTime: 10000,
  });

  const quarantineMutation = useMutation({
    mutationFn: ({ id, quarantine }) => api.post(`/batches/${id}/quarantine`, { quarantine }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiryWatchlist'] });
      toast.success('Batch quarantine status updated successfully');
      setSelectedIds([]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update quarantine status');
    },
  });

  const handleBulkQuarantine = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => quarantineMutation.mutateAsync({ id, quarantine: true })));
      toast.success(`Successfully quarantined ${selectedIds.length} batches`);
    } catch (e) {
      // Errors handled individually
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredBatches.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBatches.map((b) => b.id));
    }
  };

  const filteredBatches = batches.filter((b) => {
    const q = search.toLowerCase();
    return (
      (b.batchNumber ?? '').toLowerCase().includes(q) ||
      (b.sku?.skuCode ?? '').toLowerCase().includes(q) ||
      (b.sku?.description ?? '').toLowerCase().includes(q)
    );
  });

  const nearExpiryCount = batches.filter((b) => b.status === 'NEAR_EXPIRY').length;
  const expiredCount = batches.filter((b) => b.status === 'EXPIRED').length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Expiry Watchlist"
        description="Monitor near-expiry and expired stock batches, manage quarantine blocks, and trace recalls."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Expired Batches"
          value={expiredCount}
          icon={ShieldAlert}
          kpiVariant="rose"
          accentClass="text-rose-500"
          iconBg="bg-rose-500/10"
        />
        <StatCard
          title="Near Expiry"
          value={nearExpiryCount}
          icon={AlertTriangle}
          kpiVariant="amber"
          accentClass="text-amber-500"
          iconBg="bg-amber-500/10"
        />
        <StatCard
          title="Total watchlist"
          value={batches.length}
          icon={Activity}
          kpiVariant="blue"
          accentClass="text-blue-500"
          iconBg="bg-blue-500/10"
        />
      </div>

      <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 bg-white border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Search SKU or batch number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkQuarantine}
                disabled={quarantineMutation.isPending}
              >
                Quarantine Selected ({selectedIds.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-10 rounded-xl"
            >
              <RefreshCw className={`size-4 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="border border-slate-150 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={filteredBatches.length > 0 && selectedIds.length === filteredBatches.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>SKU Details</TableHead>
                <TableHead>Bin Location</TableHead>
                <TableHead>Remaining Qty</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                    Loading watchlist...
                  </TableCell>
                </TableRow>
              ) : filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                    No batches requiring attention found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches.map((b) => {
                  const daysLeft = b.expiryDate ? differenceInDays(new Date(b.expiryDate), new Date()) : 0;
                  return (
                    <TableRow key={b.id} className="hover:bg-slate-50/40">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(b.id)}
                          onChange={() => handleToggleSelect(b.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-900">
                        <Link href={`/inventory/batch/trace?batchNumber=${b.batchNumber}`} className="text-indigo-600 hover:underline">
                          {b.batchNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-xs">{b.sku?.skuCode}</span>
                          <span className="text-[10px] text-slate-400">{b.sku?.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-600 text-xs">
                        {b.bin?.barcode ?? 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs font-bold">{b.quantity}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {b.expiryDate ? format(new Date(b.expiryDate), 'dd MMM yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className={`text-xs font-bold ${daysLeft <= 0 ? 'text-rose-500' : daysLeft <= 15 ? 'text-amber-500' : 'text-slate-600'}`}>
                        {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                      </TableCell>
                      <TableCell>
                        <BatchExpiryBadge status={b.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={b.status === 'QUARANTINED' ? 'outline' : 'destructive'}
                          size="xs"
                          onClick={() => quarantineMutation.mutate({ id: b.id, quarantine: b.status !== 'QUARANTINED' })}
                        >
                          {b.status === 'QUARANTINED' ? 'Activate' : 'Quarantine'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
