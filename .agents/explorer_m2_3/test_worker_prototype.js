/**
 * Prototype script to verify Node.js worker_threads wrapper for elsWorker.js testing.
 */
const { Worker: NodeWorker } = require('worker_threads');
const path = require('path');
const { TORAH_TEXT } = require('../../torah_text.js');
const Engine = require('../../gematria.js');

// Standardized Worker Adapter for Node.js test environment
class WorkerAdapter {
  constructor(scriptPath) {
    this.worker = new NodeWorker(scriptPath);
    this.onmessage = null;
    this.onerror = null;

    this.worker.on('message', (data) => {
      if (typeof this.onmessage === 'function') {
        this.onmessage({ data });
      }
    });

    this.worker.on('error', (err) => {
      if (typeof this.onerror === 'function') {
        this.onerror(err);
      }
    });
  }

  postMessage(data) {
    this.worker.postMessage(data);
  }

  terminate() {
    return this.worker.terminate();
  }
}

console.log("WorkerAdapter prototype created successfully.");
