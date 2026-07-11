'use client';

import React, { useState, useEffect } from 'react';
import { parseGS1 } from '@/lib/utils/gs1Parser';
import { enqueueScan, getQueue, clearQueue, getQueueCount, dequeueScan } from '@/lib/offline/scanQueue';

export default function ScannerTestPage() {
  const [scanInput, setScanInput] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Offline queue state
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [queueCount, setQueueCount] = useState(0);
  const [selectedScanType, setSelectedScanType] = useState('PUTAWAY');
  const [queuePayload, setQueuePayload] = useState('{"itemBarcode":"SKU-001-LOT123-00001", "binBarcode":"BIN-A-1"}');

  // Load offline queue on mount
  useEffect(() => {
    refreshQueue();
  }, []);

  const refreshQueue = async () => {
    try {
      const q = await getQueue();
      setOfflineQueue(q);
      const count = await getQueueCount();
      setQueueCount(count);
    } catch (err) {
      console.error('Error fetching offline queue:', err);
    }
  };

  const handleParse = (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    try {
      const parsed = parseGS1(scanInput);
      if (parsed) {
        setParsedResult(parsed);
        setErrorMessage('');
      } else {
        setParsedResult(null);
        setErrorMessage('Unable to parse. The barcode does not match standard GS1 patterns (AI 01, 10, 17, 21, 11).');
      }
    } catch (err) {
      setParsedResult(null);
      setErrorMessage(err.message || 'Error occurred while parsing.');
    }
  };

  const handleEnqueue = async (e) => {
    e.preventDefault();
    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(queuePayload);
      } catch (jsonErr) {
        parsedPayload = { rawString: queuePayload };
      }

      await enqueueScan(selectedScanType, parsedPayload);
      setQueuePayload('{"itemBarcode":"SKU-001-LOT123-00001", "binBarcode":"BIN-A-1"}');
      refreshQueue();
    } catch (err) {
      alert('Error enqueuing: ' + err.message);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear the offline queue?')) {
      await clearQueue();
      refreshQueue();
    }
  };

  const handleDeleteItem = async (id) => {
    await dequeueScan(id);
    refreshQueue();
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Zebra Hardware Scanner & Offline Verification</h1>
          <p className="text-slate-400 mt-1">Configure DataWedge profiles and test GS1 DataMatrix 2D scanning capabilities.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: DataWedge Setup & Parser Test */}
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Zebra DataWedge Profiles Setup Instructions
            </h2>
            <div className="text-sm text-slate-300 space-y-3">
              <p>For Zebra TC21/TC26, TC52, or other handhelds running DataWedge:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Open <strong>DataWedge</strong> app on the Zebra device.</li>
                <li>Create a new Profile called <code className="bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded">WmsPro</code>.</li>
                <li>Associate the profile with your browser (e.g. Chrome / Kiwi Browser).</li>
                <li>Enable <strong>Barcode Input</strong>, select <strong>Decoder Params</strong> and enable <strong>GS1-128</strong> and <strong>Data Matrix</strong>.</li>
                <li>Scroll to <strong>Keystroke Output</strong>. Set the Action Key Char (Inter-character delay) to <code className="bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded">Tab</code> or <code className="bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded">Enter</code>.</li>
                <li>Alternatively, enable <strong>Intent Output</strong> and set the action to broad-receive scanning.</li>
              </ol>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              GS1 DataMatrix Parser Sandbox
            </h2>
            <form onSubmit={handleParse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Scan Input (Raw Barcode)</label>
                <input
                  type="text"
                  placeholder="e.g. (01)08901072001234(17)261231(10)LOT9988"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm placeholder:text-slate-700"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Verify Barcode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanInput('(01)08901072001234(17)261231(10)BATCH902(21)SER10093');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Load Mock Perishable
                </button>
              </div>
            </form>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-sm">
                {errorMessage}
              </div>
            )}

            {parsedResult && (
              <div className="mt-6 space-y-4 border-t border-slate-800 pt-6">
                <h3 className="text-md font-semibold text-white">Parsed GS1 Elements</h3>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-2">
                  <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                    <span className="text-slate-500">GTIN (AI 01)</span>
                    <span className="text-white font-semibold">{parsedResult.gtin || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                    <span className="text-slate-500">Batch Number (AI 10)</span>
                    <span className="text-yellow-400 font-semibold">{parsedResult.batchNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                    <span className="text-slate-500">Serial Number (AI 21)</span>
                    <span className="text-teal-400 font-semibold">{parsedResult.serialNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                    <span className="text-slate-500">Expiry Date (AI 17)</span>
                    <span className="text-red-400 font-semibold">{parsedResult.expiryDate || '—'}</span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span className="text-slate-500">Manufacture Date (AI 11)</span>
                    <span className="text-slate-300 font-semibold">{parsedResult.manufactureDate || '—'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: IndexedDB Offline Queue Manager */}
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                IndexedDB Offline Queue Manager
              </h2>
              <span className="bg-amber-950 text-amber-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                {queueCount} Queued Scans
              </span>
            </div>

            <form onSubmit={handleEnqueue} className="space-y-4 mb-6 border-b border-slate-800 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Scan Type</label>
                  <select
                    value={selectedScanType}
                    onChange={(e) => setSelectedScanType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="PUTAWAY">PUTAWAY</option>
                    <option value="PICKING">PICKING</option>
                    <option value="RETURNS">RETURNS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Mock Payload (JSON)</label>
                  <textarea
                    rows={2}
                    value={queuePayload}
                    onChange={(e) => setQueuePayload(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Simulate Offline Scan
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-white">Queue Contents</h3>
                {offlineQueue.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="text-red-400 hover:text-red-300 text-xs font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {offlineQueue.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-sm bg-slate-950 rounded-lg border border-dashed border-slate-800">
                  Offline queue is currently empty.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {offlineQueue.map((item) => (
                    <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-start justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{item.type}</span>
                          <span className="text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <pre className="text-slate-400 mt-1 font-mono bg-slate-900/50 p-1.5 rounded overflow-x-auto text-[10px]">
                          {JSON.stringify(item.payload, null, 2)}
                        </pre>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-500 hover:text-red-400 font-semibold p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
