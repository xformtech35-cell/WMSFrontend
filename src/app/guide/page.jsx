'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Layers3,
  Package,
  Warehouse,
  Boxes,
  ShoppingCart,
  ScanLine,
  PackageCheck,
  Ship,
  BarChart3,
  Users,
  ShieldCheck,
  Tag,
  Database,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Star,
  BookOpen,
  Zap,
  Lock,
  LayoutDashboard,
  Truck,
  Info,
  UserRound,
} from 'lucide-react';

/* ─── Structured Workflow Phase Data ─────────────────────────────────────── */
const WORKFLOW_PHASES = [
  {
    id: 'inbound',
    phase: '01',
    title: 'Inbound & Receiving',
    color: 'blue',
    icon: Package,
    summary: 'Supplier goods arrive. Operator receives against a Purchase Order and creates a GRN.',
    steps: [
      { step: 'Open the Inbound page from the sidebar navigation.' },
      { step: 'View all active, open Purchase Orders dispatched by suppliers.' },
      { step: 'Select the matching PO from the live list and click the "Receive" button.' },
      { step: 'Enter the exact received quantities per item line (partial receipts supported).' },
      { step: 'Submit to auto-generate a Goods Receipt Note (GRN) and flag inventory as RECEIVED.' },
    ],
    tip: 'If a PO is only partially delivered, leave the remainder open for subsequent receiving.',
  },
  {
    id: 'putaway',
    phase: '02',
    title: 'Putaway Task Execution',
    color: 'green',
    icon: Warehouse,
    summary: 'System generates optimal bin assignments. Operator scans item + bin to store stock.',
    steps: [
      { step: 'Go to the Putaway module once a GRN receiving transaction is completed.' },
      { step: 'View the auto-generated tasks displaying suggested, volume-optimized bin barcodes.' },
      { step: 'Retrieve the physical items and walk to the suggested compartment location.' },
      { step: 'Scan the item barcode using the on-screen scanner to verify correct SKU.' },
      { step: 'Scan the target bin barcode to confirm physical placement.' },
      { step: 'The task closes automatically, and stock state transitions to AVAILABLE.' },
    ],
    tip: 'The putaway engine computes destination bins based on SKU cubic volume vs available bin capacity.',
  },
  {
    id: 'inventory',
    phase: '03',
    title: 'Real-time Inventory Ledger',
    color: 'amber',
    icon: Boxes,
    summary: 'Live bin-level stock visibility with multi-state tracking and manual adjustments.',
    steps: [
      { step: 'Open the Inventory page to inspect the comprehensive WMS stock ledger.' },
      { step: 'Search or filter by SKU, Warehouse, Aisle, or Status (e.g. AVAILABLE, RESERVED).' },
      { step: 'Expand any row to inspect precise bin locations, batches, and timestamps.' },
      { step: 'Managers can adjust quantities manually with dedicated adjustments and reason codes.' },
    ],
    tip: 'Inventory is completely reactive — updates stream in real-time as picking and putaway close.',
  },
  {
    id: 'orders',
    phase: '04',
    title: 'Outbound Sales Orders',
    color: 'purple',
    icon: ShoppingCart,
    summary: 'Submit sales orders. System reserves available stock and generates pick lists.',
    steps: [
      { step: 'Go to the Outbound or Orders module and click "Create Order".' },
      { step: 'Provide customer identifiers and add SKU lines with requested quantities.' },
      { step: 'The system validates AVAILABLE stock, locking and reserving it instantly.' },
      { step: 'Pick tasks are auto-generated, and order status transitions to picking progress.' },
    ],
    tip: 'Only AVAILABLE status stock can be locked for orders. Received or reserved stock is bypassed.',
  },
  {
    id: 'trolleys',
    phase: '05',
    title: 'Trolley & Compartment Rules',
    color: 'indigo',
    icon: Truck,
    summary: 'Assign trolley compartments to orders so pickers can sort items on the floor.',
    steps: [
      { step: 'Open the Trolleys page from the sidebar menu.' },
      { step: 'Select an active trolley and choose a free compartment (e.g. A1, A2).' },
      { step: 'Assign the compartment specifically to an active, unpicked Sales Order.' },
      { step: 'Each compartment stores items for a single order, preventing shipping mix-ups.' },
    ],
    tip: 'A single trolley can be mapped to multiple separate orders, enabling batch picks in one run.',
  },
  {
    id: 'picking',
    phase: '06',
    title: 'Barcode-Scanned Picking',
    color: 'rose',
    icon: ScanLine,
    summary: 'Picker walks to bins, scans items, and loads onto the mapped trolley compartment.',
    steps: [
      { step: 'Open the Picking module and select your active pick session.' },
      { step: 'Follow the guided path: Target Bin → Required SKU → Pick Quantity.' },
      { step: 'Arrive at the bin location and scan the barcode of the physical item.' },
      { step: 'WMS validates the scan; incorrect items trigger an instant warning.' },
      { step: 'Place the item in the mapped compartment, updating order state to PICKED.' },
    ],
    tip: 'Scans are validated instantly against active pick tasks, blocking errors right at the bin.',
  },
  {
    id: 'packing',
    phase: '07',
    title: 'Packing Station Quality Gate',
    color: 'teal',
    icon: PackageCheck,
    summary: 'Verify picked items against sales order manifests at the packing station.',
    steps: [
      { step: 'Open the Packing screen at the packing station.' },
      { step: 'Scan the trolley and compartment barcode to fetch the order packing manifest.' },
      { step: 'Scan each item one by one as you pack them into the final shipping carton.' },
      { step: 'The progress bar updates dynamically as items are validated.' },
      { step: 'Confirm and close the pack session; order state transitions to PACKED.' },
    ],
    tip: 'Packing serves as the final physical check, fully catching picking slip-ups before shipment.',
  },
  {
    id: 'shipping',
    phase: '08',
    title: 'Shipping & AWB Dispatch',
    color: 'slate',
    icon: Ship,
    summary: 'Assign AWB numbers and couriers to dispatch packed cartons from the loading dock.',
    steps: [
      { step: 'Open the Shipping page and view packed orders waiting for dispatch.' },
      { step: 'Provide the tracking AWB number and select the courier (e.g., FedEx, Delhivery).' },
      { step: 'Click "Confirm Shipment" to record the transaction.' },
      { step: 'Stock is removed from the bin ledger, and order status closes as SHIPPED.' },
    ],
    tip: 'A shipment dispatch triggers live log feeds, updating dashboard analytics and financial ledgers.',
  },
];

/* ─── Modules List ──────────────────────────────────────────────────────── */
const MODULES = [
  { icon: LayoutDashboard, label: 'Dashboard',     color: 'blue',   desc: 'Live WMS KPIs, stock charts, active event log' },
  { icon: Package,         label: 'Inbound',        color: 'sky',    desc: 'Receive supplier POs and create GRN logs' },
  { icon: Warehouse,       label: 'Putaway',        color: 'green',  desc: 'Guided scan-in storage for received stock' },
  { icon: Boxes,           label: 'Inventory',      color: 'amber',  desc: 'Reactive ledger for bin-level stock balances' },
  { icon: Database,        label: 'Master Data',    color: 'orange', desc: 'Manage warehouses, zones, aisles, racks, and bins' },
  { icon: ShoppingCart,    label: 'Orders',         color: 'purple', desc: 'Sales order book and automatic pick task engine' },
  { icon: Truck,           label: 'Trolleys',       color: 'indigo', desc: 'Compartment mapping rules for order sorting' },
  { icon: ScanLine,        label: 'Picking',        color: 'rose',   desc: 'Guided path floor picking with scan checks' },
  { icon: PackageCheck,    label: 'Packing',        color: 'teal',   desc: 'Station verification against packing manifests' },
  { icon: Ship,            label: 'Shipping',       color: 'slate',  desc: 'Courier manifest registry and final dispatch' },
  { icon: BarChart3,       label: 'Reports',        color: 'cyan',   desc: 'Performance metrics and structured Excel exports' },
  { icon: Tag,             label: 'Labels',         color: 'lime',   desc: 'Generate printable barcode labels for bins & SKUs' },
  { icon: Users,           label: 'Users',          color: 'violet', desc: 'Create, modify, and terminate staff accounts' },
  { icon: ShieldCheck,     label: 'Roles',          color: 'pink',   desc: 'Define custom permission lists per role' },
];

/* ─── Role Mapping ──────────────────────────────────────────────────────── */
const ROLES = [
  { role: 'Super Admin',       color: 'red',    access: ['Full system bypass', 'System configurations', 'Staff creation', 'Master structures'] },
  { role: 'Admin',             color: 'orange', access: ['Roles setup', 'Master data registers', 'Label generation', 'User profiles'] },
  { role: 'Warehouse Manager', color: 'purple', access: ['Live dashboard', 'Orders book', 'Inventory audits', 'Performance reports'] },
  { role: 'Supervisor',        color: 'blue',   access: ['Putaway control', 'Manual stock adjustments', 'Trolley registers', 'Shipping logs'] },
  { role: 'Operator (Floor)',  color: 'green',  access: ['PO receiving', 'Putaway execution', 'Picking runs', 'Carton packing'] },
];

/* ─── Demo Credentials ─────────────────────────────────────────────────── */
const DEMO_ACCOUNTS = [
  { role: 'Demo Profile (Client)', user: 'demo',       pass: '12345678', color: 'emerald' },
  { role: 'Super Admin',           user: 'superadmin', pass: '12345678', color: 'red'     },
  { role: 'Admin',                 user: 'admin',      pass: '12345678', color: 'orange'  },
  { role: 'Manager',               user: 'manager',    pass: '12345678', color: 'blue'    },
  { role: 'Worker',                user: 'worker',     pass: '12345678', color: 'green'   },
];

/* ─── System Architecture ───────────────────────────────────────────────── */
const SYSTEM_LAYERS = [
  { icon: Users,           title: 'Operators & Staff',  text: 'Administrators, managers, supervisors, and floor operators', color: 'blue' },
  { icon: LayoutDashboard, title: 'Next.js Frontend',   text: 'Frosted white-mode reactive interface with clean typography', color: 'purple' },
  { icon: ShieldCheck,     title: 'Spring Boot API',    text: 'Secure Java REST endpoints protected with JWT and role filters', color: 'green' },
  { icon: Database,        title: 'MySQL Ledger',       text: 'Live transactional warehouse tables utilizing wms_ prefixing', color: 'amber' },
];

/* ─── Color Maps ────────────────────────────────────────────────────────── */
const PHASE_COLORS = {
  blue:    { bg: 'bg-blue-50 text-blue-600 border-blue-100',       num: 'bg-blue-500',   text: 'text-blue-500' },
  green:   { bg: 'bg-green-50 text-green-600 border-green-100',   num: 'bg-green-500',  text: 'text-green-500' },
  amber:   { bg: 'bg-amber-50 text-amber-600 border-amber-100',   num: 'bg-amber-500',  text: 'text-amber-500' },
  purple:  { bg: 'bg-purple-50 text-purple-600 border-purple-100', num: 'bg-purple-500', text: 'text-purple-500' },
  indigo:  { bg: 'bg-indigo-50 text-indigo-600 border-indigo-100', num: 'bg-indigo-500', text: 'text-indigo-500' },
  rose:    { bg: 'bg-rose-50 text-rose-600 border-rose-100',       num: 'bg-rose-500',   text: 'text-rose-500' },
  teal:    { bg: 'bg-teal-50 text-teal-600 border-teal-100',       num: 'bg-teal-500',   text: 'text-teal-500' },
  slate:   { bg: 'bg-slate-50 text-slate-600 border-slate-200',    num: 'bg-slate-600',  text: 'text-slate-600' },
  sky:     { bg: 'bg-sky-50 text-sky-600 border-sky-100',          num: 'bg-sky-500',    text: 'text-sky-500' },
  orange:  { bg: 'bg-orange-50 text-orange-600 border-orange-100', num: 'bg-orange-500', text: 'text-orange-500' },
  cyan:    { bg: 'bg-cyan-50 text-cyan-600 border-cyan-100',       num: 'bg-cyan-500',   text: 'text-cyan-500' },
  lime:    { bg: 'bg-lime-50 text-lime-600 border-lime-100',       num: 'bg-lime-500',   text: 'text-lime-500' },
  violet:  { bg: 'bg-violet-50 text-violet-600 border-violet-100', num: 'bg-violet-500', text: 'text-violet-500' },
  pink:    { bg: 'bg-pink-50 text-pink-600 border-pink-100',       num: 'bg-pink-500',   text: 'text-pink-500' },
  red:     { bg: 'bg-red-50 text-red-600 border-red-100',          num: 'bg-red-500',    text: 'text-red-500' },
  emerald: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', num: 'bg-emerald-500', text: 'text-emerald-500' },
};

/* ─── UI Sub-components ─────────────────────────────────────────────────── */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-xs xl:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function WorkflowPhaseCard({ phase, isOpen, onToggle }) {
  const c = PHASE_COLORS[phase.color] ?? PHASE_COLORS.blue;
  const Icon = phase.icon;
  return (
    <div className="rounded-3xl border border-slate-150 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-6 py-4.5 text-left transition-colors hover:bg-slate-50/40"
      >
        <span className={`shrink-0 flex size-9 items-center justify-center rounded-xl ${c.num} text-white font-bold text-sm shadow-sm`}>
          {phase.phase}
        </span>
        <span className="shrink-0 flex size-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
          <Icon className={`size-4 ${c.text}`} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm xl:text-base leading-tight">{phase.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 leading-normal">{phase.summary}</p>
        </div>
        {isOpen ? (
          <ChevronUp className="size-4 text-slate-400 shrink-0 transition-transform duration-300" />
        ) : (
          <ChevronDown className="size-4 text-slate-400 shrink-0 transition-transform duration-300" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2.5 border-t border-slate-100 bg-slate-50/20">
          <ol className="space-y-3 mt-2">
            {phase.steps.map((s, i) => (
              <li key={i} className="flex gap-3.5 items-start">
                <span className={`shrink-0 size-5.5 rounded-full ${c.num} text-white text-[10px] font-extrabold flex items-center justify-center mt-0.5 shadow-sm`}>
                  {i + 1}
                </span>
                <span className="text-xs xl:text-sm text-slate-600 leading-relaxed">{s.step}</span>
              </li>
            ))}
          </ol>
          {phase.tip && (
            <div className={`mt-4.5 flex gap-2.5 rounded-2xl ${c.bg} border border-slate-150 p-4`}>
              <Star className={`size-4 ${c.text} shrink-0 mt-0.5`} />
              <p className="text-xs leading-relaxed text-slate-600">
                <span className="font-bold">Pro Tip: </span>{phase.tip}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ArchitectureNode({ item }) {
  const c = PHASE_COLORS[item.color] ?? PHASE_COLORS.blue;
  const Icon = item.icon;

  return (
    <div className="rounded-2xl border border-slate-150 bg-white p-4 shadow-sm transition-all hover:scale-[1.01]">
      <div className="flex items-start gap-3">
        <span className={`flex size-9 items-center justify-center rounded-xl ${c.num} text-white shadow-sm shrink-0`}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs xl:text-sm font-bold text-slate-800 leading-tight">{item.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400 font-medium">{item.text}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Guide Screen ─────────────────────────────────────────────────── */
export default function GuidePage() {
  const [openPhase, setOpenPhase] = useState('inbound');

  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] text-slate-800 font-sans select-none">
      {/* Sleek light background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-40 pointer-events-none" />
      
      {/* Ambient gradient graphics */}
      <div className="absolute -left-20 -top-20 size-[450px] rounded-full bg-indigo-200/20 blur-[100px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 size-[450px] rounded-full bg-sky-200/20 blur-[100px] pointer-events-none" />

      {/* Sticky Top Nav Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-xl bg-indigo-600 text-white shadow shadow-indigo-600/20">
              <Layers3 className="size-3.5" />
            </span>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">WMS Pro</span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
              <BookOpen className="size-2.5" /> Documentation Portal
            </span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            <ArrowLeft className="size-3.5" /> Back to Sign In
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 md:px-6 pb-24">
        
        {/* Hero Section */}
        <section className="py-14 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-[10px] font-bold text-indigo-600 mb-5 shadow-sm">
            <Zap className="size-3" /> WMS Operations Reference Blueprint
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
            How to Operate <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">WMS Pro</span>
          </h1>
          <p className="mt-4.5 max-w-xl mx-auto text-xs sm:text-sm text-slate-500 leading-relaxed">
            A comprehensive, end-to-end user guide walking you through every transactional phase — from supplier receiving to outbound parcel dispatch.
          </p>
        </section>

        {/* Demo Credentials Registry */}
        <section className="mb-14 relative">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-slate-200 via-indigo-100 to-slate-200 rounded-[2rem] blur-sm opacity-60 pointer-events-none" />
          <div className="relative rounded-[2rem] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm">
                <UserRound className="size-4" />
              </span>
              <div>
                <p className="font-bold text-slate-800 text-sm leading-tight">Staff Credentials Registry</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">Select profiles inside the sign-in form to log in instantly</p>
              </div>
            </div>
            <div className="grid gap-0 divide-y divide-slate-100 sm:grid-cols-2 lg:grid-cols-5 sm:divide-y-0 sm:divide-x">
              {DEMO_ACCOUNTS.map((d) => {
                const c = PHASE_COLORS[d.color] ?? PHASE_COLORS.blue;
                return (
                  <Link
                    key={d.user}
                    href="/login"
                    className="group flex items-center justify-between gap-3 px-4.5 py-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`size-7.5 flex items-center justify-center rounded-xl ${c.num} text-white text-xs font-bold shrink-0 shadow-sm`}>
                        {d.role[0]}
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">{d.role}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{d.user} / {d.pass}</p>
                      </div>
                    </div>
                    <ArrowRight className="size-3 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* System Architecture Flow */}
        <section className="mb-14">
          <SectionHeader 
            title="System Architecture Flow" 
            subtitle="Understand how transactions execute through our secure UI, API, and database stack."
          />
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {SYSTEM_LAYERS.map((item) => (
              <ArchitectureNode key={item.title} item={item} />
            ))}
          </div>
        </section>

        {/* Inventory State Lifecycle */}
        <section className="mb-14">
          <SectionHeader 
            title="Inventory State Lifecycle" 
            subtitle="Track state changes on the ledgers as items proceed through operational physical gates."
          />
          <div className="rounded-3xl border border-slate-150 bg-white p-5 overflow-x-auto shadow-sm">
            <div className="flex items-center justify-start gap-2.5 min-w-max mx-auto w-fit px-2 py-1">
              {[
                { label: 'RECEIVED',   bg: 'bg-blue-50 border-blue-100 text-blue-600',       icon: '📥', trigger: 'GRN Created' },
                { label: 'IN_PUTAWAY', bg: 'bg-amber-50 border-amber-100 text-amber-600',   icon: '🔄', trigger: 'Scan Started' },
                { label: 'AVAILABLE',  bg: 'bg-green-50 border-green-100 text-green-600',   icon: '✅', trigger: 'Bin Placement' },
                { label: 'RESERVED',   bg: 'bg-purple-50 border-purple-100 text-purple-600', icon: '🔒', trigger: 'Sales Order' },
                { label: 'PICKED',     bg: 'bg-rose-50 border-rose-100 text-rose-600',       icon: '📤', trigger: 'Pick Scanned' },
                { label: 'PACKED',     bg: 'bg-teal-50 border-teal-100 text-teal-600',       icon: '📦', trigger: 'Pack Verified' },
                { label: 'SHIPPED',    bg: 'bg-slate-50 border-slate-200 text-slate-600',    icon: '🚚', trigger: 'Dock Dispatch' },
              ].map((s, i, arr) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={`flex flex-col items-center rounded-2xl ${s.bg} border px-4 py-3 min-w-22 shadow-sm`}>
                      <span className="text-xl leading-none mb-1">{s.icon}</span>
                      <span className="text-[10px] font-bold tracking-wide whitespace-nowrap">{s.label}</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap leading-none">{s.trigger}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ChevronRight className="size-4 text-slate-300 shrink-0 mb-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Operational Workflow Map */}
        <section className="mb-14">
          <SectionHeader 
            title="Operational Workflow Map" 
            subtitle="Visualized step-by-step logic detailing inbound and outbound physical stock streams."
          />
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Inbound Pipeline Card */}
            <div className="rounded-3xl border border-slate-150 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600 shadow-sm shrink-0">
                    <Package className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm leading-none">Inbound Logistics Stream</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Supplier Receiving & Storage Placement</p>
                  </div>
                </div>

                <div className="relative pl-6 border-l-2 border-dashed border-slate-200 space-y-6">
                  {/* Step 1 */}
                  <div className="relative">
                    <span className="absolute -left-[35px] top-0 size-6 rounded-full bg-blue-500 text-white font-extrabold text-[10px] flex items-center justify-center border border-white shadow-sm">
                      1
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-none">Purchase Orders</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Dispatched goods are logged in the WMS system by suppliers or purchasing teams.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <span className="absolute -left-[35px] top-0 size-6 rounded-full bg-blue-500 text-white font-extrabold text-[10px] flex items-center justify-center border border-white shadow-sm">
                      2
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-none">Dock Receiving & GRN</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Operator counts received items at the unloading dock and generates a GRN (State: <code className="bg-slate-100 px-1 rounded text-blue-600 text-[9px] font-bold">RECEIVED</code>).
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <span className="absolute -left-[35px] top-0 size-6 rounded-full bg-blue-500 text-white font-extrabold text-[10px] flex items-center justify-center border border-white shadow-sm">
                      3
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-none">Putaway Engine Route</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      WMS analyzes dimensions, allocating optimized destination bins based on storage occupancy (State: <code className="bg-slate-100 px-1 rounded text-amber-600 text-[9px] font-bold">IN_PUTAWAY</code>).
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="relative">
                    <span className="absolute -left-[35px] top-0 size-6 rounded-full bg-green-500 text-white font-extrabold text-[10px] flex items-center justify-center border border-white shadow-sm">
                      4
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-none">Storage Committed</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Operator walks to location, scans item + bin, and commits inventory to the bin ledger (State: <code className="bg-slate-100 px-1 rounded text-green-600 text-[9px] font-bold">AVAILABLE</code>).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Outbound Pipeline Card */}
            <div className="rounded-3xl border border-slate-150 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm shrink-0">
                    <ShoppingCart className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm leading-none">Outbound Fulfillment Stream</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Floor Picking, Packing Station & Dispatch</p>
                  </div>
                </div>

                <div className="relative pl-6 border-l-2 border-dashed border-slate-200 space-y-6">
                  {/* Step 5 */}
                  <div className="relative">
                    <span className="absolute -left-[35px] top-0 size-6 rounded-full bg-indigo-500 text-white font-extrabold text-[10px] flex items-center justify-center border border-white shadow-sm">
                      5
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-none">Sales Orders</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Customer orders are created, system checks live stock levels, and locks quantities (State: <code className="bg-slate-100 px-1 rounded text-purple-600 text-[9px] font-bold">RESERVED</code>).
                    </p>
                  </div>

                  {/* Step 6 */}
                  <div className="relative">
                    <span className="absolute -left-[35px] top-0 size-6 rounded-full bg-indigo-500 text-white font-extrabold text-[10px] flex items-center justify-center border border-white shadow-sm">
                      6
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-none">Floor Picking Run</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Operator sorts tasks onto trolleys, scans items from bins, and completes floor retrieval checklist (State: <code className="bg-slate-100 px-1 rounded text-rose-600 text-[9px] font-bold">PICKED</code>).
                    </p>
                  </div>

                  {/* Step 7 */}
                  <div className="relative">
                    <span className="absolute -left-[35px] top-0 size-6 rounded-full bg-indigo-500 text-white font-extrabold text-[10px] flex items-center justify-center border border-white shadow-sm">
                      7
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-none">Station Packing Gate</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Packer scans carton container, verifying each item against sales order manifests to ensure zero dispatch errors (State: <code className="bg-slate-100 px-1 rounded text-teal-600 text-[9px] font-bold">PACKED</code>).
                    </p>
                  </div>

                  {/* Step 8 */}
                  <div className="relative">
                    <span className="absolute -left-[35px] top-0 size-6 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] flex items-center justify-center border border-white shadow-sm">
                      8
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-none">Carrier Dispatch</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      carton receives tracking barcode (AWB) and courier registration; ledger inventory is fully deducted (State: <code className="bg-slate-100 px-1 rounded text-slate-600 text-[9px] font-bold">SHIPPED</code>).
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Step by Step Operations */}
        <section id="workflow" className="mb-14">
          <SectionHeader 
            title="Step-by-Step Operations" 
            subtitle="Click on any operational phase to expand the detailed instructions."
          />
          <div className="space-y-3">
            {WORKFLOW_PHASES.map((phase) => (
              <WorkflowPhaseCard
                key={phase.id}
                phase={phase}
                isOpen={openPhase === phase.id}
                onToggle={() => setOpenPhase(openPhase === phase.id ? null : phase.id)}
              />
            ))}
          </div>
        </section>

        {/* System Modules Index */}
        <section id="modules" className="mb-14">
          <SectionHeader 
            title="All System Modules" 
            subtitle="A full directory of all sections mapped within the navigation sidebar."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {MODULES.map((m) => {
              const Icon = m.icon;
              const c = PHASE_COLORS[m.color] ?? PHASE_COLORS.blue;
              return (
                <div
                  key={m.label}
                  className={`group rounded-2xl border border-slate-150 bg-white p-4.5 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:border-indigo-100 hover:bg-indigo-50/5`}
                >
                  <span className={`flex size-9 items-center justify-center rounded-xl ${c.num} text-white mb-3 shadow-sm`}>
                    <Icon className="size-4.5" />
                  </span>
                  <span className="text-xs font-bold text-slate-800 leading-tight mb-1">{m.label}</span>
                  <span className="text-[10px] text-slate-400 leading-relaxed font-medium">{m.desc}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Roles Access Matrix */}
        <section className="mb-14">
          <SectionHeader 
            title="Roles Access Matrix" 
            subtitle="Each user profile has assigned permissions mapping strictly to their operational flow."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ROLES.map((r) => {
              const c = PHASE_COLORS[r.color] ?? PHASE_COLORS.blue;
              return (
                <div key={r.role} className="rounded-2xl border border-slate-150 bg-white p-4.5 shadow-sm transition-all hover:scale-[1.01]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`size-6 flex items-center justify-center rounded-lg ${c.num} text-white text-[10px] font-bold shadow-sm`}>
                      {r.role[0]}
                    </span>
                    <span className="font-bold text-slate-800 text-xs xl:text-sm tracking-tight">{r.role}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {r.access.map((a) => (
                      <li key={a} className="flex items-center gap-1.5 text-[10px] xl:text-xs text-slate-500 font-medium">
                        <CheckCircle2 className={`size-3 ${c.text} shrink-0`} />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          
          <div className="mt-5 rounded-2xl border border-amber-150 bg-amber-50/50 px-5 py-4 flex gap-3 shadow-sm">
            <Info className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Role permissions are customizable dynamically. Administrators can allocate or revoke specific permission keys 
              (e.g., <code className="font-mono bg-slate-100 text-slate-800 px-1 rounded border border-slate-200">ORDERS_CREATE</code> or 
              <code className="font-mono bg-slate-100 text-slate-800 px-1 rounded border border-slate-200 ml-1">INVENTORY_ADJUST</code>) as required.
            </p>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section>
          <div className="rounded-[2.5rem] border border-slate-150 bg-white shadow-sm p-8 text-center relative overflow-hidden">
            <div className="absolute right-[-4rem] top-[-4rem] size-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-4rem] left-[-4rem] size-64 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-md shadow-indigo-600/5 mb-5">
                <Layers3 className="size-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to explore?</h2>
              <p className="text-xs xl:text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
                Establish a session with any staff profile key to test picking, packing, inbound tracking, or report exports immediately.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/10 hover:from-indigo-500 hover:to-indigo-600 transition-all hover:-translate-y-[1px] hover:shadow-lg active:scale-[0.98]"
              >
                Launch Secure Sign In <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
