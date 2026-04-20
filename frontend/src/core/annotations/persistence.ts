import { openDB } from 'idb';
import { PdfAnnotation } from './types';
import { error, debug } from '@/core/logger/service';

const DB_NAME = 'DocCraftAnnotations';
const STORE_NAME = 'annotations';

export const getDb = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const saveAnnotationsToIDB = async (fileHash: string, annotations: PdfAnnotation[]): Promise<void> => {
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.put({ id: fileHash, annotations });
    await tx.done;
    debug('annotation', 'Annotation store flushed to IndexedDB', { count: annotations.length, storageType: 'idb' });
  } catch (err) {
    error('annotation', 'Failed to save to IndexedDB', { error: String(err) });
  }
};

export const loadAnnotationsFromIDB = async (fileHash: string): Promise<PdfAnnotation[]> => {
  try {
    const db = await getDb();
    const result = await db.get(STORE_NAME, fileHash);
    return result ? result.annotations : [];
  } catch (err) {
    error('annotation', 'Failed to load from IndexedDB', { error: String(err) });
    return [];
  }
};

export const saveAnnotationsToServer = async (fileId: string, annotations: PdfAnnotation[]): Promise<void> => {
  try {
    await fetch(`/api/files/${fileId}/annotations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annotations)
    });
    debug('annotation', 'Annotation store flushed to server SQLite', { count: annotations.length, storageType: 'sqlite' });
  } catch (err) {
    error('annotation', 'Failed to save to server', { error: String(err) });
  }
};

export const loadAnnotationsFromServer = async (fileId: string): Promise<PdfAnnotation[]> => {
  try {
    const res = await fetch(`/api/files/${fileId}/annotations`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    error('annotation', 'Failed to load from server', { error: String(err) });
    return [];
  }
};
