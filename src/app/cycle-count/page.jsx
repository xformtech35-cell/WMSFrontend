'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
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
import { ClipboardCheck, ShieldAlert, Award, FileText, CheckCircle, XCircle, Play, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function CycleCountPage() {
  const queryClient = useQueryClient();
  const { can, role } = usePermissions();
  const [activeTab, setActiveTab] = useState('tasks');
  const [activeTask, setActiveTask] = useState(null);
  const [countedQuantities, setCountedQuantities] = useState({}); // skuId_batchNumber -> quantity
  const [reasonCodes, setReasonCodes] = useState({});

  // Queries
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['countTasks'],
    queryFn: () => api.get('/cycle-count').then((r) => r.data ?? []),
  });

  const { data: varianceLines = [], isLoading: varianceLoading } = useQuery({
    queryKey: ['varianceReview'],
    queryFn: () => api.get('/cycle-count/variance-review').then((r) => r.data ?? []),
    enabled: can('INVENTORY_ADJUST'),
  });

  const { data: analytics = {} } = useQuery({
    queryKey: ['cycleCountAnalytics'],
    queryFn: () => api.get('/cycle-count/analytics').then((r) => r.data ?? {}),
  });

  // Mutations
  const startTaskMutation = useMutation({
    mutationFn: (id) => api.post(`/cycle-count/${id}/start`),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['countTasks'] });
      setActiveTask(data);
      toast.success('Cycle count task started');
    },
  });

  const submitCountMutation = useMutation({
    mutationFn: ({ id, counts }) => api.post(`/cycle-count/${id}/submit`, counts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countTasks'] });
      queryClient.invalidateQueries({ queryKey: ['varianceReview'] });
      queryClient.invalidateQueries({ queryKey: ['cycleCountAnalytics'] });
      setActiveTask(null);
      setCountedQuantities({});
      setReasonCodes({});
      toast.success('Counts submitted successfully');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (lineId) => api.post(`/cycle-count/lines/${lineId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['varianceReview'] });
      queryClient.invalidateQueries({ queryKey: ['cycleCountAnalytics'] });
      toast.success('Variance approved, stock adjusted');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (lineId) => api.post(`/cycle-count/lines/${lineId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['varianceReview'] });
      toast.success('Variance rejected');
    },
  });

  const createAdHocMutation = useMutation({
    mutationFn: (req) => api.post('/cycle-count', req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countTasks'] });
      toast.success('Ad-hoc cycle count generated');
    },
  });

  // Action handlers
  const handleStartTask = (task) => {
    if (task.status === 'IN_PROGRESS') {
      setActiveTask(task);
    } else {
      startTaskMutation.mutate(task.id);
    }
  };

  const handleQtyChange = (skuId, batchNo, val) => {
    setCountedQuantities((prev) => ({
      ...prev,
      [`${skuId}_${batchNo ?? ''}`]: Number(val),
    }));
  };

  const handleReasonChange = (skuId, batchNo, val) => {
    setReasonCodes((prev) => ({
      ...prev,
      [`${skuId}_${batchNo ?? ''}`]: val,
    }));
  };

  const handleSubmitCounts = () => {
    if (!activeTask) return;
    const counts = activeTask.lines.map((line) => {
      const key = `${line.sku.id}_${line.batchNumber ?? ''}`;
      return {
        skuId: line.sku.id,
        batchNumber: line.batchNumber,
        countedQty: countedQuantities[key] ?? 0,
        reasonCode: reasonCodes[key] || 'MISCOUNT',
      };
    });

    submitCountMutation.mutate({ id: activeTask.id, counts });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cycle Counting"
        description="Fulfill cycle counts weekly/monthly based on ABC velocity, review variances, and approve stock ledger edits."
      />

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Accuracy score"
          value={`${Number(analytics.accuracyPct ?? 100).toFixed(1)}%`}
          icon={Award}
          kpiVariant="green"
          accentClass="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          title="Pending variances"
          value={varianceLines.length}
          icon={ShieldAlert}
          kpiVariant="rose"
          accentClass="text-rose-500"
          iconBg="bg-rose-500/10"
        />
        <StatCard
          title="Total counts conducted"
          value={analytics.totalCountsCounted ?? 0}
          icon={ClipboardCheck}
          kpiVariant="blue"
          accentClass="text-blue-500"
          iconBg="bg-blue-500/10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:max-w-md h-11 p-1 bg-slate-100 rounded-xl mb-4">
          <TabsTrigger value="tasks" className="rounded-lg text-xs font-semibold">Count Tasks</TabsTrigger>
          <TabsTrigger value="review" className="rounded-lg text-xs font-semibold" disabled={!can('INVENTORY_ADJUST')}>
            Variance Review ({varianceLines.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs font-semibold">Adjustment History</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          {activeTask ? (
            /* guided count screen */
            <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800">
                    Executing Task #{activeTask.id}
                  </CardTitle>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bin: <span className="font-bold text-slate-600">{activeTask.bin?.barcode ?? 'Multiple'}</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>
                  Cancel
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU Details</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Counted Qty</TableHead>
                      <TableHead>Reason (If Variance)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTask.lines?.map((line) => {
                      const key = `${line.sku.id}_${line.batchNumber ?? ''}`;
                      return (
                        <TableRow key={line.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-slate-800">{line.sku.skuCode}</span>
                              <span className="text-[10px] text-slate-400">{line.sku.description}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">
                            {line.batchNumber ?? 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              placeholder="Input counted qty"
                              value={countedQuantities[key] ?? ''}
                              onChange={(e) => handleQtyChange(line.sku.id, line.batchNumber, e.target.value)}
                              className="w-32 h-9 rounded-lg"
                            />
                          </TableCell>
                          <TableCell>
                            <select
                              value={reasonCodes[key] || ''}
                              onChange={(e) => handleReasonChange(line.sku.id, line.batchNumber, e.target.value)}
                              className="rounded-lg border border-slate-200 text-xs px-2.5 py-1.5 focus:border-indigo-500 outline-none"
                            >
                              <option value="MISCOUNT">Miscount</option>
                              <option value="DAMAGE">Damaged Stock</option>
                              <option value="THEFT">Missing / Theft</option>
                              <option value="SYSTEM_ERROR">System Error</option>
                              <option value="FOUND_STOCK">Found Extra Stock</option>
                            </select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    onClick={handleSubmitCounts}
                    disabled={submitCountMutation.isPending}
                    className="h-10 rounded-xl"
                  >
                    Submit Counts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* task list */
            <div className="glass-card rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">Scheduled Counts</h3>
                <Button
                  size="xs"
                  onClick={() => createAdHocMutation.mutate({ binId: 1, skuId: 1 })}
                  className="rounded-lg"
                >
                  Create Ad-Hoc Task
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasksLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-400">
                        Loading tasks...
                      </TableCell>
                    </TableRow>
                  ) : tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-400">
                        No counting tasks scheduled.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-bold text-xs">#{task.id}</TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {task.bin ? `Bin: ${task.bin.barcode}` : task.zone ? `Zone: ${task.zone.name}` : 'Full Warehouse'}
                          {task.sku && ` (${task.sku.skuCode})`}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {format(new Date(task.scheduledDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={task.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {(task.status === 'SCHEDULED' || task.status === 'IN_PROGRESS') && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleStartTask(task)}
                              disabled={startTaskMutation.isPending}
                            >
                              <Play className="size-3 mr-1" />
                              {task.status === 'IN_PROGRESS' ? 'Resume' : 'Count'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="review">
          <div className="glass-card rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
              Supervisor Approval Queue
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU Details</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Expected Qty</TableHead>
                  <TableHead>Counted Qty</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {varianceLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400">
                      Loading review queue...
                    </TableCell>
                  </TableRow>
                ) : varianceLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400">
                      No pending count variances found.
                    </TableCell>
                  </TableRow>
                ) : (
                  varianceLines.map((line) => (
                    <TableRow key={line.id} className="hover:bg-slate-50/40">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-slate-800">{line.sku.skuCode}</span>
                          <span className="text-[10px] text-slate-400">{line.sku.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">{line.batchNumber ?? 'N/A'}</TableCell>
                      <TableCell className="text-xs font-semibold">{line.expectedQty}</TableCell>
                      <TableCell className="text-xs font-semibold">{line.countedQty}</TableCell>
                      <TableCell className={`text-xs font-bold ${line.variance > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {line.variance > 0 ? `+${line.variance}` : line.variance}
                      </TableCell>
                      <TableCell>
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600">
                          {line.reasonCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2.5 py-3">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg"
                          onClick={() => rejectMutation.mutate(line.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="size-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-emerald-500 hover:text-emerald-700 p-1 rounded-lg"
                          onClick={() => approveMutation.mutate(line.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="size-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="glass-card rounded-2xl p-5 bg-white border border-slate-100 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
              Audited Ledger Adjustments
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Qty Adjusted</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Adjusted By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recentAdjustments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400">
                      No adjustments logged.
                    </TableCell>
                  </TableRow>
                ) : (
                  analytics.recentAdjustments?.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell className="text-xs font-bold text-slate-800">{adj.sku?.skuCode}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{adj.bin?.barcode ?? 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">{adj.batchNumber ?? 'N/A'}</TableCell>
                      <TableCell className={`text-xs font-bold ${adj.quantityAdjusted > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {adj.quantityAdjusted > 0 ? `+${adj.quantityAdjusted}` : adj.quantityAdjusted}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{adj.reason}</TableCell>
                      <TableCell className="text-xs text-slate-600">{adj.adjustedBy?.username ?? 'System'}</TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {format(new Date(adj.createdAt), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
