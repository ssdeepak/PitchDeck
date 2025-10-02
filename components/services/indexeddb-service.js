/**
 * IndexedDB Storage Service
 * Persistent storage for canvases and configurations
 */

const DB_NAME = 'NeuroNotesDB';
const DB_VERSION = 2;
const CANVAS_STORE = 'canvases';

class IndexedDBService {
  constructor() {
    this.db = null;
  }

  /**
   * Open/initialize the database
   */
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create canvases store if it doesn't exist
        if (!db.objectStoreNames.contains(CANVAS_STORE)) {
          const store = db.createObjectStore(CANVAS_STORE, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure DB is open
   */
  async ensureOpen() {
    if (!this.db) {
      await this.openDB();
    }
  }

  /**
   * Save a canvas to the database
   */
  async saveCanvas(canvas) {
    await this.ensureOpen();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CANVAS_STORE], 'readwrite');
      const store = transaction.objectStore(CANVAS_STORE);

      const canvasData = {
        ...canvas,
        id: canvas.id || Date.now(),
        timestamp: Date.now()
      };

      const request = store.put(canvasData);

      request.onsuccess = () => resolve(canvasData.id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Load all canvases from the database
   */
  async loadCanvases() {
    await this.ensureOpen();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CANVAS_STORE], 'readonly');
      const store = transaction.objectStore(CANVAS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const canvases = request.result || [];
        // Sort by timestamp, newest first
        canvases.sort((a, b) => b.timestamp - a.timestamp);
        resolve(canvases);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Load a specific canvas by ID
   */
  async loadCanvas(id) {
    await this.ensureOpen();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CANVAS_STORE], 'readonly');
      const store = transaction.objectStore(CANVAS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a canvas from the database
   */
  async deleteCanvas(id) {
    await this.ensureOpen();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CANVAS_STORE], 'readwrite');
      const store = transaction.objectStore(CANVAS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get the most recent canvas
   */
  async getLastCanvas() {
    const canvases = await this.loadCanvases();
    return canvases.length > 0 ? canvases[0] : null;
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll() {
    await this.ensureOpen();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CANVAS_STORE], 'readwrite');
      const store = transaction.objectStore(CANVAS_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
