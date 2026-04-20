import { log, error } from '@/core/logger/service';

export class FileAdapter {
  private static MAX_SIZE_MB = 100;
  private static MAX_SIZE_BYTES = this.MAX_SIZE_MB * 1024 * 1024;

  static async openFromInput(file: File): Promise<ArrayBuffer> {
    const startTime = performance.now();
    
    if (file.type !== 'application/pdf') {
      const msg = `Invalid file type: ${file.type}. Expected application/pdf.`;
      error('system', msg);
      throw new Error(msg);
    }

    if (file.size > this.MAX_SIZE_BYTES) {
      const msg = `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max allowed is ${this.MAX_SIZE_MB}MB.`;
      error('system', msg);
      throw new Error(msg);
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const openTimeMs = Math.round(performance.now() - startTime);
      
      log('session', 'File opened', {
        fileName: file.name,
        fileSizeBytes: file.size,
        openTimeMs
      });
      
      return arrayBuffer;
    } catch (err) {
      error('system', 'Failed to read file buffer', { fileName: file.name, error: String(err) });
      throw err;
    }
  }

  static downloadFile(buffer: ArrayBuffer, name: string): void {
    try {
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      log('session', 'File downloaded', { fileName: name, fileSizeBytes: buffer.byteLength });
    } catch (err) {
      error('system', 'Failed to download file', { fileName: name, error: String(err) });
      throw err;
    }
  }
}
