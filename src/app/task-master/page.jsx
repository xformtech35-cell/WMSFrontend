'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  UserPlus,
  Calendar,
  Flag,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useToast } from '@/components/ui/use-toast';
// Types for tasks
const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue'
};

const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const TaskMaster = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', { search: searchTerm, status: statusFilter, priority: priorityFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      
      const response = await api.get(`/task-master/tasks?${params}`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch workers for assignment
  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get('/task-master/workers').then(res => res.data),
    enabled: isDialogOpen,
  });

  // Create task mutation
  const createTask = useMutation({
    mutationFn: (taskData) => api.post('/task-master/tasks', taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast({ title: 'Task created successfully', variant: 'default' });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Failed to create task', description: error.message, variant: 'destructive' });
    },
  });

  // Assign task mutation
  const assignTask = useMutation({
    mutationFn: ({ taskId, workerId }) => 
      api.put(`/task-master/tasks/${taskId}/assign`, { workerId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast({ title: 'Task assigned successfully', variant: 'default' });
    },
    onError: (error) => {
      toast({ title: 'Failed to assign task', description: error.message, variant: 'destructive' });
    },
  });

  // Update task status mutation
  const updateStatus = useMutation({
    mutationFn: ({ taskId, status }) => 
      api.put(`/task-master/tasks/${taskId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast({ title: 'Task status updated', variant: 'default' });
    },
  });

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: (taskId) => api.delete(`/task-master/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast({ title: 'Task deleted successfully', variant: 'default' });
    },
  });

  // Get status badge color
  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || colors.pending;
  };

  // Get priority badge color
  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[priority] || colors.low;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Task Master</h1>
          <p className="text-sm text-muted-foreground">Assign and manage tasks for workers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            {/* Task creation form content */}
            <TaskForm 
              workers={workers}
              onSubmit={createTask.mutate}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total Tasks"
          value={tasks.length}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          title="Pending"
          value={tasks.filter(t => t.status === TASK_STATUS.PENDING).length}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="In Progress"
          value={tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Completed Today"
          value={tasks.filter(t => 
            t.status === TASK_STATUS.COMPLETED && 
            new Date(t.updatedAt).toDateString() === new Date().toDateString()
          ).length}
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.values(TASK_STATUS).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {Object.values(TASK_PRIORITY).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No tasks found. Create a new task to get started.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.assignedTo ? (
                        <Badge variant="outline">{task.assignedToName}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadge(task.priority)}>
                        {task.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(task.status)}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(task.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Assign button */}
                        {!task.assignedTo && (
                          <AssignmentDialog
                            task={task}
                            workers={workers}
                            onAssign={(workerId) => 
                              assignTask.mutate({ taskId: task.id, workerId })
                            }
                          />
                        )}
                        
                        {/* Status update dropdown */}
                        {task.status !== TASK_STATUS.COMPLETED && (
                          <StatusUpdateDropdown
                            taskId={task.id}
                            currentStatus={task.status}
                            onUpdate={(status) => 
                              updateStatus.mutate({ taskId: task.id, status })
                            }
                          />
                        )}
                        
                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this task?')) {
                              deleteTask.mutate(task.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon }) => (
  <Card>
    <CardContent className="p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
    </CardContent>
  </Card>
);

const TaskForm = ({ workers, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Task Title *</label>
        <Input
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter task title"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter task description"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Priority</label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TASK_PRIORITY).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Due Date</label>
          <Input
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Assign To</label>
        <Select 
          value={formData.assignedTo} 
          onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a worker" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {workers.map((worker) => (
              <SelectItem key={worker.id} value={worker.id}>
                {worker.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Task
        </Button>
      </div>
    </form>
  );
};

const AssignmentDialog = ({ task, workers, onAssign }) => {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAssign = () => {
    if (selectedWorker) {
      onAssign(selectedWorker);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Assign "{task.title}" to a worker
          </p>
          <Select value={selectedWorker} onValueChange={setSelectedWorker}>
            <SelectTrigger>
              <SelectValue placeholder="Select a worker" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id}>
                  {worker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedWorker}>
              Assign Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StatusUpdateDropdown = ({ taskId, currentStatus, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  const handleStatusUpdate = (status) => {
    onUpdate(status);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusUpdate(option.value)}
            disabled={currentStatus === option.value}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Import needed for dropdown menu
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';

export default TaskMaster;