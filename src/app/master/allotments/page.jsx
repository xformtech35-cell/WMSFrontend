'use client';
export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Building2, Warehouse, Boxes, Layers, ChevronRight, Plus, 
  Search, X, AlertCircle, Trash2, Edit, CheckCircle2, Info,
  Package, Scale, MoveRight, ArrowRight, RefreshCw, BarChart2, ShieldAlert
} from 'lucide-react';

import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import SlideOverForm from '@/components/ui/SlideOverForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { SheetFooter } from '@/components/ui/sheet';

// Zod Schema for Allotting Stock
const allotmentSchema = z.object({
  skuId: z.coerce.number().int().positive('SKU is required'),
  barcode: z.string().min(1, 'Serial / barcode is required'),
  batchNo: z.string().optional(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  state: z.enum(['AVAILABLE', 'RECEIVED', 'IN_PUTAWAY', 'RESERVED', 'PICKED', 'PACKED', 'SHIPPED']),
});

// Helper to resolve level from bin barcode (e.g. BIN-A1R1-03 -> Level 3)
const getLevelFromBinBarcode = (barcode) => {
  const clean = String(barcode || '');
  const lastPart = clean.split('-').pop();
  if (lastPart && /^\d+$/.test(lastPart)) {
    return parseInt(lastPart, 10);
  }
  const numMatch = clean.match(/\d+$/);
  if (numMatch) {
    return parseInt(numMatch[0], 10);
  }
  return 1; // fallback
};

export default function RackAllotmentsPage() {
  const queryClient = useQueryClient();
  
  // Selection states
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedAisleId, setSelectedAisleId] = useState('');
  const [selectedRackId, setSelectedRackId] = useState('');
  
  // Bin action states
  const [selectedBin, setSelectedBin] = useState(null);
  const [isAllotOpen, setIsAllotOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  
  // ── Queries ────────────────────────────────────────────────────────────────
  
  // Fetch warehouses
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/master/warehouses').then((r) => r.data ?? []),
    staleTime: 60_000,
  });

  // Fetch zones
  const { data: zones = [], isLoading: zonesLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: () => api.get('/master/zones').then((r) => r.data ?? []),
    staleTime: 60_000,
  });

  // Fetch aisles
  const { data: aisles = [], isLoading: aislesLoading } = useQuery({
    queryKey: ['aisles'],
    queryFn: () => api.get('/master/aisles').then((r) => r.data ?? []),
    staleTime: 60_000,
  });

  // Fetch racks
  const { data: racks = [], isLoading: racksLoading } = useQuery({
    queryKey: ['racks'],
    queryFn: () => api.get('/master/racks').then((r) => r.data ?? []),
    staleTime: 60_000,
  });

  // Fetch bins
  const { data: bins = [], isLoading: binsLoading } = useQuery({
    queryKey: ['bins'],
    queryFn: () => api.get('/master/bins').then((r) => r.data ?? []),
    staleTime: 30_000,
  });

  // Fetch SKUs meta
  const { data: meta } = useQuery({
    queryKey: ['inventory-meta'],
    queryFn: () => api.get('/inventory/meta').then((r) => r.data ?? {}),
    staleTime: 5 * 60_000,
  });
  const skuOptions = useMemo(() => meta?.skus ?? [], [meta]);

  // Fetch all inventory items for allotment mapping
  const { data: inventoryData = [], isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ['inventory-allots'],
    queryFn: () => api.get('/inventory', { params: { size: 1000 } }).then((r) => r.data?.content ?? r.data?.items ?? []),
    staleTime: 30_000,
  });

  // ── Auto-Cascade Defaults ─────────────────────────────────────────────────
  
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(String(warehouses[0].id));
    }
  }, [warehouses, selectedWarehouseId]);

  const filteredZones = useMemo(() => {
    return zones.filter(z => String(z.warehouseId || z.warehouse?.id) === selectedWarehouseId);
  }, [zones, selectedWarehouseId]);

  useEffect(() => {
    if (filteredZones.length > 0) {
      const match = filteredZones.find(z => String(z.id) === selectedZoneId);
      if (!match) {
        setSelectedZoneId(String(filteredZones[0].id));
      }
    } else {
      setSelectedZoneId('');
    }
  }, [filteredZones, selectedZoneId]);

  const filteredAisles = useMemo(() => {
    return aisles.filter(a => String(a.zoneId || a.zone?.id) === selectedZoneId);
  }, [aisles, selectedZoneId]);

  useEffect(() => {
    if (filteredAisles.length > 0) {
      const match = filteredAisles.find(a => String(a.id) === selectedAisleId);
      if (!match) {
        setSelectedAisleId(String(filteredAisles[0].id));
      }
    } else {
      setSelectedAisleId('');
    }
  }, [filteredAisles, selectedAisleId]);

  const filteredRacks = useMemo(() => {
    return racks.filter(r => String(r.aisleId || r.aisle?.id) === selectedAisleId);
  }, [racks, selectedAisleId]);

  useEffect(() => {
    if (filteredRacks.length > 0) {
      const match = filteredRacks.find(r => String(r.id) === selectedRackId);
      if (!match) {
        setSelectedRackId(String(filteredRacks[0].id));
      }
    } else {
      setSelectedRackId('');
    }
  }, [filteredRacks, selectedRackId]);

  // ── Derived State Maps ─────────────────────────────────────────────────────

  // Group inventory items by bin barcode
  const inventoryByBinBarcode = useMemo(() => {
    const map = {};
    inventoryData.forEach(item => {
      const barcode = item.binBarcode;
      if (barcode) {
        if (!map[barcode]) {
          map[barcode] = [];
        }
        map[barcode].push(item);
      }
    });
    return map;
  }, [inventoryData]);

  // Group bins in the selected rack by dynamic vertical level
  const binsByLevel = useMemo(() => {
    if (!selectedRackId) return {};
    const filteredBins = bins.filter(b => String(b.rackId || b.rack?.id) === selectedRackId);
    
    const levelsMap = {};
    filteredBins.forEach(bin => {
      const lvl = getLevelFromBinBarcode(bin.barcode);
      if (!levelsMap[lvl]) {
        levelsMap[lvl] = [];
      }
      levelsMap[lvl].push(bin);
    });

    // Sort bins in each level alphabetically by barcode suffix
    Object.keys(levelsMap).forEach(lvl => {
      levelsMap[lvl].sort((a, b) => String(a.barcode).localeCompare(String(b.barcode)));
    });

    return levelsMap;
  }, [bins, selectedRackId]);

  // Sorted list of levels descending (e.g. Level 5 on top, Level 1 on bottom)
  const sortedLevels = useMemo(() => {
    return Object.keys(binsByLevel)
      .map(Number)
      .sort((a, b) => b - a);
  }, [binsByLevel]);

  // ── Forms ──────────────────────────────────────────────────────────────────

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(allotmentSchema),
    defaultValues: { skuId: '', barcode: '', batchNo: '', quantity: 1, state: 'AVAILABLE' }
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-allots'] });
    queryClient.invalidateQueries({ queryKey: ['bins'] });
  };

  // Allot new stock
  const allotMutation = useMutation({
    mutationFn: (payload) => api.post('/inventory', payload),
    onSuccess: () => {
      toast.success('Stock successfully allotted to bin');
      invalidate();
      setIsAllotOpen(false);
      reset();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to allot stock');
    }
  });

  // Update bin status (e.g., AVAILABLE, FULL, BLOCKED)
  const updateBinStatusMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/master/bins/${id}`, payload),
    onSuccess: () => {
      toast.success('Bin status updated successfully');
      invalidate();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to update bin status');
    }
  });

  // Adjust stock quantity
  const adjustStockMutation = useMutation({
    mutationFn: ({ id, quantity }) => 
      api.post('/inventory/adjust', { inventoryId: id, quantity: Number(quantity), reason: 'MANUAL' }),
    onSuccess: () => {
      toast.success('Stock quantity adjusted successfully');
      invalidate();
      setAdjustingItem(null);
      setAdjustQty('');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Adjustment failed');
    }
  });

  // Remove/Delete stock allotment from bin
  const deleteAllotMutation = useMutation({
    mutationFn: (id) => api.delete(`/inventory/${id}`),
    onSuccess: () => {
      toast.success('Allotment removed from bin');
      invalidate();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to remove allotment');
    }
  });

  // ── Submit Handlers ────────────────────────────────────────────────────────

  const onAllotSubmit = (values) => {
    if (!selectedBin) return;
    allotMutation.mutate({
      skuId: Number(values.skuId),
      binId: selectedBin.id,
      barcode: values.barcode.trim(),
      batchNo: values.batchNo?.trim() || 'BATCH-GEN',
      quantity: Number(values.quantity),
      state: values.state,
    });
  };

  const handleStatusChange = (bin, newStatus) => {
    const payload = {
      rackId: bin.rackId || bin.rack?.id,
      barcode: bin.barcode,
      lengthCm: bin.lengthCm,
      widthCm: bin.widthCm,
      heightCm: bin.heightCm,
      maxWeightG: bin.maxWeightG,
      status: newStatus,
    };
    updateBinStatusMutation.mutate({ id: bin.id, payload });
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustingItem || !adjustQty) return;
    adjustStockMutation.mutate({ id: adjustingItem.id, quantity: adjustQty });
  };

  // Helper values
  const activeRackName = useMemo(() => {
    const r = racks.find(r => String(r.id) === selectedRackId);
    return r ? r.rackIdentifier : '—';
  }, [racks, selectedRackId]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <PageHeader 
          title="Rack Allotments Explorer" 
          description="Visualize vertical rack levels and allot or adjust inventory slot placements dynamically."
        />

        {/* ── Cascade Selector Bar ── */}
        <Card className="border-slate-200/80 shadow-xs mb-6 overflow-visible">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Warehouse Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="warehouse-select" className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  Warehouse
                </Label>
                <select
                  id="warehouse-select"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {warehousesLoading && <option>Loading...</option>}
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Zone Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="zone-select" className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-indigo-500" />
                  Zone
                </Label>
                <select
                  id="zone-select"
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  disabled={!selectedWarehouseId || filteredZones.length === 0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {zonesLoading && <option>Loading...</option>}
                  {filteredZones.length === 0 && <option>No zones available</option>}
                  {filteredZones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              {/* Aisle Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="aisle-select" className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Aisle
                </Label>
                <select
                  id="aisle-select"
                  value={selectedAisleId}
                  onChange={(e) => setSelectedAisleId(e.target.value)}
                  disabled={!selectedZoneId || filteredAisles.length === 0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {aislesLoading && <option>Loading...</option>}
                  {filteredAisles.length === 0 && <option>No aisles available</option>}
                  {filteredAisles.map((a) => (
                    <option key={a.id} value={a.id}>{a.aisleCode}</option>
                  ))}
                </select>
              </div>

              {/* Rack Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="rack-select" className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                  Rack
                </Label>
                <select
                  id="rack-select"
                  value={selectedRackId}
                  onChange={(e) => setSelectedRackId(e.target.value)}
                  disabled={!selectedAisleId || filteredRacks.length === 0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {racksLoading && <option>Loading...</option>}
                  {filteredRacks.length === 0 && <option>No racks available</option>}
                  {filteredRacks.map((r) => (
                    <option key={r.id} value={r.id}>{r.rackIdentifier}</option>
                  ))}
                </select>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ── Main Workspace ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">

          {/* 1. Visual Rack Map */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-indigo-900 text-white px-5 py-3.5 rounded-xl shadow-xs">
              <div>
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-indigo-300" />
                  Visual Rack: {activeRackName}
                </h3>
                <p className="text-[11px] text-indigo-200 mt-0.5">Click any bin to view details or allot stock</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refetchInventory}
                className="text-white hover:bg-white/10 hover:text-white flex items-center gap-1 text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
            </div>

            {binsLoading || inventoryLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : sortedLevels.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No bins found for this rack config. Go to Bins Master to map bins to this rack.
              </div>
            ) : (
              <div className="space-y-4">
                {sortedLevels.map((level) => {
                  const levelBins = binsByLevel[level] || [];
                  return (
                    <div 
                      key={level} 
                      className="bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col md:flex-row items-stretch"
                    >
                      {/* Level Indicator Tag */}
                      <div className="md:w-28 bg-slate-100/60 border-r border-slate-100 flex md:flex-col justify-center items-center p-3 text-slate-600 shrink-0 select-none">
                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Level</span>
                        <span className="text-xl md:text-2xl font-black text-slate-700 ml-1.5 md:ml-0 md:mt-0.5">{level}</span>
                      </div>

                      {/* Level Bins Grid */}
                      <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {levelBins.map((bin) => {
                          const allotted = inventoryByBinBarcode[bin.barcode] || [];
                          const util = bin.utilizationPct ?? 0;
                          
                          // Determine colors based on utilization and status
                          let statusBg = 'bg-emerald-500';
                          if (bin.status === 'FULL') statusBg = 'bg-blue-500';
                          if (bin.status === 'BLOCKED') statusBg = 'bg-rose-500';

                          return (
                            <div 
                              key={bin.id}
                              onClick={() => { setSelectedBin(bin); setIsDetailOpen(true); }}
                              className="group relative cursor-pointer border border-slate-200 hover:border-indigo-400 rounded-lg p-3 hover:bg-slate-50/50 transition-all flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                  <span className="font-mono text-xs font-bold text-slate-700">{bin.barcode}</span>
                                  <span className={`w-2.5 h-2.5 rounded-full ${statusBg} shadow-sm`} title={bin.status} />
                                </div>

                                {/* Utilization */}
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                                    <span>Utilized</span>
                                    <span className="font-semibold text-slate-700">{util}%</span>
                                  </div>
                                  <Progress value={util} className="h-1 bg-slate-100" />
                                </div>
                              </div>

                              {/* Inventory Summary */}
                              <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                                {allotted.length === 0 ? (
                                  <span className="text-[10px] text-slate-400 font-medium italic">Empty</span>
                                ) : (
                                  allotted.map((item) => (
                                    <Badge 
                                      key={item.id} 
                                      variant="secondary" 
                                      className="text-[9px] px-1.5 py-0.5 font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/50 rounded-md"
                                    >
                                      {item.skuCode} ({item.quantity})
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Side Panel - Overview stats & shortcut options */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-500" />
                  Allotment Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                {/* Visual Capacity Info */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Active Rack Bins count</span>
                    <p className="text-xl font-extrabold text-slate-800">
                      {bins.filter(b => String(b.rackId || b.rack?.id) === selectedRackId).length} bins
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-medium">Occupied Bins in Rack</span>
                    <p className="text-xl font-extrabold text-slate-800">
                      {bins.filter(b => String(b.rackId || b.rack?.id) === selectedRackId && (inventoryByBinBarcode[b.barcode]?.length > 0)).length} Bins
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-medium">Blocked Slots</span>
                    <p className="text-xl font-extrabold text-slate-800">
                      {bins.filter(b => String(b.rackId || b.rack?.id) === selectedRackId && b.status === 'BLOCKED').length} Bins
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl flex gap-2.5 items-start">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 leading-normal">
                    <strong>Capacity Guard</strong>: The WMS Putaway Engine calculates fit coordinates dynamically based on bin volume and weight parameters. Keep bin statuses updated (`FULL` or `BLOCKED`) to correctly route inbound arrivals.
                  </p>
                </div>

              </CardContent>
            </Card>

            {/* Quick Action links */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Layout Shortcuts</h4>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/master/bins'}
                className="w-full text-xs font-semibold justify-between h-9 hover:bg-slate-50 text-slate-700"
              >
                <span>Manage Bin Master Data</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Button>

              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/master/racks'}
                className="w-full text-xs font-semibold justify-between h-9 hover:bg-slate-50 text-slate-700"
              >
                <span>Manage Rack Master Data</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </div>
          </div>

        </div>

        {/* ── Bin Details Dialog ── */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl bg-white border border-slate-200">
            {selectedBin && (
              <>
                <DialogHeader className="border-b border-slate-100 pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <DialogTitle className="text-lg font-bold text-slate-800 font-mono">
                        {selectedBin.barcode}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500 mt-0.5">
                        Capacity: {selectedBin.volumeCm3} cm³ | Dimensions: {selectedBin.lengthCm}x{selectedBin.widthCm}x{selectedBin.heightCm} cm
                      </DialogDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedBin.status}
                        onChange={(e) => handleStatusChange(selectedBin, e.target.value)}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="FULL">FULL</option>
                        <option value="BLOCKED">BLOCKED</option>
                      </select>
                    </div>
                  </div>
                </DialogHeader>

                {/* Allotted Items in Bin */}
                <div className="space-y-4 py-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-indigo-500" />
                      Allotted Inventory records
                    </h4>
                    <Button 
                      onClick={() => { setIsDetailOpen(false); setIsAllotOpen(true); }}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1 h-8"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Allot Stock
                    </Button>
                  </div>

                  {/* Table of items in bin */}
                  {(!inventoryByBinBarcode[selectedBin.barcode] || inventoryByBinBarcode[selectedBin.barcode].length === 0) ? (
                    <div className="text-center p-8 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                      No stock currently allotted to this bin slot.
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50/70">
                          <TableRow>
                            <TableHead className="text-[10px] font-bold">SKU</TableHead>
                            <TableHead className="text-[10px] font-bold">Serial / Barcode</TableHead>
                            <TableHead className="text-[10px] font-bold">Batch</TableHead>
                            <TableHead className="text-[10px] font-bold text-right">Quantity</TableHead>
                            <TableHead className="text-[10px] font-bold text-center">State</TableHead>
                            <TableHead className="w-16" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventoryByBinBarcode[selectedBin.barcode].map((item) => (
                            <TableRow key={item.id} className="hover:bg-slate-50/50">
                              <TableCell className="font-semibold text-xs text-slate-800">{item.skuCode}</TableCell>
                              <TableCell className="font-mono text-xs">{item.barcode || item.serialNo}</TableCell>
                              <TableCell className="text-xs">{item.batchNo || '—'}</TableCell>
                              <TableCell className="text-xs text-right font-bold">{item.quantity}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {item.state}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 justify-end">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => { setAdjustingItem(item); setAdjustQty(String(item.quantity)); }}
                                    className="w-7 h-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Adjust quantity"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this allotment?')) {
                                        deleteAllotMutation.mutate(item.id);
                                      }
                                    }}
                                    className="w-7 h-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    title="Remove allotment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Quantity adjustments form */}
                  {adjustingItem && (
                    <form onSubmit={handleAdjustSubmit} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Edit className="w-3.5 h-3.5 text-indigo-500" />
                          Adjust quantity: {adjustingItem.skuCode}
                        </span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setAdjustingItem(null)}
                          className="w-6 h-6 rounded-full hover:bg-slate-200/50"
                        >
                          <X className="w-3 h-3 text-slate-500" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Input 
                            type="number"
                            value={adjustQty}
                            onChange={(e) => setAdjustQty(e.target.value)}
                            min="0"
                            placeholder="New quantity"
                            className="bg-white h-9 text-xs"
                            required
                          />
                        </div>
                        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs">
                          Save Adjust
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

                <DialogFooter className="border-t border-slate-100 pt-3">
                  <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="text-xs border-slate-300">
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Allot Stock Slideover ── */}
        <SlideOverForm
          open={isAllotOpen}
          onClose={() => { setIsAllotOpen(false); setSelectedBin(null); }}
          title={`Allot Stock: ${selectedBin?.barcode}`}
          description="Place new SKU serial stock balance directly inside this bin."
        >
          <form onSubmit={handleSubmit(onAllotSubmit)} className="space-y-4">
            
            {/* SKU */}
            <div className="space-y-1.5">
              <Label htmlFor="skuId">SKU <span className="text-rose-500">*</span></Label>
              <select
                id="skuId"
                {...register('skuId')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select SKU...</option>
                {skuOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.skuCode} - {s.description}</option>
                ))}
              </select>
              {errors.skuId && <p className="text-[10px] font-semibold text-rose-500">{errors.skuId.message}</p>}
            </div>

            {/* Barcode/Serial */}
            <div className="space-y-1.5">
              <Label htmlFor="barcode">Serial / Barcode <span className="text-rose-500">*</span></Label>
              <Input 
                id="barcode" 
                placeholder="Scan item serial number..." 
                {...register('barcode')}
                className="bg-white border-slate-300"
              />
              {errors.barcode && <p className="text-[10px] font-semibold text-rose-500">{errors.barcode.message}</p>}
            </div>

            {/* Batch Number */}
            <div className="space-y-1.5">
              <Label htmlFor="batchNo">Batch Number</Label>
              <Input 
                id="batchNo" 
                placeholder="e.g. BATCH-2026-A" 
                {...register('batchNo')}
                className="bg-white border-slate-300"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity <span className="text-rose-500">*</span></Label>
              <Input 
                id="quantity" 
                type="number"
                min="1"
                {...register('quantity')}
                className="bg-white border-slate-300"
              />
              {errors.quantity && <p className="text-[10px] font-semibold text-rose-500">{errors.quantity.message}</p>}
            </div>

            {/* Inventory State */}
            <div className="space-y-1.5">
              <Label htmlFor="state">Inventory State <span className="text-rose-500">*</span></Label>
              <select
                id="state"
                {...register('state')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="IN_PUTAWAY">IN_PUTAWAY</option>
                <option value="RESERVED">RESERVED</option>
                <option value="PICKED">PICKED</option>
                <option value="PACKED">PACKED</option>
                <option value="SHIPPED">SHIPPED</option>
              </select>
            </div>

            <SheetFooter className="pt-4 border-t border-slate-100 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAllotOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={allotMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                {allotMutation.isPending ? 'Saving...' : 'Allot Stock'}
              </Button>
            </SheetFooter>

          </form>
        </SlideOverForm>

      </div>
    </div>
  );
}
