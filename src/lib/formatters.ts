import { serverTimestamp } from 'firebase/firestore';
import type { FirestoreTimestampLike } from '../types/spark';

export function toEpochMs(value: FirestoreTimestampLike): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return value.toDate().getTime();
    }
    if (typeof value.seconds === 'number') {
      return value.seconds * 1000;
    }
  }
  return 0;
}

export function formatTimestamp(value: FirestoreTimestampLike, includeTime = false): string {
  const ms = toEpochMs(value);
  if (!ms) return '—';
  const date = new Date(ms);
  if (includeTime) {
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function normalizeTags(tags: string[] | string | undefined): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }
  return String(tags)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Matches the existing collection's timestamp format (ISO string vs Firestore Timestamp)
 * so writes stay consistent with the shared Student + Admin database.
 */
export function buildWriteTimestamp(sampleValues: FirestoreTimestampLike[]): string | ReturnType<typeof serverTimestamp> {
  for (const val of sampleValues) {
    if (typeof val === 'string' && val.length > 0) {
      return new Date().toISOString();
    }
    if (val && typeof val === 'object') {
      if (typeof val.toDate === 'function' || 'seconds' in val) {
        return serverTimestamp();
      }
    }
  }
  return new Date().toISOString();
}

export function getInitials(name?: string | null, fallback = 'S'): string {
  if (!name || !name.trim()) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
