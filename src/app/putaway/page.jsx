'use client';
export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  History,
  Loader2,
  Search,
  Warehouse,
  X,
  Flag,
  Clock,
  Scan,
  CheckCircle,
  Truck,
  ClipboardList,
  Package,
  MapPin,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/api';
import { exportWmsWorkbook } from '@/lib/exportExcel';

// ─── Priority Badge Component ──────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    'high': { label: 'High', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: Flag },
    'medium': { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    'low': { label: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Flag },
    'normal': { label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Flag },
    'urgent': { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200', icon: Flag }
  };
  
  const normalizedPriority = String(priority || 'normal').toLowerCase();
  const config = priorityConfig[normalizedPriority] || priorityConfig.normal;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// ─── Status Badge Component ────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const statusConfig = {
    'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    'in_progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Truck },
    'completed': { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    'fully received': { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    'submitted': { label: 'Submitted', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    'approved': { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    'partial': { label: 'Partial', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle },
    'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
    'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: ClipboardList }
  };
  
  const normalizedStatus = String(status || 'pending').toLowerCase();
  const config = statusConfig[normalizedStatus] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// ─── Stat Card Component ──────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

// ─── Helper Functions ──────────────────────────────────────────────────────
const unwrapPurchaseRequestList = (payload) => {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
};

const normalizePurchaseRequest = (pr) => {
  const items = Array.isArray(pr.items) ? pr.items : [];

  return {
    ...pr,
    priority: String(pr.priority || 'normal').toLowerCase(),
    status: String(pr.status || 'pending').toLowerCase(),
    supplier: pr.supplier || pr.supplierName || 'No supplier selected',
    totalAmount: Number(pr.totalAmount || 0),
    createdAt: pr.createdAt || pr.createdDate || pr.requestedDate || new Date().toISOString(),
    items: items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const receivedQuantity = Number(item.receivedQuantity || 0);
      const pendingQuantity = item.pendingQuantity ?? Math.max(quantity - receivedQuantity, 0);

      return {
        ...item,
        id: item.id ?? item.itemId ?? item.purchaseRequestItemId,
        itemCode: item.itemCode || '-',
        itemBarcode: item.itemBarcode || '-',
        quantity,
        receivedQuantity,
        pendingQuantity,
        receipts: Array.isArray(item.receipts) ? item.receipts : [],
        // Add a flag to track if this item has been putaway
        isPutaway: item.isPutaway || false
      };
    }),
  };
};

const normalizePutawayTask = (task) => ({
  taskId: task.taskId || task.id,
  prNumber: task.prNumber || 'PUTAWAY',
  itemName: task.itemName || task.skuName || 'Item',
  itemCode: task.itemCode || task.skuCode || '-',
  priority: task.priority || 'normal',
  itemBarcode: task.itemBarcode || '-',
  suggestedBin: task.suggestedBinBarcode || task.suggestedBin || 'Not assigned',
  pendingQuantity: task.pendingQuantity || 1,
  receivedQuantity: task.receivedQuantity || 1,
  totalQuantity: task.totalQuantity || 1,
  unit: task.unit || 'pcs',
  supplier: task.supplier || 'Warehouse',
  status: task.state || 'pending',
  itemStatus: task.itemStatus || 'partial_received',
  batchNo: task.batchNo || 'BATCH-GEN',
  skuId: task.skuId || null,
  skuCode: task.skuCode || task.itemCode || '-',
  skuName: task.skuName || task.itemName || '-',
  itemId: task.itemId || null,
  prId: task.prId || null,
});

async function exportTasksExcel(tasks) {
  await exportWmsWorkbook({
    fileName: `putaway_tasks_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
    sheetName: 'Putaway Tasks',
    title: 'WMS Putaway Tasks Export',
    columns: [
      { header: 'PR Number', key: 'prNumber', width: 16 },
      { header: 'Item Name', key: 'itemName', width: 24 },
      { header: 'Priority', key: 'priority', width: 12, align: 'center' },
      { header: 'Item Barcode', key: 'itemBarcode', width: 24 },
      { header: 'Suggested Bin', key: 'suggestedBin', width: 18 },
      { header: 'Pending Qty', key: 'pendingQuantity', width: 14, align: 'right' },
      { header: 'Received Qty', key: 'receivedQuantity', width: 14, align: 'right' },
      { header: 'Total Qty', key: 'totalQuantity', width: 14, align: 'right' },
      { header: 'Status', key: 'status', width: 14, align: 'center' },
    ],
    rows: tasks.map((t) => ({
      prNumber: t.prNumber ?? '',
      itemName: t.itemName ?? '',
      priority: t.priority || 'normal',
      itemBarcode: t.itemBarcode ?? '',
      suggestedBin: t.suggestedBin || 'Not assigned',
      pendingQuantity: t.pendingQuantity || 0,
      receivedQuantity: t.receivedQuantity || 0,
      totalQuantity: t.totalQuantity || 0,
      status: t.itemStatus || 'pending',
    })),
  });
  toast.success('Putaway data exported to Excel');
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function PutawayPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [lastExecution, setLastExecution] = useState(null);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [foundItem, setFoundItem] = useState(null);
  const [foundBin, setFoundBin] = useState(null);
  const [binLookupError, setBinLookupError] = useState(false);
  const [skuMap, setSkuMap] = useState({});
  const [skuList, setSkuList] = useState([]);
  const [putawayHistory, setPutawayHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [completedPutaways, setCompletedPutaways] = useState(new Set());
  const [putawayTasks, setPutawayTasks] = useState([]);

  // Fetch SKU cache on mount
  useEffect(() => {
    const fetchSkuCache = async () => {
      try {
        const { data } = await api.get('/inventory/meta');
        const skus = data?.skus || [];
        
        if (skus.length === 0) {
          console.warn('No SKUs found in meta data, trying to fetch from master SKU endpoint');
          try {
            const skuResponse = await api.get('/master/skus');
            const masterSkus = skuResponse.data?.content || skuResponse.data || [];
            if (masterSkus.length > 0) {
              setSkuList(masterSkus);
              const map = {};
              masterSkus.forEach(s => {
                map[s.skuCode?.toUpperCase()] = s;
                if (s.skuName) map[s.skuName?.toUpperCase()] = s;
                if (s.description) map[s.description?.toUpperCase()] = s;
                if (s.barcode) map[s.barcode?.toUpperCase()] = s;
              });
              setSkuMap(map);
              return;
            }
          } catch (skuError) {
            console.warn('Failed to fetch SKUs from master endpoint:', skuError);
          }
        }
        
        setSkuList(skus);
        const map = {};
        skus.forEach(s => {
          map[s.skuCode?.toUpperCase()] = s;
          if (s.skuName) map[s.skuName?.toUpperCase()] = s;
          if (s.description) map[s.description?.toUpperCase()] = s;
          if (s.barcode) map[s.barcode?.toUpperCase()] = s;
        });
        setSkuMap(map);
        
      } catch (error) {
        console.error('Failed to fetch SKU cache:', error);
        // Set demo SKUs for testing
        const demoSKUs = [
          { id: 1, skuCode: 'SKU-001', skuName: 'Laptop 15"', description: 'Laptop 15"', barcode: '8901234567890' },
          { id: 2, skuCode: 'SKU-002', skuName: 'Wireless Mouse', description: 'Wireless Mouse', barcode: '8901234567892' },
          { id: 3, skuCode: 'SKU-003', skuName: 'USB Cable', description: 'USB Cable', barcode: '8901234567894' },
          { id: 4, skuCode: 'SKU-004', skuName: 'External Drive', description: 'External Drive', barcode: '8901234567896' },
          { id: 5, skuCode: 'SKU-005', skuName: 'Monitor 24"', description: 'Monitor 24"', barcode: '8901234567898' },
        ];
        setSkuList(demoSKUs);
        const map = {};
        demoSKUs.forEach(s => {
          map[s.skuCode?.toUpperCase()] = s;
          if (s.skuName) map[s.skuName?.toUpperCase()] = s;
          if (s.description) map[s.description?.toUpperCase()] = s;
          if (s.barcode) map[s.barcode?.toUpperCase()] = s;
        });
        setSkuMap(map);
      }
    };
    fetchSkuCache();
  }, []);

  // Load completed putaways from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('completedPutaways');
      if (saved) {
        setCompletedPutaways(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.warn('Failed to load completed putaways:', error);
    }
  }, []);

  // Save completed putaways to localStorage
  const saveCompletedPutaway = (taskId) => {
    const newSet = new Set(completedPutaways);
    newSet.add(taskId);
    setCompletedPutaways(newSet);
    try {
      localStorage.setItem('completedPutaways', JSON.stringify([...newSet]));
    } catch (error) {
      console.warn('Failed to save completed putaway:', error);
    }
  };

  useEffect(() => {
    fetchPurchaseRequests();
    fetchPendingPutawayTasks();
  }, []);

  const fetchPendingPutawayTasks = async () => {
    try {
      const { data } = await api.get('/putaway/tasks/pending');
      const normalized = (Array.isArray(data) ? data : []).map(normalizePutawayTask);
      setPutawayTasks(normalized);
    } catch (error) {
      console.warn('Failed to load pending putaway tasks from backend:', error);
      setPutawayTasks([]);
    }
  };

  const fetchPurchaseRequests = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/purchase-requests', {
        params: { size: 100, sortBy: 'createdAt', sortDir: 'desc' },
      });
      let data = unwrapPurchaseRequestList(response.data).map(normalizePurchaseRequest);
      
      // Filter: Only show items that have receivedQuantity > 0 and are not putaway
      data = data.filter(pr => {
        // Filter out items that have been putaway
        pr.items = pr.items.filter(item => {
          // Skip if item has been putaway (marked in localStorage)
          const taskId = `${pr.prNumber}-${item.id}`;
          if (completedPutaways.has(taskId)) {
            return false;
          }
          // Skip if item has isPutaway flag
          if (item.isPutaway) {
            return false;
          }
          return item.receivedQuantity > 0;
        });
        return pr.items.length > 0;
      });
      
      data = data.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      
      setPurchaseRequests(data);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      toast.error('Failed to load purchase requests');
      // Demo data for testing
      const demoData = [
        {
          id: 1,
          prNumber: 'PR-2026-0035',
          requestedDate: '2026-06-20',
          requiredDate: '2026-06-26',
          createdAt: '2026-06-20T10:00:00Z',
          status: 'completed',
          priority: 'high',
          supplier: 'Tech Solutions Inc.',
          totalAmount: 5000,
          items: [
            { 
              id: 1, 
              itemCode: 'SKU-001', 
              itemBarcode: '8901234567890', 
              itemName: 'Laptop 15"', 
              quantity: 5, 
              unit: 'packs', 
              unitPrice: 1000, 
              total: 5000, 
              receivedQuantity: 5, 
              pendingQuantity: 0, 
              receipts: [{ receivedDate: '2026-06-20', receivedQuantity: 5, qualityStatus: 'good' }],
              isPutaway: false
            }
          ]
        },
        {
          id: 2,
          prNumber: 'PR-2026-0022',
          requestedDate: '2026-06-19',
          requiredDate: '2026-06-27',
          createdAt: '2026-06-19T14:30:00Z',
          status: 'completed',
          priority: 'medium',
          supplier: 'Office Supplies Co.',
          totalAmount: 1344,
          items: [
            { 
              id: 3, 
              itemCode: 'SKU-002', 
              itemBarcode: '8901234567892', 
              itemName: 'Wireless Mouse', 
              quantity: 3, 
              unit: 'pcs', 
              unitPrice: 448, 
              total: 1344, 
              receivedQuantity: 3, 
              pendingQuantity: 0, 
              receipts: [{ receivedDate: '2026-06-19', receivedQuantity: 3, qualityStatus: 'good' }],
              isPutaway: false
            }
          ]
        },
        {
          id: 3,
          prNumber: 'PR-2026-0045',
          requestedDate: '2026-06-21',
          requiredDate: '2026-06-28',
          createdAt: '2026-06-21T09:15:00Z',
          status: 'partial',
          priority: 'urgent',
          supplier: 'Global Electronics',
          totalAmount: 2500,
          items: [
            { 
              id: 5, 
              itemCode: 'SKU-003', 
              itemBarcode: '8901234567894', 
              itemName: 'USB Cable', 
              quantity: 10, 
              unit: 'pcs', 
              unitPrice: 250, 
              total: 2500, 
              receivedQuantity: 5, 
              pendingQuantity: 5, 
              receipts: [{ receivedDate: '2026-06-21', receivedQuantity: 5, qualityStatus: 'good' }],
              isPutaway: false
            }
          ]
        }
      ];
      
      // Filter out completed putaways from demo data
      let sortedDemo = demoData.map(pr => {
        pr.items = pr.items.filter(item => {
          const taskId = `${pr.prNumber}-${item.id}`;
          return !completedPutaways.has(taskId);
        });
        return pr;
      }).filter(pr => pr.items.length > 0);
      
      sortedDemo = sortedDemo.map(normalizePurchaseRequest);
      sortedDemo = sortedDemo.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      
      setPurchaseRequests(sortedDemo);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Find SKU by code or name
  const findSku = (itemCode, itemName) => {
    if (!itemCode && !itemName) return null;
    
    // First try exact match by code
    if (itemCode) {
      const upperCode = itemCode.toUpperCase();
      if (skuMap[upperCode]) {
        return skuMap[upperCode];
      }
      
      const exactMatch = skuList.find(s => 
        s.skuCode && s.skuCode.toUpperCase() === upperCode
      );
      if (exactMatch) return exactMatch;
    }
    
    // Try match by name
    if (itemName) {
      const upperName = itemName.toUpperCase();
      if (skuMap[upperName]) {
        return skuMap[upperName];
      }
      
      const exactNameMatch = skuList.find(s => 
        s.skuName && s.skuName.toUpperCase() === upperName
      );
      if (exactNameMatch) return exactNameMatch;
      
      for (const sku of skuList) {
        if (sku.skuName) {
          const skuNameUpper = sku.skuName.toUpperCase();
          if (skuNameUpper.includes(upperName) || upperName.includes(skuNameUpper)) {
            return sku;
          }
        }
      }
    }
    
    if (itemCode) {
      const upperCode = itemCode.toUpperCase();
      for (const sku of skuList) {
        if (sku.skuCode) {
          const skuCodeUpper = sku.skuCode.toUpperCase();
          if (skuCodeUpper.includes(upperCode) || upperCode.includes(skuCodeUpper)) {
            return sku;
          }
        }
      }
    }
    
    return null;
  };

  // Helper: Get Bin by Barcode
  const getBinByBarcode = async (binBarcode) => {
    try {
      let bin = null;
      
      try {
        const { data } = await api.get(`/master/bins/${encodeURIComponent(binBarcode)}`);
        if (data) {
          bin = {
            id: data.id,
            barcode: data.barcode,
            zone: 'RACK-' + (data.rackId || 'A')
          };
        }
      } catch (error) {
        console.warn('Failed to fetch single bin by barcode, trying list', error);
        try {
          const { data } = await api.get('/master/bins');
          if (Array.isArray(data)) {
            const matched = data.find(b => String(b.barcode).toUpperCase() === String(binBarcode).toUpperCase());
            if (matched) {
              bin = {
                id: matched.id,
                barcode: matched.barcode,
                zone: 'RACK-' + (matched.rackId || 'A')
              };
            }
          }
        } catch (innerError) {
          console.warn('Fallback master bins list failed', innerError);
        }
      }
      
      if (!bin) {
        bin = {
          id: 1,
          barcode: binBarcode,
          zone: 'FALLBACK'
        };
        setBinLookupError(true);
        toast.warning('Bin API not available, using fallback');
      } else {
        setBinLookupError(false);
      }
      
      return bin;
    } catch (error) {
      console.error('Error finding bin:', error);
      setBinLookupError(true);
      return {
        id: 1,
        barcode: binBarcode,
        zone: 'FALLBACK'
      };
    }
  };

  // Helper: Get Inventory Item by Barcode
  const getInventoryItemByBarcode = async (barcode) => {
    try {
      const { data } = await api.get('/inventory', {
        params: { search: barcode, size: 1 }
      });
      
      if (data?.content?.length) {
        const item = data.content[0];
        if (item.skuId) {
          const sku = skuList.find(s => s.id === item.skuId);
          if (sku) {
            item.skuName = sku.skuName || sku.description || '';
            item.skuCode = sku.skuCode;
          }
        }
        return item;
      }
      
      const matchingTask = tasks.find(t => 
        String(t.itemBarcode).toLowerCase() === String(barcode).toLowerCase()
      );
      
      if (matchingTask) {
        let skuId = matchingTask.skuId;
        let skuCode = matchingTask.itemCode || '';
        let skuName = matchingTask.itemName || '';
        
        if (!skuId) {
          const foundSku = findSku(skuCode, skuName);
          if (foundSku) {
            skuId = foundSku.id;
            skuCode = foundSku.skuCode;
            skuName = foundSku.skuName || foundSku.description || skuName;
          }
        }
        
        if (!skuId && skuList.length > 0) {
          const skuByCode = skuList.find(s => 
            s.skuCode && s.skuCode.toLowerCase() === skuCode.toLowerCase()
          );
          
          if (skuByCode) {
            skuId = skuByCode.id;
            skuCode = skuByCode.skuCode;
            skuName = skuByCode.skuName || skuByCode.description || skuName;
          } else {
            const firstSku = skuList[0];
            if (firstSku) {
              skuId = firstSku.id;
              skuCode = firstSku.skuCode;
              skuName = firstSku.skuName || firstSku.description || '';
              toast.warning(`No exact SKU match. Using: ${skuCode} for item ${matchingTask.itemName}`);
            } else {
              toast.error('No SKU available in system. Please create SKU first.');
              return null;
            }
          }
        } else if (!skuId) {
          toast.error('No SKU available. Please create SKU first.');
          return null;
        }

        return {
          id: null,
          skuId: skuId,
          skuCode: skuCode,
          skuName: skuName,
          barcode: barcode,
          quantity: matchingTask.receivedQuantity || 1,
          state: 'RECEIVED',
          batchNo: matchingTask.batchNo || 'BATCH-GEN',
          binId: null
        };
      }
      
      if (skuList.length > 0) {
        const skuByBarcode = skuList.find(s => 
          s.barcode && s.barcode.toLowerCase() === String(barcode).toLowerCase()
        );
        
        if (skuByBarcode) {
          return {
            id: null,
            skuId: skuByBarcode.id,
            skuCode: skuByBarcode.skuCode,
            skuName: skuByBarcode.skuName || skuByBarcode.description || '',
            barcode: barcode,
            quantity: 1,
            state: 'RECEIVED',
            batchNo: 'BATCH-GEN',
            binId: null
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding inventory item:', error);
      return null;
    }
  };

  // Flatten ALL items from received purchase requests or backend pending tasks
  const tasks = useMemo(() => {
    if (putawayTasks.length > 0) {
      return putawayTasks.filter((task) => !completedPutaways.has(task.taskId));
    }

    const flattened = [];
    const source = purchaseRequests;
    purchaseRequests.forEach((pr) => {
      pr.items.forEach((item, itemIndex) => {
        if (item.receivedQuantity > 0 && !completedPutaways.has(`${pr.prNumber}-${item.id}`)) {
          let sku = findSku(item.itemCode, item.itemName);
          let skuId = null;
          let skuCode = item.itemCode || '-';
          let skuName = item.itemName || '-';
          
          if (sku) {
            skuId = sku.id;
            skuCode = sku.skuCode || item.itemCode || '-';
            skuName = sku.skuName || sku.description || item.itemName || '-';
          } else {
            const skuByCode = skuList.find(s => 
              s.skuCode && s.skuCode.toLowerCase() === item.itemCode?.toLowerCase()
            );
            if (skuByCode) {
              skuId = skuByCode.id;
              skuCode = skuByCode.skuCode;
              skuName = skuByCode.skuName || skuByCode.description || item.itemName;
            }
          }
          
          flattened.push({
            taskId: `${pr.prNumber}-${item.id || itemIndex}`,
            prNumber: pr.prNumber,
            itemName: item.itemName,
            itemCode: item.itemCode || '-',
            priority: pr.priority,
            itemBarcode: item.itemBarcode,
            suggestedBin: item.suggestedBin || 'Not assigned',
            pendingQuantity: item.pendingQuantity,
            receivedQuantity: item.receivedQuantity,
            totalQuantity: item.quantity,
            unit: item.unit,
            supplier: pr.supplier,
            status: pr.status,
            itemStatus: item.pendingQuantity === 0 ? 'fully_received' : 'partial_received',
            batchNo: item.batchNo || 'BATCH-GEN',
            skuId: skuId,
            skuCode: skuCode,
            skuName: skuName,
            prIndex: purchaseRequests.indexOf(pr),
            itemIndex: itemIndex,
            itemId: item.id,
            prId: pr.id
          });
        }
      });
    });
    return flattened.filter(task => !completedPutaways.has(task.taskId));
  }, [purchaseRequests, skuMap, skuList, completedPutaways]);

  const stats = useMemo(() => {
    const all = tasks ?? [];
    const fullyReceived = all.filter((t) => t.pendingQuantity === 0).length;
    const partiallyReceived = all.filter((t) => t.pendingQuantity > 0).length;
    
    return {
      total: all.length,
      fullyReceived,
      partiallyReceived,
      high: all.filter((t) => t.priority === 'high' || t.priority === 'urgent').length,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    let list = tasks ?? [];
    
    if (priorityFilter !== 'ALL') {
      list = list.filter((t) => String(t.priority) === priorityFilter);
    }
    
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'fully_received') {
        list = list.filter((t) => t.pendingQuantity === 0);
      } else if (statusFilter === 'partial_received') {
        list = list.filter((t) => t.pendingQuantity > 0);
      }
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          String(t.itemName ?? '').toLowerCase().includes(q) ||
          String(t.itemBarcode ?? '').toLowerCase().includes(q) ||
          String(t.prNumber ?? '').toLowerCase().includes(q) ||
          String(t.suggestedBin ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, priorityFilter, statusFilter, search]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      z.object({
        itemBarcode: z.string().min(1, 'Item barcode is required'),
        binBarcode: z.string().min(1, 'Bin barcode is required'),
      })
    ),
  });

  // Watch for barcode changes to show preview
  const watchItemBarcode = watch('itemBarcode');
  const watchBinBarcode = watch('binBarcode');

  // Auto-fetch item details when barcode is entered
  useEffect(() => {
    if (watchItemBarcode && watchItemBarcode.length > 3) {
      const timeoutId = setTimeout(async () => {
        const item = await getInventoryItemByBarcode(watchItemBarcode);
        if (item) {
          setFoundItem(item);
        } else {
          setFoundItem(null);
          toast.warning('Item not found in inventory');
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setFoundItem(null);
    }
  }, [watchItemBarcode, skuList]);

  useEffect(() => {
    if (watchItemBarcode && watchItemBarcode.length > 3) {
      const timeoutId = setTimeout(async () => {
        setHistoryLoading(true);
        try {
          const { data } = await api.get('/putaway/history', {
            params: { serialNo: watchItemBarcode },
          });
          setPutawayHistory(Array.isArray(data) ? data : []);
        } catch (error) {
          console.warn('Failed to load putaway history:', error);
          setPutawayHistory([]);
        } finally {
          setHistoryLoading(false);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setPutawayHistory([]);
      setHistoryLoading(false);
    }
  }, [watchItemBarcode]);

  // Auto-fetch bin details when bin barcode is entered
  useEffect(() => {
    if (watchBinBarcode && watchBinBarcode.length > 3) {
      const timeoutId = setTimeout(async () => {
        const bin = await getBinByBarcode(watchBinBarcode);
        if (bin) {
          setFoundBin(bin);
        } else {
          setFoundBin(null);
          toast.warning('Bin not found');
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setFoundBin(null);
    }
  }, [watchBinBarcode]);

  // Putaway Execution Mutation
  const executeMutation = useMutation({
    mutationFn: async (payload) => {
      const { itemBarcode, binBarcode } = payload;

      const matchingTask = tasks.find((t) => {
        const normalizedEntered = String(itemBarcode).trim().toLowerCase();
        return [t.itemBarcode, t.itemCode, t.skuCode, t.skuName, t.itemName].some((value) =>
          String(value ?? '').trim().toLowerCase() === normalizedEntered
        );
      });

      const bin = await getBinByBarcode(binBarcode);
      if (!bin) {
        throw new Error('Bin not found');
      }

      let skuId = matchingTask?.skuId || null;
      let skuCode = matchingTask?.skuCode || matchingTask?.itemCode || '-';
      let skuName = matchingTask?.skuName || matchingTask?.itemName || '-';

      if (!skuId) {
        const foundSku = findSku(matchingTask?.itemCode, matchingTask?.itemName);
        if (foundSku) {
          skuId = foundSku.id;
          skuCode = foundSku.skuCode || matchingTask?.itemCode || '-';
          skuName = foundSku.skuName || foundSku.description || matchingTask?.itemName || '-';
        }
      }

      let inventoryItem = null;
      try {
        const { data } = await api.get('/inventory', {
          params: { search: itemBarcode, size: 1 },
        });
        if (data?.content?.length) {
          inventoryItem = data.content[0];
        }
      } catch (error) {
        console.warn('Inventory lookup failed before putaway fallback:', error);
      }

      try {
        const { data } = await api.post('/putaway/execute', {
          itemBarcode,
          binBarcode,
        });

        return {
          ...data,
          binBarcode: data.binBarcode || bin.barcode,
          itemBarcode,
          skuCode,
          skuName,
          taskId: matchingTask?.taskId,
          prNumber: matchingTask?.prNumber,
          itemId: matchingTask?.itemId,
          taskIdToRemove: matchingTask?.taskId,
        };
      } catch (backendError) {
        console.warn('Backend putaway execution failed, applying direct inventory fallback:', backendError);

        const fallbackPayload = {
          skuId: skuId || 1,
          binId: bin.id,
          barcode: inventoryItem?.barcode || itemBarcode,
          itemCode: matchingTask?.itemCode || skuCode,
          itemName: matchingTask?.itemName || skuName,
          batchNo: inventoryItem?.batchNo || matchingTask?.batchNo || 'BATCH-GEN',
          quantity: (inventoryItem?.quantity ?? 0) + (matchingTask?.receivedQuantity || 1),
          state: 'AVAILABLE',
        };

        let response;
        if (inventoryItem?.id) {
          response = await api.put(`/inventory/${inventoryItem.id}`, fallbackPayload);
        } else {
          response = await api.post('/inventory', fallbackPayload);
        }

        return {
          ...response.data,
          success: true,
          binBarcode: bin.barcode,
          itemBarcode,
          skuCode,
          skuName,
          taskId: matchingTask?.taskId,
          prNumber: matchingTask?.prNumber,
          itemId: matchingTask?.itemId,
          taskIdToRemove: matchingTask?.taskId,
        };
      }
    },
    onSuccess: (data) => {
      setLastExecution(data);
      toast.success(`✅ ${data.skuName || data.skuCode} putaway to bin ${data.binBarcode}`);
      
      // Save to localStorage so it stays removed even after refresh
      saveCompletedPutaway(data.taskId);
      setPutawayTasks(prev => prev.filter(task => task.taskId !== data.taskId));
      
      // Remove from local state
      setPurchaseRequests(prevRequests => {
        const prIndex = prevRequests.findIndex(pr => pr.prNumber === data.prNumber);
        
        if (prIndex === -1) {
          return prevRequests;
        }
        
        const pr = prevRequests[prIndex];
        const updatedItems = pr.items.filter(item => 
          item.id !== data.itemId && 
          item.itemBarcode !== data.itemBarcode
        );
        
        if (updatedItems.length === 0) {
          return prevRequests.filter((_, index) => index !== prIndex);
        }
        
        const updatedPR = {
          ...pr,
          items: updatedItems,
          status: updatedItems.some(item => item.receivedQuantity > 0) ? 'partial' : 'pending'
        };
        
        const newRequests = [...prevRequests];
        newRequests[prIndex] = updatedPR;
        return newRequests;
      });
      
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['putawayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      
      // reset form and clear previews
      reset();
      setFoundItem(null);
      setFoundBin(null);

      // Prefill next task (auto-advance) if available
      try {
        const currentIndex = tasks.findIndex(t => t.taskId === (data.taskIdToRemove || data.taskId));
        const nextTask = tasks[currentIndex + 1] || tasks[0];
        if (nextTask && nextTask.taskId !== (data.taskIdToRemove || data.taskId)) {
          const nextItemBarcode = nextTask.itemBarcode || nextTask.skuCode || '';
          const nextBinBarcode = nextTask.suggestedBin || '';

          // Prefill form fields
          reset({ itemBarcode: nextItemBarcode, binBarcode: nextBinBarcode });

          // Fetch and set previews asynchronously
          (async () => {
            if (nextItemBarcode) {
              const itm = await getInventoryItemByBarcode(nextItemBarcode);
              if (itm) setFoundItem(itm);
            }
            if (nextBinBarcode) {
              const bn = await getBinByBarcode(nextBinBarcode);
              if (bn) setFoundBin(bn);
            }

            // Focus the item barcode input for quick scanning
            try { setFocus && setFocus('itemBarcode'); } catch (e) { /* ignore */ }
          })();
        }
      } catch (e) {
        console.warn('Auto-advance to next putaway task failed', e);
      }
    },
    onError: (error) => {
      console.error('Putaway error:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to execute putaway');
    },
  });

  // Handle form submission
  const onSubmit = (values) => {
    if (!values.itemBarcode || !values.binBarcode) {
      toast.error('Please scan both item and bin barcodes');
      return;
    }
    executeMutation.mutate(values);
  };

  // Clear all completed putaways (for testing)
  const clearCompletedPutaways = () => {
    setCompletedPutaways(new Set());
    localStorage.removeItem('completedPutaways');
    toast.info('Cleared all putaway history');
    fetchPurchaseRequests();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Putaway Management</h1>
                <p className="text-blue-100 text-sm mt-1">View and manage received items for putaway</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchPurchaseRequests()}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg px-4 py-2 flex items-center gap-2 transition-colors text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={() => exportTasksExcel(filtered)}
                  disabled={!filtered?.length}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg px-4 py-2 flex items-center gap-2 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </button>
                <button
                  onClick={clearCompletedPutaways}
                  className="bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 rounded-lg px-4 py-2 flex items-center gap-2 transition-colors text-white text-sm"
                >
                  <X className="w-4 h-4" />
                  Clear History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Warning banner if bin API is not available */}
        {binLookupError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Bin API Not Available</p>
              <p className="text-sm text-amber-700">
                The bin lookup API is not available. Using fallback bin IDs for demonstration.
                Please check your API configuration.
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total Received Items" 
            value={stats.total} 
            icon={Package}
            color="bg-blue-600"
          />
          <StatCard 
            title="Fully Received" 
            value={stats.fullyReceived} 
            icon={CheckCircle}
            color="bg-green-600"
          />
          <StatCard 
            title="Partially Received" 
            value={stats.partiallyReceived} 
            icon={AlertCircle}
            color="bg-amber-600"
          />
          <StatCard 
            title="High Priority" 
            value={stats.high} 
            icon={Flag}
            color="bg-rose-600"
          />
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          {/* Tasks Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-blue-600" />
                  Received Items
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Showing items that have been received and are ready for putaway
                </p>
                {completedPutaways.size > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {completedPutaways.size} items already putaway (hidden)
                  </p>
                )}
              </div>

              {/* Filter Bar */}
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by PR, item, or barcode..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="ALL">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="ALL">All Status</option>
                    <option value="fully_received">Fully Received</option>
                    <option value="partial_received">Partially Received</option>
                  </select>
                </div>

                {(search || priorityFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <button
                    onClick={() => { 
                      setSearch(''); 
                      setPriorityFilter('ALL'); 
                      setStatusFilter('ALL'); 
                    }}
                    className="px-3 py-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PR Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(8)].map((__, c) => (
                          <td key={c} className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length ? (
                    filtered.map((task) => (
                      <tr key={task.taskId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {task.prNumber}
                        </td>
                        <td className="px-6 py-4">
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {task.skuName || task.itemName}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">
                          {task.skuCode || task.itemCode}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">{task.itemBarcode}</td>
                        <td className="px-6 py-4 text-sm text-green-600 font-medium">
                          {task.receivedQuantity} {task.unit}
                        </td>
                        <td className="px-6 py-4 text-sm text-amber-600 font-medium">
                          {task.pendingQuantity} {task.unit}
                        </td>
                        <td className="px-6 py-4">
                          {task.pendingQuantity === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle className="w-3 h-3" />
                              Fully Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Partial
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => router.push(`/putaway/history?serialNo=${encodeURIComponent(task.itemBarcode || task.skuCode || '')}`)}
                            disabled={!task.itemBarcode && !task.skuCode}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <History className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                          {tasks?.length ? 'No items match your filters' : 'No received items found'}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {tasks?.length ? 'Try adjusting your search or filters' : 'Items will appear here once received'}
                        </p>
                        {completedPutaways.size > 0 && (
                          <p className="text-xs text-gray-400 mt-2">
                            {completedPutaways.size} items have been putaway and are hidden
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scan Interface */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Scan className="w-5 h-5 text-blue-600" />
                Scan Interface
              </h2>
              <p className="text-sm text-gray-500 mt-1">Scan item and bin barcode to putaway</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Item Barcode
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Scan item barcode..."
                      {...register('itemBarcode')}
                      className={`pl-4 w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                        foundItem ? 'border-green-500 bg-green-50' : 'border-gray-300'
                      }`}
                    />
                    {foundItem && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                    )}
                  </div>
                  {errors.itemBarcode && (
                    <p className="mt-1 text-xs text-red-600">{errors.itemBarcode.message}</p>
                  )}
                  
                  {foundItem && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">
                        {foundItem.skuName || foundItem.skuCode || 'Item'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-600">
                        <span>Code: <span className="font-mono font-semibold">{foundItem.skuCode}</span></span>
                        <span>Qty: <span className="font-semibold">{foundItem.quantity}</span></span>
                        {foundItem.binId && (
                          <span>Current Bin: <span className="font-mono">{foundItem.binBarcode || 'Unknown'}</span></span>
                        )}
                        {foundItem.batchNo && (
                          <span>Batch: <span className="font-mono">{foundItem.batchNo}</span></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Bin Barcode
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Scan destination bin..."
                      {...register('binBarcode')}
                      className={`pl-4 w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                        foundBin ? 'border-green-500 bg-green-50' : 'border-gray-300'
                      }`}
                    />
                    {foundBin && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                    )}
                  </div>
                  {errors.binBarcode && (
                    <p className="mt-1 text-xs text-red-600">{errors.binBarcode.message}</p>
                  )}
                  
                  {foundBin && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <MapPin className="inline w-4 h-4 mr-1" />
                        Found bin: <span className="font-semibold">{foundBin.barcode}</span>
                        {foundBin.zone && (
                          <span className="ml-2 text-gray-600">Zone: {foundBin.zone}</span>
                        )}
                        {binLookupError && (
                          <span className="ml-2 text-amber-600 text-xs">
                            (fallback)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={executeMutation.isPending || !foundItem || !foundBin}
                  title={!foundItem ? 'Scan a valid item barcode' : !foundBin ? 'Scan a valid bin barcode' : 'Execute Putaway'}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {executeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      Execute Putaway
                    </>
                  )}
                </button>
              </form>

              {lastExecution && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Putaway completed successfully</p>
                      <div className="mt-2 space-y-1 text-sm text-green-700">
                        <p>
                          Item: <span className="font-mono font-medium">{lastExecution.skuName || lastExecution.skuCode}</span>
                        </p>
                        <p>
                          Code: <span className="font-mono font-medium">{lastExecution.skuCode}</span>
                        </p>
                        <p>
                          Bin: <span className="font-mono font-medium">{lastExecution.binBarcode}</span>
                        </p>
                        {lastExecution.oldBin && (
                          <p>
                            Previous Bin: <span className="font-mono">{lastExecution.oldBin}</span>
                          </p>
                        )}
                        <p>
                          Status: <span className="font-medium">INVENTORY UPDATED</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Putaway History</h3>
                    <p className="text-sm text-slate-500">Recent movements for the scanned serial number.</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{historyLoading ? 'Loading...' : `${putawayHistory.length} records`}</span>
                </div>

                {historyLoading ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500 text-center">
                    Loading history...
                  </div>
                ) : putawayHistory.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500 text-center">
                    No putaway history found for this serial.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {putawayHistory.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{entry.action?.replace(/_/g, ' ') || 'Putaway'}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {entry.fromState ? `${entry.fromState} → ` : ''}
                              <span className="font-medium">{entry.toState}</span>
                              {entry.binBarcode ? ` · Bin ${entry.binBarcode}` : ''}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-400">
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Unknown'}
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Moved by</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{entry.userName || `User ${entry.userId}`}</p>
                            {entry.userRole && <p className="mt-0.5 text-xs text-slate-500">{entry.userRole}</p>}
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Serial</p>
                            <p className="mt-1 font-mono text-sm text-slate-900">{entry.serialNo || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}