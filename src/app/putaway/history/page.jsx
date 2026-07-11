'use client';
export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, History, MapPin, User, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import Link from 'next/link';

export default function PutawayHistoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serialNo = searchParams.get('serialNo') || '';

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!serialNo) return;
    setIsLoading(true);
    setError(null);
    api.get('/putaway/history', { params: { serialNo } })
      .then((response) => {
        setHistory(Array.isArray(response.data) ? response.data : []);
      })
      .catch((err) => {
        console.warn('Failed to load putaway history', err);
        setError('Unable to load history');
        setHistory([]);
      })
      .finally(() => setIsLoading(false));
  }, [serialNo]);

  const title = serialNo ? `History for ${serialNo}` : 'Putaway History';

  const rows = useMemo(() => history, [history]);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Putaway History</h1>
            <p className="text-sm text-slate-600 mt-1">Review completed movements, actors, and bin recommendations.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/putaway">
              <Button variant="outline" className="inline-flex items-center gap-2 px-4 py-2">
                <ArrowLeft className="w-4 h-4" /> Back to Putaway
              </Button>
            </Link>
            <Button onClick={() => router.push(`/putaway/history?serialNo=${encodeURIComponent(serialNo)}`)} className="inline-flex items-center gap-2 px-4 py-2">
              <History className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{title}</p>
              {serialNo && (
                <p className="mt-2 text-slate-600 text-sm">Showing history for the scanned serial number.</p>
              )}
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-700">
              {rows.length} record{rows.length === 1 ? '' : 's'}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-16 text-slate-400">Loading history...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ClipboardList className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-sm">No putaway history found. Scan a serial number on the Putaway page to load records.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {rows.map((entry) => (
                <div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{entry.action?.replace(/_/g, ' ') || 'Putaway'}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{entry.createdAt ? format(new Date(entry.createdAt), 'dd MMM yyyy HH:mm:ss') : 'Unknown time'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-200">
                        <MapPin className="w-3 h-3" /> {entry.binBarcode || 'Unknown Bin'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-200">
                        <History className="w-3 h-3" /> {entry.suggestedBinBarcode || 'No suggested bin'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 border border-slate-200">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Actor</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{entry.userName || `User ${entry.userId}`}</p>
                      {entry.userRole && <p className="mt-1 text-xs text-slate-500">{entry.userRole}</p>}
                    </div>
                    <div className="rounded-2xl bg-white p-4 border border-slate-200">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Serial</p>
                      <p className="mt-2 font-mono text-sm text-slate-900">{entry.serialNo || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
