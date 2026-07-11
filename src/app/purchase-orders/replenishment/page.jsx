'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { toast } from 'sonner';
import { 
  Sparkles, BrainCircuit, RotateCcw, ClipboardList, AlertTriangle, 
  ArrowLeft, RefreshCw, Send, CheckCircle, Package2, ShieldAlert
} from 'lucide-react';

export default function ReplenishmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Selected SKUs to reorder: skuCode -> quantity
  const [selectedLines, setSelectedLines] = useState({});
  const [supplierName, setSupplierName] = useState('AI Automated Supplier');

  // Fetch AI Inventory Forecasts
  const { data: forecasts = [], isLoading, refetch } = useQuery({
    queryKey: ['ai-forecasts'],
    queryFn: () => api.get('/ai/forecast').then((r) => r.data ?? []),
  });

  // Generate Draft PO Mutation
  const generatePoMutation = useMutation({
    mutationFn: (payload) => api.post('/purchase-orders', payload),
    onSuccess: (data) => {
      toast.success(`Draft PO ${data.data.poNumber} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      router.push('/purchase-orders');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate Purchase Order');
    }
  });

  const handleToggleSelect = (skuCode, recommendedQty) => {
    setSelectedLines((prev) => {
      const next = { ...prev };
      if (next[skuCode] !== undefined) {
        delete next[skuCode];
      } else {
        next[skuCode] = recommendedQty > 0 ? recommendedQty : 10;
      }
      return next;
    });
  };

  const handleQtyChange = (skuCode, val) => {
    const qty = parseInt(val, 10) || 0;
    setSelectedLines((prev) => ({
      ...prev,
      [skuCode]: qty
    }));
  };

  const handleGenerateDraftPo = () => {
    const lines = Object.entries(selectedLines).map(([skuCode, quantity]) => ({
      skuCode,
      quantity
    }));

    if (lines.length === 0) {
      toast.error('Please select at least one SKU to reorder');
      return;
    }

    generatePoMutation.mutate({
      supplier: supplierName,
      lines
    });
  };

  // Stats
  const totalSkusCount = forecasts.length;
  const criticalRestocksCount = forecasts.filter(f => f.reorderQuantity > 0).length;
  const highRiskExpiriesCount = forecasts.filter(f => f.expiryRiskIndex > 0.3).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/purchase-orders')}>
            <ArrowLeft className="size-4 mr-1" /> Back to POs
          </Button>
        </div>
        <button 
          onClick={refetch} 
          className="text-xs text-blue-600 hover:text-blue-500 flex items-center gap-1 font-semibold"
        >
          <RefreshCw className="size-3" /> Refresh Suggestions
        </button>
      </div>

      <PageHeader 
        title="AI Replenishment Assistant" 
        description="Leverage historical velocities, expiry risk assessments, and seasonal trends to generate optimal draft Purchase Orders."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Analyzed SKUs"
          value={totalSkusCount}
          icon={Package2}
          kpiVariant="blue"
          accentClass="text-blue-500"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          title="Critical Restocks Recommended"
          value={criticalRestocksCount}
          icon={BrainCircuit}
          kpiVariant="amber"
          accentClass="text-amber-500"
          iconBg="bg-amber-500/10"
        />
        <StatCard
          title="High Expiry Risk SKUs"
          value={highRiskExpiriesCount}
          icon={ShieldAlert}
          kpiVariant="rose"
          accentClass="text-rose-500"
          iconBg="bg-rose-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Table */}
        <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white lg:col-span-2 overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">Demand Predictions & Reorder Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">Running AI forecasting models...</div>
            ) : forecasts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No SKUs loaded to evaluate.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>SKU Info</TableHead>
                    <TableHead className="text-center">Stock Level</TableHead>
                    <TableHead className="text-center">Proj. Demand</TableHead>
                    <TableHead className="text-center">Expiry Risk</TableHead>
                    <TableHead className="text-right">Rec. Order Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecasts.map((f) => {
                    const isSelected = selectedLines[f.skuCode] !== undefined;
                    return (
                      <React.Fragment key={f.skuId}>
                        <TableRow className={`hover:bg-slate-50/50 border-b border-slate-100 ${isSelected ? 'bg-blue-50/10' : ''}`}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(f.skuCode, f.reorderQuantity)}
                              className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 size-4 cursor-pointer"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-slate-700 block">{f.skuCode}</span>
                            <span className="text-xs text-slate-400 font-medium line-clamp-1">{f.description || '—'}</span>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-slate-850">
                            {f.currentStock}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-blue-600">
                            {f.forecastDemand}
                          </TableCell>
                          <TableCell className="text-center">
                            {f.expiryRiskIndex > 0 ? (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                f.expiryRiskIndex > 0.4 
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                  : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                <AlertTriangle className="size-3" />
                                {Math.round(f.expiryRiskIndex * 100)}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-800">
                            {isSelected ? (
                              <input
                                type="number"
                                value={selectedLines[f.skuCode]}
                                onChange={(e) => handleQtyChange(f.skuCode, e.target.value)}
                                className="w-16 text-center border rounded px-1.5 py-0.5 text-xs font-bold"
                              />
                            ) : (
                              <span className={f.reorderQuantity > 0 ? 'text-amber-600' : 'text-slate-400'}>
                                {f.reorderQuantity}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-slate-50/20 border-b border-slate-100">
                          <TableCell></TableCell>
                          <TableCell colSpan={5} className="py-2 text-xs text-slate-500 italic pr-6">
                            <span className="font-bold text-blue-500 mr-1.5 flex-inline items-center gap-0.5">
                              ★ AI Suggestion:
                            </span>
                            {f.recommendation}
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* PO Generation Panel */}
        <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white self-start">
          <CardHeader className="py-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">Replenishment Cart</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Supplier Name</label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Acme Garments Ltd."
              />
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Selected Items</span>
                <span className="font-bold text-slate-700">{Object.keys(selectedLines).length} SKUs</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Total Reorder Volume</span>
                <span className="font-bold text-slate-700">
                  {Object.values(selectedLines).reduce((a, b) => a + b, 0)} units
                </span>
              </div>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5 mt-2"
              onClick={handleGenerateDraftPo}
              disabled={Object.keys(selectedLines).length === 0 || generatePoMutation.isPending}
            >
              <Send className="size-4" /> Create Draft Purchase Order
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
