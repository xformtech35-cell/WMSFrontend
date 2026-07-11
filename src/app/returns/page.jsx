'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/lib/hooks/usePermissions';
import api from '@/lib/api';
import { toast } from 'sonner';
import { 
  RotateCcw, ClipboardCopy, FileText, CheckCircle, AlertTriangle, 
  Trash2, Plus, ArrowRight, Scan, Box, Check, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export default function ReturnsPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState('orders');

  // RMA Creation states
  const [originalOrderId, setOriginalOrderId] = useState('');
  const [customerRef, setCustomerRef] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [manualLines, setManualLines] = useState([]);
  const [manualSku, setManualSku] = useState('');
  const [manualQty, setManualQty] = useState('');
  const [manualBatch, setManualBatch] = useState('');

  // Active workspace / Inspection state
  const [inspectingOrder, setInspectingOrder] = useState(null);
  const [inspectionGrades, setInspectionGrades] = useState({}); // lineId -> { grade, notes, batch }
  const [restockBins, setRestockBins] = useState({}); // lineId -> binBarcode

  // Fetch Returns List
  const { data: returns = [], isLoading: returnsLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: () => api.get('/returns').then((r) => r.data ?? []),
  });

  // Create Return Mutation
  const createReturnMutation = useMutation({
    mutationFn: (payload) => api.post('/returns', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('RMA Return Order created successfully');
      setOriginalOrderId('');
      setCustomerRef('');
      setManualLines([]);
      setActiveTab('orders');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create return order');
    }
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/returns/${id}/status?status=${status}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success(`Return status updated to ${res.data.status}`);
      if (inspectingOrder && inspectingOrder.id === res.data.id) {
        setInspectingOrder(res.data);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  });

  // Grade Line Mutation
  const gradeLineMutation = useMutation({
    mutationFn: ({ orderId, lineId, payload }) => 
      api.put(`/returns/${orderId}/lines/${lineId}/grade`, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Line graded successfully');
      if (inspectingOrder && inspectingOrder.id === res.data.id) {
        setInspectingOrder(res.data);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save grade');
    }
  });

  // Restock Line Mutation
  const restockLineMutation = useMutation({
    mutationFn: ({ orderId, lineId, binBarcode }) => 
      api.post(`/returns/${orderId}/lines/${lineId}/restock`, { binBarcode }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Inventory restocked successfully');
      if (inspectingOrder && inspectingOrder.id === res.data.id) {
        setInspectingOrder(res.data);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to restock line');
    }
  });

  const handleFetchOriginalOrder = async () => {
    if (!originalOrderId) return;
    setLoadingOrder(true);
    try {
      const res = await api.get(`/orders/${originalOrderId}`);
      const order = res.data;
      if (order && order.lines) {
        const prepopulated = order.lines.map(line => ({
          skuCode: line.sku?.skuCode || line.skuCode,
          orderedQty: line.quantity,
          returnedQty: line.quantity,
          batchNumber: line.batchNo || ''
        }));
        setManualLines(prepopulated);
        toast.success(`Loaded ${prepopulated.length} lines from Sales Order #${originalOrderId}`);
      } else {
        toast.warning('Order loaded but no lines were found');
      }
    } catch (err) {
      toast.error('Could not find sales order. You can still add lines manually below.');
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleAddManualLine = () => {
    if (!manualSku || !manualQty) {
      toast.error('SKU Code and Returned Quantity are required');
      return;
    }
    setManualLines(prev => [
      ...prev,
      {
        skuCode: manualSku,
        orderedQty: parseInt(manualQty, 10),
        returnedQty: parseInt(manualQty, 10),
        batchNumber: manualBatch
      }
    ]);
    setManualSku('');
    setManualQty('');
    setManualBatch('');
  };

  const handleRemoveLine = (index) => {
    setManualLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateRma = () => {
    if (!originalOrderId || manualLines.length === 0) {
      toast.error('Please specify the Sales Order ID and add at least one line');
      return;
    }
    const payload = {
      originalOrderId: parseInt(originalOrderId, 10),
      customerRef,
      lines: manualLines
    };
    createReturnMutation.mutate(payload);
  };

  const handleGradeLineChange = (lineId, field, value) => {
    setInspectionGrades(prev => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveGrade = (lineId) => {
    const gradeData = inspectionGrades[lineId];
    if (!gradeData || !gradeData.grade) {
      toast.error('Please select a condition grade');
      return;
    }
    gradeLineMutation.mutate({
      orderId: inspectingOrder.id,
      lineId,
      payload: {
        conditionGrade: gradeData.grade,
        inspectionNotes: gradeData.notes || '',
        batchNumber: gradeData.batch || ''
      }
    });
  };

  const handleRestock = (lineId) => {
    const binBarcode = restockBins[lineId];
    if (!binBarcode || !binBarcode.trim()) {
      toast.error('Please enter or scan a target bin barcode');
      return;
    }
    restockLineMutation.mutate({
      orderId: inspectingOrder.id,
      lineId,
      binBarcode: binBarcode.trim()
    });
  };

  // Stats calculation
  const totalRmas = returns.length;
  const awaitingInspection = returns.filter(r => r.status === 'RECEIVED' || r.status === 'INSPECTING').length;
  const closedRmas = returns.filter(r => r.status === 'CLOSED' || r.status === 'REFUND_TRIGGERED').length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Returns & RMA Management"
        description="Initiate RMA requests, receive customer returns, grade item condition, restock resellable items, and trigger billing refunds."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total RMA Tickets"
          value={totalRmas}
          icon={RotateCcw}
          kpiVariant="blue"
          accentClass="text-blue-500"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          title="Awaiting Inspection"
          value={awaitingInspection}
          icon={AlertTriangle}
          kpiVariant="amber"
          accentClass="text-amber-500"
          iconBg="bg-amber-500/10"
        />
        <StatCard
          title="Refunded / Closed"
          value={closedRmas}
          icon={CheckCircle}
          kpiVariant="green"
          accentClass="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        if (val !== 'workspace') {
          setInspectingOrder(null);
        }
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:max-w-md h-11 p-1 bg-slate-100 rounded-xl mb-4">
          <TabsTrigger value="orders" className="rounded-lg text-xs font-semibold">RMA Queue</TabsTrigger>
          <TabsTrigger value="create" className="rounded-lg text-xs font-semibold" disabled={!can('INVENTORY_ADJUST')}>
            Create RMA
          </TabsTrigger>
          <TabsTrigger value="workspace" className="rounded-lg text-xs font-semibold" disabled={!inspectingOrder}>
            Inspection Workspace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">Customer Returns Queue</CardTitle>
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['returns'] })}
                className="text-xs text-blue-600 hover:text-blue-500 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </CardHeader>
            <CardContent className="p-0">
              {returnsLoading ? (
                <div className="text-center py-10 text-slate-400">Loading returns...</div>
              ) : returns.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No return orders found.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead>RMA ID</TableHead>
                      <TableHead>Sales Order ID</TableHead>
                      <TableHead>Customer Ref</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map((rma) => (
                      <TableRow key={rma.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-800">#{rma.id}</TableCell>
                        <TableCell className="text-slate-600">SO #{rma.originalOrderId}</TableCell>
                        <TableCell className="text-slate-600 font-mono text-xs">{rma.customerRef || '—'}</TableCell>
                        <TableCell>
                          <StatusBadge status={rma.status} />
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {rma.createdAt ? format(new Date(rma.createdAt), 'yyyy-MM-dd HH:mm') : '—'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {rma.status === 'RETURN_REQUESTED' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: rma.id, status: 'AWAITING_PICKUP' })}
                            >
                              Approve Pickup
                            </Button>
                          )}
                          {rma.status === 'AWAITING_PICKUP' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: rma.id, status: 'IN_TRANSIT' })}
                            >
                              Dispatch Carrier
                            </Button>
                          )}
                          {rma.status === 'IN_TRANSIT' && (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-500 text-white"
                              onClick={() => updateStatusMutation.mutate({ id: rma.id, status: 'RECEIVED' })}
                            >
                              Mark Received
                            </Button>
                          )}
                          {(rma.status === 'RECEIVED' || rma.status === 'INSPECTING') && (
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-500 text-white"
                              onClick={() => {
                                setInspectingOrder(rma);
                                // Initialize inspection grades and bins
                                const grades = {};
                                const bins = {};
                                rma.lines.forEach(line => {
                                  grades[line.id] = {
                                    grade: line.conditionGrade || '',
                                    notes: line.inspectionNotes || '',
                                    batch: line.batchNumber || ''
                                  };
                                  bins[line.id] = line.restockedBinBarcode || '';
                                });
                                setInspectionGrades(grades);
                                setRestockBins(bins);
                                if (rma.status === 'RECEIVED') {
                                  updateStatusMutation.mutate({ id: rma.id, status: 'INSPECTING' });
                                }
                                setActiveTab('workspace');
                              }}
                            >
                              Inspect & Grade
                            </Button>
                          )}
                          {rma.status === 'INSPECTING' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: rma.id, status: 'RESTOCKED' })}
                            >
                              Complete Restock
                            </Button>
                          )}
                          {rma.status === 'RESTOCKED' && (
                            <Button 
                              size="sm" 
                              className="bg-amber-600 hover:bg-amber-500 text-white"
                              onClick={() => updateStatusMutation.mutate({ id: rma.id, status: 'REFUND_TRIGGERED' })}
                            >
                              Trigger Refund
                            </Button>
                          )}
                          {rma.status === 'REFUND_TRIGGERED' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: rma.id, status: 'CLOSED' })}
                            >
                              Close RMA
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create RMA details */}
            <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white md:col-span-2">
              <CardHeader className="py-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">RMA Intake Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Original Sales Order ID</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="e.g. 15" 
                        value={originalOrderId} 
                        onChange={(e) => setOriginalOrderId(e.target.value)}
                      />
                      <Button 
                        onClick={handleFetchOriginalOrder} 
                        disabled={loadingOrder}
                        className="bg-slate-800 text-white hover:bg-slate-700"
                      >
                        {loadingOrder ? 'Loading...' : 'Pull Lines'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Customer Return Ref</label>
                    <Input 
                      placeholder="e.g. REF-1092-RET" 
                      value={customerRef} 
                      onChange={(e) => setCustomerRef(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Return Items List</h4>
                  {manualLines.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No items added yet. Pull an order above or add items manually.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU Code</TableHead>
                          <TableHead>Ordered Qty</TableHead>
                          <TableHead>Returned Qty</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manualLines.map((line, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-semibold text-slate-700">{line.skuCode}</TableCell>
                            <TableCell>{line.orderedQty}</TableCell>
                            <TableCell>
                              <input 
                                type="number" 
                                className="w-16 border rounded px-1.5 py-0.5 text-xs text-center"
                                value={line.returnedQty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  setManualLines(prev => prev.map((l, i) => i === index ? { ...l, returnedQty: val } : l));
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <input 
                                type="text" 
                                className="w-24 border rounded px-1.5 py-0.5 text-xs font-mono"
                                value={line.batchNumber}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setManualLines(prev => prev.map((l, i) => i === index ? { ...l, batchNumber: val } : l));
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <button 
                                onClick={() => handleRemoveLine(index)}
                                className="text-rose-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleCreateRma} 
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1"
                    disabled={manualLines.length === 0}
                  >
                    Generate Return RMA <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Add manual SKU card */}
            <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white">
              <CardHeader className="py-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">Add Manual Sku</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">SKU Code</label>
                  <Input 
                    placeholder="e.g. SKU-SHIRT-M" 
                    value={manualSku} 
                    onChange={(e) => setManualSku(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Returned Qty</label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 1" 
                    value={manualQty} 
                    onChange={(e) => setManualQty(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Batch Number (Optional)</label>
                  <Input 
                    placeholder="e.g. BATCH-A93" 
                    value={manualBatch} 
                    onChange={(e) => setManualBatch(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleAddManualLine} 
                  className="w-full bg-slate-850 hover:bg-slate-700 text-white flex items-center justify-center gap-1 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Sku Line
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workspace">
          {inspectingOrder && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-850 rounded-xl p-4 text-white">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Active Inspection Workflow</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">RMA Ticket #{inspectingOrder.id}</h3>
                  <p className="text-xs text-slate-400 mt-1">Associated Order: SO #{inspectingOrder.originalOrderId}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-white border-slate-700 hover:bg-slate-800"
                    onClick={() => {
                      setInspectingOrder(null);
                      setActiveTab('orders');
                    }}
                  >
                    Close Workspace
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {inspectingOrder.lines.map((line) => {
                  const gradeInfo = inspectionGrades[line.id] || {};
                  return (
                    <Card key={line.id} className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden">
                      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <Box className="w-4 h-4 text-slate-500" />
                            {line.skuCode}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span>Returned Qty: <strong className="text-slate-600">{line.returnedQty}</strong></span>
                            <span>•</span>
                            <span>Expected Batch: <strong className="text-slate-600 font-mono">{line.batchNumber || '—'}</strong></span>
                          </div>
                        </div>

                        {line.restockedBinBarcode ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <Check className="w-3.5 h-3.5" /> Restocked to Bin: {line.restockedBinBarcode}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 font-semibold italic">
                            {line.conditionGrade ? `Graded: ${line.conditionGrade}` : 'Awaiting Inspection'}
                          </div>
                        )}
                      </div>

                      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Grading form */}
                        <div className="space-y-4 border-r border-slate-100 pr-0 md:pr-6">
                          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Inspector Grading & Comments</h5>
                          <div className="grid grid-cols-3 gap-2">
                            {['RESELLABLE', 'DAMAGED', 'SCRAP'].map((grd) => (
                              <button
                                key={grd}
                                disabled={!!line.restockedBinBarcode}
                                onClick={() => handleGradeLineChange(line.id, 'grade', grd)}
                                className={`py-2 px-3 border rounded-lg text-xs font-bold transition-all text-center ${
                                  gradeInfo.grade === grd
                                    ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                } ${line.restockedBinBarcode ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {grd}
                              </button>
                            ))}
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Inspection & Quality Notes</label>
                            <Input
                              placeholder="Describe product condition or packaging damage..."
                              disabled={!!line.restockedBinBarcode}
                              value={gradeInfo.notes || ''}
                              onChange={(e) => handleGradeLineChange(line.id, 'notes', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Batch Number (Overwrite)</label>
                            <Input
                              placeholder="Verify actual physical lot/batch barcode..."
                              disabled={!!line.restockedBinBarcode}
                              value={gradeInfo.batch || ''}
                              onChange={(e) => handleGradeLineChange(line.id, 'batch', e.target.value)}
                            />
                          </div>
                          {!line.restockedBinBarcode && (
                            <Button
                              size="sm"
                              className="bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold"
                              onClick={() => handleSaveGrade(line.id)}
                            >
                              Save Grade & Inspection Notes
                            </Button>
                          )}
                        </div>

                        {/* Restocking action */}
                        <div className="space-y-4">
                          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Bin Restocking & Integration</h5>
                          
                          {line.conditionGrade === 'RESELLABLE' ? (
                            <div className="space-y-4">
                              <p className="text-xs text-slate-500">
                                This item is marked as <strong>RESELLABLE</strong>. Please scan or select a target storage bin to return it to active inventory.
                              </p>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Scan Target Bin Barcode</label>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="e.g. BIN-A-1"
                                    disabled={!!line.restockedBinBarcode}
                                    value={restockBins[line.id] || ''}
                                    onChange={(e) => setRestockBins(prev => ({ ...prev, [line.id]: e.target.value }))}
                                    className="font-mono"
                                  />
                                  {!line.restockedBinBarcode && (
                                    <Button
                                      onClick={() => handleRestock(line.id)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                                    >
                                      Restock
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : line.conditionGrade ? (
                            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl text-xs text-rose-700 space-y-1">
                              <h6 className="font-bold">Discard Workflow Required</h6>
                              <p>Item is graded <strong>{line.conditionGrade}</strong>. It cannot be restocked to active storage bins. Please route to the disposal / scrap area.</p>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                              Awaiting inspector grading in step 1.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
