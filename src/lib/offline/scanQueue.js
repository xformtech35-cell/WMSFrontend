const DB_NAME = 'WmsOfflineScanner';
import api from '@/lib/api';

const DB_VERSION = 1;
const STORE_NAME = 'scans';

function getDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in the browser'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Enqueues a scan to the offline buffer.
 * @param {string} type Scan context type (e.g. 'PUTAWAY', 'PICKING', 'RETURNS')
 * @param {object} payload The scanned payload (barcodes, inputs, metadata)
 */
export async function enqueueScan(type, payload) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({
      type,
      payload,
      timestamp: Date.now()
    });

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Attempts to sync the offline queue with the backend.
 * Iterates through stored scans, posts them to the API, and dequeues on success.
 * @returns {Promise<{synced: number, failed: number}>}
 */
export async function syncQueue() {
  const queue = await getQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  // Map scan types to API endpoints
  const endpointMap = {
    PUTAWAY: '/api/putaway/scan',
    PICKING: '/api/picking/scan',
    PACKING: 'api/packing/scan',
    // Add other endpoints as needed
  };

  for (const item of queue) {
    const endpoint = endpointMap[item.type];
    if (!endpoint) {
      console.error(`No endpoint mapping for scan type: ${item.type}`);
      failed++;
      continue;
    }

    try {
      await api.post(endpoint, item.payload);
      await dequeueScan(item.id); // Remove from queue on success
      synced++;
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Retrieves all scans in the queue.
 * @returns {Promise<Array>} List of queued scans
 */
export async function getQueue() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by timestamp just in case
      const sorted = request.result.sort((a, b) => a.timestamp - b.timestamp);
      resolve(sorted);
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Removes a scan from the queue by ID.
 * @param {number} id The auto-incremented ID of the scan
 */
export async function dequeueScan(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Gets the number of items currently in the queue.
 * @returns {Promise<number>}
 */
export async function getQueueCount() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Clears the queue entirely.
 */
export async function clearQueue() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
}
